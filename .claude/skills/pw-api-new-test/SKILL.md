---
name: pw-api-new-test
description: Write a new Playwright API test from user-provided endpoint and steps. Reviews existing API specs, request objects and schemas, writes the test with the project's `api` fixture, custom matchers and schema validation, then runs and debugs it if needed. Use for API/endpoint tests — for UI tests use `pw-new-test`.
---

Write a new Playwright API test based on the provided endpoint and test steps.

Test steps: $ARGUMENTS

**Never skip `AskUserQuestion` steps in this skill, even if told to work autonomously.**

## Instructions

### 1. Load the API rules

Read in full:
- `.claude/rules/playwright-api-scripting.md` — imports, request builder, matchers, schema validation, payloads, data-driven tests, cleanup
- `.claude/rules/playwright-api-architecture.md` — layout, fixtures, environments, extension patterns

Every decision below follows these rules. Do **not** apply the UI rules (`playwright-scripting.md`, `playwright-architecture.md`) to API code.

### 2. Review the existing API suite

Read:
- All spec files in `tests/api-tests/` — what's covered (avoid duplicates), which file and `test.describe` the new test belongs in, naming style
- `playwright-utils/api/` — `fixtures.ts` (available fixtures), `request-handler.ts` (supported verbs and builder methods), `custom-expect.ts` (available matchers), `data-generator.ts` (existing factories)
- `request-objects/` — existing base payloads
- `response-schemas/` — which endpoints already have a schema

### 3. Understand the endpoint

From the user's steps, identify for each request: HTTP verb, path, query params, body, auth (default token / none / other user), and the **expected status code**. If any expected status is unknown, ask the user with `AskUserQuestion` rather than guessing.

If the endpoint's response shape is unknown, make one exploratory call through the test itself in step 6 (schema generation) rather than with ad-hoc scripts.

### 4. Prepare support code (only if needed)

- New request body → add `request-objects/<VERB>-<resource>.json` and a factory in `data-generator.ts` (`structuredClone` + faker), following `getNewRandomPart`.
- Verb or builder method not supported by `RequestHandler` → add it following the shape in the API architecture rule.
- A recurring base matcher with no `should*` equivalent → add a matcher in `custom-expect.ts`.
- A different user / extra resource needing teardown → add a fixture in `fixtures.ts`.

Reuse first — don't add a factory, matcher, or fixture that already exists.

### 5. Write the test

- Imports: `test` from `playwright-utils/api/fixtures`, `expect` from `playwright-utils/api/custom-expect`.
- Use `api.path(...)...<verb>Request(<status>)` for every call; never raw `request.*`.
- Assert response values with `shouldEqual` / `shouldBeLessThanOrEqual`.
- Add `await expect(response).shouldMatchSchema('<resource>', '<VERB>_<resource>')` for each endpoint under test. If the schema file doesn't exist yet, pass `true` as the third argument **for the first run only**.
- Negative / boundary cases → data-driven array with expected outcome per case, `.clearAuth()` for unauthenticated cases.
- Created resources are deleted in the same test and the deletion verified.
- No `console.log`, no custom timeouts, behavior-style title.
- **One statement per line**, except request-builder chains, which follow the existing multi-line style (one builder method per line, as in `parts-crud.spec.ts`).

### 6. Ask user to run or adjust

Use `AskUserQuestion`:
- Question: "Test is ready. What would you like to do next?"
- Header: "Next step"
- Option 1: label "Run the test", description "Execute the test and debug if it fails"
- Option 2: label "Something else", description "Tell me what you'd like to change"

### 7. Run the test

```bash
npx playwright test --project=api-testing -g "<exact test title>" --trace on --retries 0
```

If a schema was generated (flag `true`), read the new file under `response-schemas/`, sanity-check it against the response, then **remove the `true` flag** and re-run so the test validates against the saved schema.

If the test passes, go to step 9. If it fails, go to step 8.

### 8. Debug

Use the failure output first — this framework prints **Recent API Activity** (method, URL, headers, body, status, response) on status mismatches and matcher failures, plus AJV errors on schema failures. Classify:

- **Test bug** — wrong path/params/body, wrong expected status or value → fix the test
- **Data/state issue** — value depends on shared data that other tests (parallel) change, e.g. "first part in list" → assert on the specific resource instead
- **Environment** — `TEST_ENV`, credentials, token (`authToken` fixture failure in `createToken`) → explain, don't patch around
- **API behavior change / bug** → explain to the user; do not weaken the test

If needed, open the trace with the CLI (`npx playwright trace open <trace.zip>`, `npx playwright trace actions`, `npx playwright trace requests`, `npx playwright trace request <id>`, `npx playwright trace close`). Never use `show-trace` (GUI).

Re-run after each fix with the command from step 7. Repeat until it passes or needs user input.

### 9. Confirm and finalize

Use `AskUserQuestion`:
- Question: "Test passed. Does it meet your expectations?"
- Header: "Finalize"
- Option 1: label "Looks good", description "Remove comments and finalize the test"
- Option 2: label "Needs changes", description "Tell me what should be adjusted"

**Looks good** → remove inline `//` comments from the new test, collapse blank lines inside the test body (keep one blank line between top-level blocks), confirm no `shouldMatchSchema(..., true)` remains, then go to step 10.
**Needs changes** → apply, re-run, repeat from step 7.

### 10. Offer to commit

Use `AskUserQuestion`:
- Question: "Should I commit the new test?"
- Header: "Commit"
- Option 1: label "Yes, commit", description "Stage the changes and create a commit"
- Option 2: label "No", description "Skip the commit"

**Yes** → review `git status` / `git diff`, stage the spec plus any new request objects, schemas, generators, or helpers, and commit in the style of `git log`.
