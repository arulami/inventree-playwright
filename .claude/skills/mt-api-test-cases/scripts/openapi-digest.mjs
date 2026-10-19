#!/usr/bin/env node
// Prints a compact markdown digest of the OpenAPI operations under a path prefix,
// so API requirements can be derived without reading the full (multi-MB) schema.
//
// Usage: node openapi-digest.mjs <path-prefix> [--schema <url-or-file>] [--paths-only] [--exact]
//   <path-prefix>  e.g. /api/part/  (with --exact, only that one path)
//   --schema       defaults to https://demo.inventree.org/api/schema/?format=json
//   --paths-only   list operations without parameters and schemas
import fs from 'fs'

const DEFAULT_SCHEMA = 'https://demo.inventree.org/api/schema/?format=json'
const METHODS = ['get', 'post', 'put', 'patch', 'delete']
const PAGINATION_PARAMS = ['limit', 'offset', 'ordering', 'search']

const args = process.argv.slice(2)
const option = name => {
    const index = args.indexOf(name)
    return index === -1 ? undefined : args.splice(index, 2)[1]
}
const flag = name => {
    const index = args.indexOf(name)
    if (index !== -1) args.splice(index, 1)
    return index !== -1
}
const schemaSource = option('--schema') ?? DEFAULT_SCHEMA
const pathsOnly = flag('--paths-only')
const exact = flag('--exact')
const prefix = args[0]
if (!prefix) {
    console.error('Usage: node openapi-digest.mjs <path-prefix> [--schema <url-or-file>] [--paths-only] [--exact]')
    process.exit(2)
}

async function loadSpec(source) {
    if (/^https?:\/\//.test(source)) {
        const response = await fetch(source, { headers: { Accept: 'application/json' } })
        if (!response.ok) throw new Error(`GET ${source} returned ${response.status}`)
        return response.json()
    }
    return JSON.parse(fs.readFileSync(source, 'utf-8'))
}

const spec = await loadSpec(schemaSource)
const resolve = schema => {
    if (!schema?.$ref) return schema
    return resolve(spec.components.schemas[schema.$ref.split('/').pop()])
}
const refName = schema => schema?.$ref?.split('/').pop()

// One-line description of a property: type and every constraint the schema states
function describeProperty(property) {
    const resolved = resolve(property)
    const parts = []
    if (resolved.oneOf || resolved.anyOf) {
        parts.push((resolved.oneOf || resolved.anyOf).map(option => describeProperty(option)).join(' OR '))
    } else if (resolved.allOf) {
        parts.push(resolved.allOf.map(option => describeProperty(option)).join(' + '))
    } else {
        let type = resolved.type ?? (refName(property) ? `enum ${refName(property)}` : 'any')
        if (resolved.format) type += `(${resolved.format})`
        if (resolved.type === 'array') type = `array<${describeProperty(resolved.items ?? {})}>`
        parts.push(type)
    }
    if (resolved.enum) parts.push(`enum [${resolved.enum.map(value => JSON.stringify(value)).join(', ')}]`)
    for (const key of ['maxLength', 'minLength', 'minimum', 'maximum', 'pattern']) {
        if (resolved[key] !== undefined) parts.push(`${key} ${resolved[key]}`)
    }
    if (property.nullable || resolved.nullable) parts.push('nullable')
    if (resolved.default !== undefined) parts.push(`default ${JSON.stringify(resolved.default)}`)
    if (property.writeOnly || resolved.writeOnly) parts.push('write-only')
    return parts.join(', ')
}

function describeRequestSchema(name, schema) {
    const resolved = resolve(schema)
    const properties = resolved.properties ?? {}
    const readOnly = Object.keys(properties).filter(key => properties[key].readOnly)
    const writable = Object.keys(properties).filter(key => !properties[key].readOnly)
    const requiredForRequest = (resolved.required ?? []).filter(key => !properties[key]?.readOnly)
    const lines = [`### ${name}`, '']
    if (resolved.description) lines.push(`_${resolved.description.split('\n')[0]}_`, '')
    lines.push(`**Required in request:** ${requiredForRequest.length ? requiredForRequest.map(key => `\`${key}\``).join(', ') : 'none'}`, '')
    lines.push('| Field | Constraints | Description |', '|---|---|---|')
    for (const key of writable) {
        const description = (properties[key].description ?? resolve(properties[key]).description ?? '').replace(/\s+/g, ' ').replace(/\|/g, '\\|')
        lines.push(`| \`${key}\`${requiredForRequest.includes(key) ? ' *' : ''} | ${describeProperty(properties[key]).replace(/\|/g, '\\|')} | ${description.slice(0, 120)} |`)
    }
    if (readOnly.length) lines.push('', `**Read-only (ignored on write):** ${readOnly.map(key => `\`${key}\``).join(', ')}`)
    return lines.join('\n')
}

const describeScopes = security => {
    const scopes = (security ?? []).flatMap(entry => entry.oauth2 ?? [])
    return scopes.length ? scopes.map(scope => `\`${scope}\``).join(' or ') : 'none stated'
}

