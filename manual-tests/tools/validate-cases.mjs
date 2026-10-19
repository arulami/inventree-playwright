#!/usr/bin/env node
// Validates manual test case files against the conventions in manual-tests/README.md.
// Usage: node manual-tests/tools/validate-cases.mjs <product>   (e.g. inventree)
// Exits 1 and lists every problem found; exits 0 when clean.
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const UI_HEADER = '| ID | Title | Pre-conditions | Steps | Expected Result | Pri | Type | Req |'
const API_HEADER = '| ID | Title | Pre-conditions | Method | Endpoint | Auth | Request | Expected status | Expected response | Pri | Type | Req |'
const PRIORITIES = ['P1', 'P2', 'P3']
const TYPES = ['F', 'N', 'B', 'P']
const UI_ID = /^TC-(?!API-)[A-Z]+(-[A-Z]+)*-\d{3}[a-z]?$/
const API_ID = /^TC-API-[A-Z]+(-[A-Z]+)*-\d{3}[a-z]?$/
const REQ_ID = /^[A-Z]+(-[A-Z]+)*-\d+[a-z]?$/

const product = process.argv[2]
if (!product) {
    console.error('Usage: node manual-tests/tools/validate-cases.mjs <product>')
    process.exit(2)
}
const manualTestsDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const productDir = path.join(manualTestsDir, product)
if (!fs.existsSync(productDir)) {
    console.error(`No such product directory: ${productDir}`)
    process.exit(2)
}

const problems = []
const report = (file, line, message) => problems.push(`${path.relative(manualTestsDir, file)}:${line}: ${message}`)

// Split a markdown table row into trimmed cells, honouring escaped pipes (\|)
function splitRow(row) {
    return row.replace(/\\\|/g, '\u0000').split('|').slice(1, -1).map(cell => cell.replace(/\u0000/g, '\\|').trim())
}

function listMarkdown(dir) {
    if (!fs.existsSync(dir)) return []
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
        const fullPath = path.join(dir, entry.name)
        if (entry.isDirectory()) return listMarkdown(fullPath)
        return entry.name.endsWith('.md') && !entry.name.startsWith('_') ? [fullPath] : []
    })
}

