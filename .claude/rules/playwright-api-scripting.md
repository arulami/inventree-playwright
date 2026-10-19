---
description: Playwright API test authoring conventions - imports, request builder, status codes, custom matchers, schema validation, payloads, data-driven and negative tests, cleanup
paths: [tests/api-tests/**, playwright-utils/api/**, request-objects/**, response-schemas/**, helpers/**]
---

# Playwright API Scripting Rules

Target: the InvenTree REST API (`config.apiUrl`, e.g. `https://demo.inventree.org/api`).

## Imports

Every API spec imports `test` from the API fixtures and `expect` from the custom expect. Never import `expect` from `@playwright/test` in an API spec — the custom matchers (`shouldEqual`, `shouldBeLessThanOrEqual`, `shouldMatchSchema`) exist only on the extended `expect`.

```typescript
// GOOD
import { test } from '../../playwright-utils/api/fixtures'
import { expect } from '../../playwright-utils/api/custom-expect'
import { getNewRandomPart } from '../../playwright-utils/api/data-generator'

// BAD: base expect has no custom matchers and no API activity logging
import { expect } from '@playwright/test'
```

## Request Builder

All requests go through the `api` fixture (`RequestHandler`). Chain the builder methods, then finish with the verb method and the **expected status code**.

```typescript
const response = await api
    .path('/part/')
    .params({ limit: 10, offset: 0 })
    .getRequest(200)

const createPartResponse = await api
    .path('/part/')
    .body(partRequest)
    .postRequest(201)

await api
    .path(`/part/${createPartResponse.pk}/`)
    .body({ active: false })
    .patchRequest(200)
```

- **Always pass the expected status** to `getRequest` / `postRequest` / `putRequest` / `patchRequest` / `deleteRequest`. `RequestHandler` checks it and throws with the recent API activity — never re-check `response.status()` manually.
- `deleteRequest` returns the parsed body when there is one (e.g. a 400 error) and `undefined` for 204.
- **Never call `request.get/post/...` directly** in a spec — you lose logging, `test.step` reporting, auth headers, and status validation.
- **Auth is automatic** — the worker-scoped `authToken` (`Token …`) is attached as the `Authorization` header. Use `.clearAuth()` for unauthenticated requests; use `.headers({ Authorization: readerToken })` to act as the read-only user.
- **Builder state resets after every request** (path, params, headers, body, auth flag). Each request starts a fresh chain.
- Order methods as `url → path → params → headers → body → clearAuth → <verb>Request` for consistency.

### InvenTree specifics

- Paths end with a **trailing slash**: `/part/`, `/part/${pk}/`, `/part/category/`.
- **Always pass `limit`** on list endpoints — with `limit` the response is paged (`{ count, next, previous, results }`); without it InvenTree returns a plain array.
- Use **`PATCH`** for partial updates; `PUT` replaces the whole object.
- Validation errors are **400** with errors keyed by field: `{ "name": ["This field is required."] }`; object-level errors use `non_field_errors`. Missing/invalid auth is **401**, missing permission **403**, unknown object **404** (`{ "detail": "No Part matches the given query." }`).
- **Parts can only be deleted when inactive** — `PATCH { active: false }` first; deleting an active part returns 400.
- Identify objects by **`pk`** captured from responses — demo data is reset regularly, so never hardcode a pk of existing data. Look up what you need (e.g. a category via `GET /part/category/?limit=1`) in `beforeEach`.

## Assertions

### Response values — custom matchers

Use `shouldEqual` and `shouldBeLessThanOrEqual` for response values. On failure they append the **Recent API Activity** (requests, masked auth headers, bodies, status codes) to the error.

```typescript
// GOOD
expect(createPartResponse.name).shouldEqual(partRequest.name)
expect(response.results.length).shouldBeLessThanOrEqual(10)
expect(partResponse.active).not.shouldEqual(false)

// BAD: base matchers give no API context on failure
expect(createPartResponse.name).toEqual(partRequest.name)
```

Base matchers are acceptable only when no custom equivalent exists. If a base matcher is needed repeatedly, add a `should*` matcher to `custom-expect.ts`.

Don't assert exact counts or "first item" of shared lists (`count`, `results[0]`) — other users and tests change demo data. Assert on the object you created (by `pk`) or with upper bounds.

### Schema validation

Validate the response shape of every endpoint at least once with `shouldMatchSchema`. It is async — always `await` it.

```typescript
await expect(response).shouldMatchSchema('parts', 'GET_parts')
```

- Arguments: `<resource>` folder and `<VERB>_<resource>` file stem → `response-schemas/<resource>/<VERB>_<resource>_schema.json`.
- **`createSchemaFlag` (third argument `true`) is only for generating a schema locally** on the first run of a new endpoint. Review the generated file, then **remove the flag before committing**.
- Generated schemas only know the values in that one response. Before committing, **widen nullable fields**: any field InvenTree's `OPTIONS` metadata marks `allow_null` (and pagination `next`/`previous`) must accept `null`, and float/decimal fields must be `number`, not `integer`. Validate the schema against a larger sample (`limit=100`, several offsets).

```typescript
// BAD: committed — schema is overwritten from the live response each run
await expect(response).shouldMatchSchema('parts', 'GET_parts', true)

// GOOD
await expect(response).shouldMatchSchema('parts', 'GET_parts')
```

### Assert what the step proves

After a create/update, assert the returned fields that were sent, then re-fetch by `pk` and assert again. After a delete, re-fetch and assert 404.

## Payloads and Test Data

- Base request bodies live in `request-objects/<VERB>-<resource>.json` (e.g. `POST-part.json`).
- Build variants through a factory in `playwright-utils/api/data-generator.ts` that `structuredClone`s the base JSON and fills fields with faker (e.g. `getNewRandomPart(categoryPk)`).
- Generated names start with **`PW `** so leftover test data is easy to find.
- **Never mutate the imported JSON** and never use `JSON.parse(JSON.stringify(...))` — use or add a generator. Override fields with a spread: `{ ...getNewRandomPart(categoryPk), name: '' }`.
- Keep values the test asserts on in a variable taken from the generated payload, not retyped literals.

## Negative and Data-Driven Tests

Use an array of cases with `.forEach` and put the **expected outcome inside each case** — no `if` branching on input in the test body.

```typescript
[
    { caseName: 'without a name', override: { name: undefined }, field: 'name', expectedError: 'This field is required.' },
    { caseName: 'with a blank name', override: { name: '' }, field: 'name', expectedError: 'This field may not be blank.' },
].forEach(({ caseName, override, field, expectedError }) => {
    test(`Engineer cannot create a part ${caseName}`, async ({ api, partCleanup }) => {
        const response = await api
            .path('/part/')
            .body({ ...getNewRandomPart(categoryPk), ...override })
            .postRequest(400)
        expect(response[field][0]).shouldEqual(expectedError)
    })
})
```

- Use `.clearAuth()` for 401 cases and the `readerToken` fixture for 403 cases.
- Test titles must be unique per case — include the distinguishing input.
- Exact error messages come from the live API — verify them before writing the case.

## Test Lifecycle

- **Register every created part with `partCleanup.register(pk)`** right after the create call. The fixture deactivates and deletes it after the test, even on failure (already-deleted parts are skipped).
- A test that verifies deletion still deletes explicitly (deactivate → delete 204 → GET 404).
- **Tests are independent** — no shared mutable state between tests, no ordering. `fullyParallel` is on.

## Test Structure and Hygiene

- Test titles describe behavior from the actor's view: `'Engineer can create, read and delete a part'`, `'Read-only user cannot create a part'` — not `'POST /part/ 201'`.
- Group related tests per resource with `test.describe`.
- One logical flow per test; a lifecycle flow (create → read → update → delete) counts as one.
- **No `console.log`** — failures already print the API activity.
- **No custom timeouts** and no `waitForTimeout`.
- No `expect.soft()`.
