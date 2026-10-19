---
description: Playwright API framework architecture - layout, RequestHandler, fixtures, auth token, logger, custom expect, schema validator, data generators, environments, and how to extend them
paths: [tests/api-tests/**, playwright-utils/api/**, request-objects/**, response-schemas/**, helpers/**, api-test.config.ts, playwright.config.ts]
---

# Playwright API Architecture

## Layout

| Location | Purpose |
|----------|---------|
| `tests/api-tests/*.spec.ts` | InvenTree API specs — one file per resource or flow (`parts-smoke`, `parts-crud`, `parts-negative`, …) |
| `playwright-utils/api/request-handler.ts` | `RequestHandler` — fluent builder that sends requests, logs them, validates status |
| `playwright-utils/api/fixtures.ts` | Extended `test` with `api`, `config`, `partCleanup`, and worker-scoped `authToken` / `readerToken` |
| `playwright-utils/api/custom-expect.ts` | Extended `expect` with `should*` matchers that attach recent API activity |
| `playwright-utils/api/logger.ts` | `APILogger` — records requests/responses for failure messages (Authorization values masked) |
| `playwright-utils/api/schema-validator.ts` | AJV validation (+ genson-js generation) against `response-schemas/` |
| `playwright-utils/api/data-generator.ts` | Payload factories (`structuredClone` base JSON + faker) |
| `request-objects/<VERB>-<resource>.json` | Base request bodies |
| `response-schemas/<resource>/<VERB>_<resource>_schema.json` | JSON schemas per endpoint |
| `helpers/` | Standalone utilities used outside the fixture lifecycle (e.g. `createToken.ts`) |
| `api-test.config.ts` | Environment config (`apiUrl`, credentials from `.env`) |

UI code lives under `tests/ui-tests/` and `playwright-utils/ui/` and follows the UI rules — never import UI page objects into API specs or API helpers into UI pages.

## Fixtures

```typescript
// playwright-utils/api/fixtures.ts
export const test = base.extend<TestOptions, WorkerFixture>({
    authToken: [async ({}, use) => { ... }, { scope: 'worker' }],   // engineer token, once per worker
    readerToken: [async ({}, use) => { ... }, { scope: 'worker' }], // read-only user token, once per worker
    api: async ({ request, authToken }, use) => { ... },            // fresh RequestHandler + APILogger per test
    config: async ({}, use) => { await use(config) },
    partCleanup: async ({ request, authToken }, use) => { ... },    // deactivate + delete registered parts after the test
})
```

- **`authToken`** / **`readerToken`** — worker-scoped; `helpers/createToken.ts` calls `GET /user/token/?name=<unique>` with Basic auth and returns `'Token <token>'`. InvenTree issues a token only once per name, so the name includes the user, a timestamp and a random suffix.
- **`api`** — a new `RequestHandler` and `APILogger` per test; the logger is registered with `setCustomExpectLogger` so matcher failures include this test's activity.
- **`config`** — the resolved environment config.
- **`partCleanup`** — `register(pk)` after creating a part; teardown deactivates and unlocks it (`PATCH active=false, locked=false`) and deletes it, skipping 404s. Add an equivalent fixture for other resources that need teardown.
- Add new fixtures here with `base.extend`. Resources needing teardown (created users, seeded data) belong in a fixture so cleanup runs even when the test fails.
- If a different user is needed, add a separate worker fixture like `readerToken` rather than logging in inside a test.

## Environments

- `dev` (default) targets the public demo server `https://demo.inventree.org/api` (shared, reset every 24 h). `TEST_ENV=qa` / `prod` require `INVENTREE_API_URL`.
- Credentials come from `.env` (git-ignored): `INVENTREE_USERNAME` / `INVENTREE_PASSWORD` (demo: `engineer`, can manage parts) and `INVENTREE_READER_USERNAME` / `INVENTREE_READER_PASSWORD` (demo: `reader`, read-only). The config throws if any are missing. **Never hardcode credentials** in the config or specs.
- Use the least-privileged account that covers the test; never run write tests as `admin`.
- Run against an environment: `TEST_ENV=qa INVENTREE_API_URL=https://… npx playwright test --project=api-testing`.

## Playwright Projects

- `api-testing` — `testDir: ./tests/api-tests`, runs every API spec.
- `ui-tests` — separate; not part of the API run.
- Run one test: `npx playwright test --project=api-testing -g "<exact title>" --retries 0`.

## Extending the Framework

### New HTTP verb on `RequestHandler`

Follow the existing method shape exactly (`patchRequest` shown as the reference):

```typescript
async patchRequest(statusCode: number) {
    let responseJSON: any
    const url = this.getUrl()
    await test.step(`PATCH request to: ${url}`, async () => {
        this.logger.logRequest('PATCH', url, this.getHeaders(), this.apiBody)
        const response = await this.request.patch(url, { headers: this.getHeaders(), data: this.apiBody })
        this.cleanupFields()
        const actualStatus = response.status()
        responseJSON = await response.json()
        this.logger.logResponse(actualStatus, responseJSON)
        this.stausCodeValidator(actualStatus, statusCode, this.patchRequest)
    })
    return responseJSON
}
```

Order matters: log request → send → `cleanupFields()` → log response → status check (passing the method itself so the stack trace points at the spec).

### New builder method

Store the value in a private field, `return this`, and reset it in `cleanupFields()`.

### New custom matcher

Add the signature to the `PlaywrightTest.Matchers` declaration and implement it like `shouldEqual`: run the base `expect` inside `try`, set `pass`, attach `apiLogger.getRecentLogs()` on failure (and on `.not` pass), and build the message with `this.utils.matcherHint`.

### New endpoint

1. Add `request-objects/<VERB>-<resource>.json` if it takes a body.
2. Add a factory to `data-generator.ts`.
3. Generate the schema once with `shouldMatchSchema('<resource>', '<VERB>_<resource>', true)`, then widen it using the endpoint's `OPTIONS` metadata (`allow_null` fields accept `null`, float/decimal → `number`, `next`/`previous` nullable), validate it against a large sample, and remove the flag.

## Anti-Patterns

- Calling `request.get/post/...` directly in a spec instead of the `api` fixture
- Checking `response.status()` manually instead of passing the expected status
- Importing `expect` from `@playwright/test` in API specs
- Committing `shouldMatchSchema(..., true)`
- Mutating imported request JSON or sharing a payload object between tests
- Logging in inside a test instead of using a token fixture
- Hardcoded credentials or pks of existing demo data
- Deleting a part without deactivating it, or creating one without `partCleanup.register`
- Write tests as `admin` / superuser
- Mixing UI page objects and API helpers in the same file