// Requirement IDs and section numbers (§N, §N.N) declared across all requirements files
const requirementIds = new Set()
const sectionNumbers = new Set()
for (const file of listMarkdown(path.join(productDir, 'requirements'))) {
    for (const line of fs.readFileSync(file, 'utf-8').split('\n')) {
        const idMatch = line.match(/^\|\s*([A-Z]+(?:-[A-Z]+)*-\d+[a-z]?)\s*\|/)
        if (idMatch) requirementIds.add(idMatch[1])
        const sectionMatch = line.match(/^#{2,4}\s+(\d+(?:\.\d+)*)\.?\s/)
        if (sectionMatch) sectionNumbers.add(sectionMatch[1])
    }
}

function checkRequirementReference(reference, file, lineNumber) {
    const ref = reference.replace(/⚠/g, '').trim()
    if (!ref || ref === '—') return
    const section = ref.match(/^§(\d+(?:\.\d+)*)$/)
    if (section) {
        if (!sectionNumbers.has(section[1])) report(file, lineNumber, `Req section §${section[1]} does not exist in requirements/`)
        return
    }
    const range = ref.match(/^([A-Z]+(?:-[A-Z]+)*)-(\d+)\.\.(\d+)$/)
    if (range) {
        const [, prefix, from, to] = range
        for (let n = Number(from); n <= Number(to); n++) {
            const id = `${prefix}-${String(n).padStart(from.length, '0')}`
            if (!requirementIds.has(id)) report(file, lineNumber, `Req range ${ref} includes unknown ID ${id}`)
        }
        return
    }
    if (!REQ_ID.test(ref)) report(file, lineNumber, `Req "${ref}" is not an ID, range (X-01..05), §N, or —`)
    else if (!requirementIds.has(ref)) report(file, lineNumber, `Req ${ref} does not exist in requirements/`)
}

// Case files: header shape, ID scheme and uniqueness, legend values, requirement references
const caseCounts = new Map()
const seenIds = new Map()
for (const kind of ['ui', 'api']) {
    const expectedHeader = kind === 'ui' ? UI_HEADER : API_HEADER
    const idPattern = kind === 'ui' ? UI_ID : API_ID
    const columnCount = splitRow(expectedHeader).length
    for (const file of listMarkdown(path.join(productDir, kind))) {
        const lines = fs.readFileSync(file, 'utf-8').split('\n')
        let cases = 0
        lines.forEach((line, index) => {
            const lineNumber = index + 1
            if (/^\|\s*ID\s*\|/.test(line) && line.trim() !== expectedHeader) {
                report(file, lineNumber, `Table header differs from the ${kind.toUpperCase()} header in README.md`)
            }
            if (!/^\|\s*TC-/.test(line)) return
            cases++
            const cells = splitRow(line)
            if (cells.length !== columnCount) {
                report(file, lineNumber, `Row has ${cells.length} cells, expected ${columnCount} (unescaped | ?)`)
                return
            }
            const id = cells[0]
            const [priority, type, requirements] = cells.slice(-3)
            if (!idPattern.test(id)) report(file, lineNumber, `ID ${id} does not match the ${kind.toUpperCase()} scheme`)
            if (seenIds.has(id)) report(file, lineNumber, `Duplicate ID ${id} (first used at ${seenIds.get(id)})`)
            else seenIds.set(id, `${path.relative(manualTestsDir, file)}:${lineNumber}`)
            if (!PRIORITIES.includes(priority)) report(file, lineNumber, `Pri "${priority}" is not one of ${PRIORITIES.join('/')}`)
            if (!TYPES.includes(type)) report(file, lineNumber, `Type "${type}" is not one of ${TYPES.join('/')}`)
            for (const reference of requirements.split(',')) checkRequirementReference(reference, file, lineNumber)
        })
        caseCounts.set(path.relative(productDir, file), { kind, cases })
    }
}

// traceability.md: every case file listed once, with counts that match its rows
const traceabilityFile = path.join(productDir, 'traceability.md')
if (!fs.existsSync(traceabilityFile)) {
    report(traceabilityFile, 0, 'traceability.md is missing')
} else {
    const listed = new Set()
    fs.readFileSync(traceabilityFile, 'utf-8').split('\n').forEach((line, index) => {
        const link = line.match(/\]\(([^)]+\.md)\)\s*\|\s*$/)
        if (!link || !line.startsWith('|')) return
        const cells = splitRow(line)
        const [uiCount, apiCount] = [Number(cells[1]), Number(cells[2])]
        const linkedFile = link[1]
        listed.add(linkedFile)
        const actual = caseCounts.get(linkedFile)
        if (!actual) {
            report(traceabilityFile, index + 1, `Links ${linkedFile}, which has no case file`)
            return
        }
        const expected = { ui: actual.kind === 'ui' ? actual.cases : 0, api: actual.kind === 'api' ? actual.cases : 0 }
        if (uiCount !== expected.ui || apiCount !== expected.api) {
            report(traceabilityFile, index + 1, `${linkedFile}: listed UI ${uiCount} / API ${apiCount}, actual UI ${expected.ui} / API ${expected.api}`)
        }
    })
    for (const [file, { cases }] of caseCounts) {
        if (!listed.has(file)) report(traceabilityFile, 0, `${file} (${cases} cases) is not listed`)
    }
}

const total = [...caseCounts.values()].reduce((sum, { cases }) => sum + cases, 0)
if (problems.length) {
    console.error(problems.join('\n'))
    console.error(`\n${problems.length} problem(s) in ${caseCounts.size} files / ${total} cases`)
    process.exit(1)
}
console.log(`OK: ${caseCounts.size} files, ${total} cases, ${requirementIds.size} requirement IDs`)
