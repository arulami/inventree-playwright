---
name: pw-api-coverage-planner
description: Plan Playwright API test coverage for an endpoint or resource. Enters plan mode, researches existing API specs, request objects and schemas, brainstorms positive/boundary/negative/lifecycle cases, and saves an approved plan to `.claude/pw-plans/api-<slug>.md` for later generation with `pw-api-new-test`. For UI scenarios use `pw-coverage-planner`.
---

Build a Playwright API test coverage plan for the endpoint or resource provided by the user. The output is a markdown artifact in `.claude/pw-plans/` that `pw-api-new-test` can consume.

Endpoint / resource: $ARGUMENTS

**Never skip `AskUserQuestion` steps in this skill, even if told to work autonomously.**

## Instructions

### 1. Enter plan mode immediately

If `$ARGUMENTS` doesn't identify an endpoint or resource (e.g. `/part/`, "part categories", "part parameters"), use `AskUserQuestion` once to ask for it. Then call `EnterPlanMode`. Steps 2–5 are read-only.

### 2. Anchor on the target

Restate in one sentence. Identify:
- **Resource and endpoints** — verbs and paths in scope (e.g. `GET/POST /part/`, `GET/PATCH/DELETE /part/{pk}/`)
- **Auth model** — authenticated by default token, public, owner-only
- **Primary contract** — what a successful call returns

Flag assumptions in the plan rather than blocking on them.

### 3. Review the existing API suite

Read:
- `.claude/rules/playwright-api-scripting.md` and `.claude/rules/playwright-api-architecture.md`
- Specs in `tests/api-tests/` touching this resource — list covered cases so the plan doesn't duplicate them
- `request-objects/` and `playwright-utils/api/data-generator.ts` — existing payloads and factories
- `response-schemas/<resource>/` — which endpoints already have schemas
- `playwright-utils/api/request-handler.ts` — supported verbs (note if the plan needs a new one, e.g. PATCH)
- `playwright-utils/api/fixtures.ts` — available auth contexts (note if the plan needs a second user)

If the API's source or docs are available in the workspace, read validation rules, constraints, and auth guards from them. If not, derive behavior from existing tests and mark inferred behavior with `?`.

### 4. Brainstorm cases (MECE)

**Positive**
- Canonical success for each verb; response matches schema
- Valid variants: optional fields, query params (`limit`, `offset`, filters), different valid payloads

**Boundary**
- String lengths at min, min−1, max, max+1; empty, whitespace, unicode, special characters
- Numeric params: 0, 1, negative, very large, non-numeric
- Pagination: `limit`/`offset` edges, offset past the end
- Collections: empty list, single item

**Negative**
- Validation: missing required fields, wrong types, malformed body → expected 4xx and error body shape
- Auth: no token (`clearAuth`), invalid/expired token, another user's token on owner-only operations
- Not found: unknown pk, already-deleted resource
- Conflicts: duplicate unique fields, repeated create/delete
- Method/contract: unsupported verb on a path if observable

**Lifecycle**
- Create → read → update → delete, verifying each step and final absence
- Side effects visible through other endpoints (e.g. a new part appears in its category's `part_count`, a deleted part returns 404)

For each case note the expected status code and key assertions. Drop cases that can't be verified through the API. Mark uncertain expected statuses/messages with `?`.

### 5. Present the plan with `ExitPlanMode`

```markdown
# API Coverage Plan: <resource / endpoint short title>

**Endpoints:** <VERB path, ...>
**Auth:** <model>
**Suggested file:** `tests/api-tests/<file>.spec.ts` (new | existing)
**Existing related tests:** <titles or "none">
**Support code needed:** <new request objects, generators, schemas, RequestHandler verbs, fixtures — or "none">

## Assumptions
- ...

## Test cases

### Positive
1. **<behavior-style title>** — <summary> _(P0)_
   - Request: <VERB path, auth, params/body summary>
   - Expect: <status>, <key fields>, schema `<resource>/<VERB>_<resource>`

### Boundary
2. **<title>** — ... _(P1)_  (group data-driven cases into one entry with a case table)

### Negative
3. ...

### Lifecycle
4. ...

## Out of scope
- <dropped case — reason>

## Open questions
- <items marked `?`>
```

Priorities: `P0` must-have, `P1` important, `P2` nice-to-have. Titles follow the project's behavior style.

### 6. Save the artifact after approval

Write the plan to `.claude/pw-plans/api-<slug>.md` (kebab-case from the title). Create the folder if needed; append `-2`, `-3`, … instead of overwriting.

### 7. Confirm and offer next step

Use `AskUserQuestion`:
- Question: "Coverage plan saved to `.claude/pw-plans/api-<slug>.md`. What's next?"
- Header: "Next step"
- Option 1: label "Generate first test", description "Run `pw-api-new-test` against the top P0 case"
- Option 2: label "Done", description "Stop here — I'll generate tests later"

**Generate first test** → hand off to `pw-api-new-test` with the first P0 case's request and expectations as the test steps.