const operations = Object.entries(spec.paths)
    .filter(([apiPath]) => (exact ? apiPath === prefix : apiPath.startsWith(prefix)))
    .flatMap(([apiPath, item]) => METHODS.filter(method => item[method]).map(method => ({ apiPath, method, operation: item[method], shared: item.parameters ?? [] })))

if (!operations.length) {
    console.error(`No operations match ${exact ? 'exactly' : 'prefix'} ${prefix}`)
    process.exit(1)
}

const output = [
    `# API digest: \`${prefix}\``,
    '',
    `Source: ${schemaSource} · OpenAPI ${spec.openapi} · ${spec.info.title} version **${spec.info.version}** · generated ${new Date().toISOString().slice(0, 10)}`,
    `Paths: ${new Set(operations.map(op => op.apiPath)).size} · Operations: ${operations.length}`,
    `Security schemes: ${Object.keys(spec.components.securitySchemes ?? {}).join(', ')}. OAuth2 scopes read \`r:<action>:<ruleset>\` (the role permission an operation needs).`,
    '',
    '> Only documented responses are listed. Error statuses (400/401/403/404) are not in the schema; source them from the API conventions.',
    '',
    '## Operations',
    '',
]

const requestSchemas = new Map()
for (const { apiPath, method, operation, shared } of operations) {
    const responses = Object.keys(operation.responses ?? {}).join(', ')
    output.push(`### ${method.toUpperCase()} ${apiPath}`, '')
    output.push(`- operationId \`${operation.operationId}\` · responses: ${responses} · scopes: ${describeScopes(operation.security)}`)
    if (operation.description) output.push(`- ${operation.description.split('\n')[0].trim()}`)
    if (pathsOnly) { output.push(''); continue }

    const parameters = [...shared, ...(operation.parameters ?? [])].map(resolve)
    const pathParams = parameters.filter(param => param.in === 'path')
    const queryParams = parameters.filter(param => param.in === 'query')
    if (pathParams.length) output.push(`- path: ${pathParams.map(param => `\`${param.name}\` ${describeProperty(param.schema ?? {})}`).join('; ')}`)
    for (const name of PAGINATION_PARAMS) {
        const param = queryParams.find(candidate => candidate.name === name)
        if (!param) continue
        const enumValues = resolve(param.schema ?? {})?.enum
        const detail = enumValues ? `values: ${enumValues.join(', ')}` : (param.description ?? '').replace(/\s+/g, ' ')
        output.push(`- \`${name}\`: ${detail}`)
    }
    const otherParams = queryParams.filter(param => !PAGINATION_PARAMS.includes(param.name))
    if (otherParams.length) output.push(`- other query params (${otherParams.length}): ${otherParams.map(param => `\`${param.name}\` ${describeProperty(param.schema ?? {})}`).join('; ')}`)

    const body = operation.requestBody?.content?.['application/json']?.schema
    if (body) {
        const name = refName(body) ?? `${operation.operationId}_body`
        requestSchemas.set(name, body)
        output.push(`- request body: [${name}](#${name.toLowerCase()})${operation.requestBody.required ? ' (required)' : ''}`)
    }
    const success = Object.entries(operation.responses ?? {}).find(([status]) => status.startsWith('2'))
    const responseSchema = success?.[1]?.content?.['application/json']?.schema
    if (responseSchema) {
        const resolved = resolve(responseSchema)
        const item = resolved.properties?.results?.items
        output.push(`- response: ${item ? `paginated (\`count\`, \`next\`, \`previous\`, \`results\`) of ${refName(item) ?? 'object'}` : refName(responseSchema) ?? resolved.type ?? 'object'}`)
    }
    output.push('')
}

if (!pathsOnly && requestSchemas.size) {
    output.push('## Request schemas', '', 'Fields marked * are required in the request (schema `required` minus read-only fields).', '')
    for (const [name, schema] of requestSchemas) output.push(describeRequestSchema(name, schema), '')
}

console.log(output.join('\n'))
