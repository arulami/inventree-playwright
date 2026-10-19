---
name: pw-api-test-audit
description: Audit a recently written Playwright API test as a fresh pair of eyes. Reviews only uncommitted changes to API specs and API support code via git diff, checks compliance with the project's API scripting and architecture rules, and reports findings before optionally applying fixes. For UI tests use `pw-test-audit`.
---

Audit the most recent Playwright API test changes against the project's API rules. You are running in a fresh agent session — bring a clean, independent perspective. Do not assume the previous agent's choices were correct.

**Never skip `AskUserQuestion` steps in this skill, even if told to work autonomously.**

## Instructions

### 1. Identify the recent changes

```bash
git status --short
git diff HEAD -- tests/api-tests playwright-utils/api request-objects response-schemas helpers api-test.config.ts
git status --short --untracked-files=all -- tests/api-tests playwright-utils/api request-objects response-schemas helpers
```

Include untracked files in those paths (read them in full — they are entirely new).

If there are no changes in those paths, **stop** and tell the user:

> No uncommitted API changes detected — there is no new API test code to review. If you've already committed, surface the changes (e.g. `git reset --soft HEAD~1`) and re-run the skill.

Do not fall back to committed history. Limit the audit to the changed hunks and new files.

### 2. Establish the project context

Read in full:
- `.claude/rules/playwright-api-scripting.md`
- `.claude/rules/playwright-api-architecture.md`

Then read the support code the changes rely on: `playwright-utils/api/request-handler.ts`, `fixtures.ts`, `custom-expect.ts`, `data-generator.ts`. Findings must be grounded in what these actually provide (e.g. don't demand a matcher that doesn't exist — suggest adding it).

### 3. Audit the changes

Walk every changed line. Flag each violation with `file:line` and **cite the rule** from the API rules files. If the project's rules contradict an item below, the rules win.

#### Imports
- `test` from `playwright-utils/api/fixtures`; `expect` from `playwright-utils/api/custom-expect` — never `expect` from `@playwright/test` when custom matchers are used
- No unused imports (e.g. raw JSON payloads or faker imported but replaced by a generator)

#### Requests
- Every call goes through the `api` builder and ends in `<verb>Request(<expectedStatus>)`
- No raw `request.get/post/...`, no manual `response.status()` checks
- `.clearAuth()` used for unauthenticated cases; no hand-built auth headers unless testing another token
- No reliance on builder state from a previous call
- Expected status codes are correct for the operation (InvenTree: 201 create, 200 PATCH, 204 delete, 400 validation, 401 no auth, 403 no permission, 404 unknown pk) — verify against existing tests or the user's steps

#### Assertions
- Response values asserted with `shouldEqual` / `shouldBeLessThanOrEqual` (base matchers only where no custom one exists)
- Each endpoint under test has an awaited `shouldMatchSchema('<resource>', '<VERB>_<resource>')`
- **No committed `createSchemaFlag = true`**
- New schema files exist at `response-schemas/<resource>/<VERB>_<resource>_schema.json` and look reasonable (not generated from an error response)
- Assertions target the specific resource rather than list position when parallel tests may change order
- No `expect.soft()`

#### Payloads and data
- Bodies come from `request-objects/` via a `data-generator.ts` factory
- No mutation of imported JSON, no `JSON.parse(JSON.stringify(...))`
- No hardcoded pks of existing data or credentials; every created part registered with `partCleanup`; asserted values come from variables, not retyped literals

#### Negative / data-driven tests
- Cases in an array with `.forEach`; expected outcome inside each case; no `if` branching on input in the test body
- Unique, descriptive titles per case

#### Lifecycle and structure
- Created resources are deleted in the same test and deletion verified
- Tests independent; no shared mutable state
- Behavior-style titles; one logical flow per test
- No `console.log`, custom timeouts, or `waitForTimeout`

#### Support code (if changed)
- New `RequestHandler` verbs follow the existing shape (log → send → `cleanupFields` → log response → status check with the method as stack anchor)
- New builder methods reset in `cleanupFields()`
- New matchers declared in `PlaywrightTest.Matchers` and attach recent logs on failure
- New fixtures that create data tear it down
- No UI page objects or UI helpers mixed into API files

### 4. Compose the audit report

Use the same format as `pw-test-audit`: an **Audit summary** sentence, then tables **Must-fix**, **Should-fix**, **Suggestions** with columns `# | Location | Issue | Fix`, numbered sequentially across tables, then **What looks good** bullets. Omit empty sections. One line per cell; filename-and-line only in Location; cite the rule in Issue.

**Severity:** Must-fix = direct violation of a documented API rule. Should-fix = preferred pattern not followed but code works. Suggestions = style/readability not codified.

### 5. Offer next step

Use `AskUserQuestion`:
- Question: "Audit complete. What would you like to do?"
- Header: "Next step"
- Option 1: label "Apply must-fix", description "Edit the test to resolve the must-fix findings only"
- Option 2: label "Apply all", description "Edit the test to resolve must-fix and should-fix findings"
- Option 3: label "Discuss", description "Talk through specific findings before changing anything"

Honor "Other" requests for specific finding numbers. After edits, re-run only the affected tests:

```bash
npx playwright test --project=api-testing -g "<exact test title>" --retries 0
```

If a test fails after fixes, debug from the Recent API Activity in the output (see `pw-api-debug-test`) until it passes.

## Operating principles

- **Fresh eyes** — re-derive every expected status and value from the rules, support code, and the user's intent; don't trust the previous agent.
- **Uncommitted API changes only** — never review untouched files or committed history.
- **Cite rules, not opinions** — opinion-only feedback goes under Suggestions.
- **Don't flag what the framework can't do** — if a rule needs missing support code, the fix is to add it, and say so.
- **Ask about intent** — if a finding depends on what the test was meant to verify, ask.
