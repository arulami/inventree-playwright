---
name: pw-api-debug-test
description: Debug a failing Playwright API test. Runs it in the api-testing project with tracing on, analyzes the framework's "Recent API Activity" output, status-code and schema (AJV) errors, and the trace's network requests, classifies the root cause (test bug, shared data, environment/auth, API change), and fixes the spec following the API rules. Use when an API/endpoint test fails or is flaky; for UI tests use `pw-debug-test`.
---

# Debug a Failed Playwright API Test

## Step 0: Confirm the test name

The user must provide the exact `test('...')` title or a unique keyword. If not, **stop and ask**:

> Which API test should I debug? Please paste the exact `test('...')` title or a unique keyword from it.

Do not guess or run the whole suite.

## Step 1: Find the test and its context

1. Grep `tests/api-tests/` for the title/keyword (including data-driven titles built from template strings — match the static part). If several match, ask which one; if none, stop.
2. Read the spec in full.
3. Read `.claude/rules/playwright-api-scripting.md` and `.claude/rules/playwright-api-architecture.md` — fixes must follow them.
4. Skim the support code the test uses: `playwright-utils/api/request-handler.ts`, `custom-expect.ts`, `fixtures.ts`, and any schema in `response-schemas/` it validates against.

## Step 2: Run with tracing on

```bash
npx playwright test --project=api-testing -g "<exact test title>" --trace on --retries 0
```

If it **passes**, tell the user it passed this run, note it may be flaky (likely shared data under `fullyParallel`), and stop.

If it **fails**, capture from the output:
- The error type: **status mismatch** (`Expected status X but got Y`), **matcher failure** (`shouldEqual` / `shouldBeLessThanOrEqual` expected vs received), **schema failure** (`Schema validation <file> failed` + AJV errors), or a **thrown error** (e.g. JSON parse on an empty body, `authToken` fixture failing in `createToken`)
- The **Recent API Activity** block — every request (method, URL, headers, body) and response (status, body) in this test, in order
- The failing line from the stack trace

## Step 3: Analyze

Start with the Recent API Activity — it usually explains the failure without the trace:

- Is the request what the test intended? (path, query params, body, `Authorization` present/absent)
- Does the response status/body show a validation error, auth error, or not-found?
- For matcher failures: is the received value from the right resource, or from list position that a parallel test changed?
- For schema failures: which AJV path failed — a new/removed/nullable field (API change) or an error response being validated (wrong status upstream)?

Use the trace only when the output isn't enough (CLI mode only, never `show-trace`):

```bash
npx playwright trace open <path-to-trace.zip>
npx playwright trace actions          # test.step entries per request
npx playwright trace requests
npx playwright trace request <id>     # full headers/body of one call
npx playwright trace errors
npx playwright trace close
```

## Step 4: Classify and report

- **Which test** — `path:line` and title
- **Root cause**, one of:
  - **Test bug** — wrong path/params/body, wrong expected status/value, builder state assumed across calls, committed `shouldMatchSchema(..., true)` hiding drift
  - **Shared-data / parallelism** — assertion depends on global state (first item in a list, total counts, tag order) that other tests or users change
  - **Environment / auth** — `TEST_ENV`, missing `.env` values, bad credentials, token creation failing, API host down
  - **API change or bug** — contract changed (schema fields, status codes, error messages)
- **Evidence** — the relevant request/response from the activity log, expected vs received, AJV error
- **Suggested fix**

## Step 5: Apply the fix

Fix only when it's a test bug or a shared-data assertion, following the API rules — e.g. assert on the created resource by pk instead of `results[0]`, use a generator instead of a mutated payload, correct the expected status. Re-run:

```bash
npx playwright test --project=api-testing -g "<exact test title>" --retries 0
```

Then run it once more to check for flakiness.

For environment issues or API changes, explain and propose next steps — **do not** weaken assertions, regenerate a schema to make a failure disappear, add retries, or add timeouts. If the API contract legitimately changed, confirm with the user before regenerating the schema (temporary `true` flag, review, remove flag).
