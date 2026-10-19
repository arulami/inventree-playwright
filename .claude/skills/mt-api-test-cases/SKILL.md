---
name: mt-api-test-cases
description: Generate manual API test cases from the OpenAPI schema. Runs a digest script over the live schema (the rendered API docs page is too large to read), writes or refreshes `manual-tests/<product>/requirements/<module>-api.md` with endpoint, constraint, permission and convention requirement IDs, finds coverage gaps, derives positive/negative/boundary/permission/lifecycle cases using the project's test design rules, confirms the draft with the user, then writes them to `manual-tests/<product>/api/<module>/`, updates traceability and validates. For UI cases use `mt-ui-test-cases`; to automate cases use `pw-api-coverage-planner`.
---

Generate manual API test cases for the endpoint or resource the user provided.

Scope: $ARGUMENTS

**Never skip `AskUserQuestion` steps in this skill, even if told to work autonomously.**

## Instructions

### 1. Anchor on the scope

From `$ARGUMENTS`, identify the **product** (default `inventree`), **module** (e.g. `parts`), and the **path prefix** (e.g. `/api/part/`, or `/api/part/category/` for "part categories"). If the user gave a docs URL such as `https://docs.inventree.org/en/stable/api/schema/part/`, the last segment names the resource; the schema is still read from the JSON (step 3). If the scope can't be identified, ask once with `AskUserQuestion`.

### 2. Read the conventions

Read, in full:
- `manual-tests/README.md`
- `.claude/rules/manual-test-cases.md` (format, IDs)
- `.claude/rules/manual-test-design.md` (what cases to derive — the **API specifics** section matters most)
- `manual-tests/<product>/api/<module>/_template.md`
- `manual-tests/<product>/test-data/<module>-environment.md`
- `manual-tests/<product>/traceability.md`

### 3. Digest the schema

Do **not** WebFetch the rendered schema page; it is several hundred thousand characters and gets summarised lossily. Run the digest script, which reads the OpenAPI JSON:

```bash
# overview of everything under the prefix
node .claude/skills/mt-api-test-cases/scripts/openapi-digest.mjs /api/part/ --paths-only
# full detail (parameters, request schemas, scopes) for the paths in scope
node .claude/skills/mt-api-test-cases/scripts/openapi-digest.mjs /api/part/ --exact
node .claude/skills/mt-api-test-cases/scripts/openapi-digest.mjs '/api/part/{id}/' --exact
```

- Default schema: `https://demo.inventree.org/api/schema/?format=json`. For another server pass `--schema <url-or-file>`.
- If the prefix covers many paths (more than ~6), show the `--paths-only` list and ask the user with `AskUserQuestion` which paths to cover in this batch.
- The digest already resolves: request-required fields (`required` minus read-only), writable field constraints, read-only fields, OAuth2 scopes (`r:<action>:<ruleset>` → the role permission needed), query parameters, and documented responses. Only success statuses are documented.

### 4. Write or refresh the API requirements

Requirements live in `manual-tests/<product>/requirements/<module>-api.md`.

- **Header:** schema URL, API version (from the digest), digest date, and the paths ingested.
- **`## 1. Conventions`** — read once from InvenTree's general API docs (`https://docs.inventree.org/en/stable/api/`, plus its authentication/permissions sub-pages if linked) with WebFetch. IDs `API-CONV-NN`: token auth and the `Token` prefix, unauthenticated → 401, insufficient permission → 403, validation error → 400 with a per-field error body, unknown object → 404, pagination with `limit`/`offset` returning `count`/`next`/`previous`/`results`. If the docs don't state one of these, still record it but mark the row ⚠ (Django REST Framework default) — cases citing it inherit the ⚠.
- **One section per path** (`## N. <METHOD list> <path>`), with IDs `API-<AREA>-NN`, e.g. `API-PRT-01` for parts, `API-CAT-01` for categories:
  - one ID per operation: method, path, success status, required permission scope
  - one ID per constrained writable field (required, maxLength, min/max, format, nullable, enum, default)
  - one ID for "read-only fields are ignored on write" listing them
  - for list operations: one ID each for pagination, ordering (values), search (searched fields), and the important filters
- **Refreshing:** keep existing IDs and meanings; append new ones; mark removed ones `(retired)`. If the API version changed, summarise the differences for the user.

### 5. Gap analysis

Collect every Req cited in `manual-tests/<product>/api/<module>/*.md`. Classify each API requirement in scope as **uncovered**, **thin** (missing the N/B/P cases the design rule's API specifics call for — e.g. an operation with no 401, 403 or 404 case), or **covered**. Also check the matching UI requirements (`requirements/<module>.md`) for business rules enforced by the API (e.g. inactive parts only can be deleted, locked parts cannot be deleted): cite both IDs on those API cases.

Pick the target file: an existing `api/<module>/NN-<area>.md`, or a new one copied from `_template.md` (delete the example row). Choose the ID prefix (`TC-API-PRT-`) and the next free number.

### 6. Draft the cases

Apply `manual-test-design.md`, in this order per operation: positive → validation boundaries → permissions (engineer / reader / no auth) → not found → read-only fields → lifecycle → list parameters. For each case have ready every API column: ID, title, pre-conditions, Method, Endpoint (with `<placeholders>`), Auth (`Token (engineer)`, `Token (reader)`, `None`), Request (exact JSON or query string), Expected status, Expected response (named fields), Pri, Type, Req.

### 7. Confirm with the user

Use `AskUserQuestion` with a summary:
- target file and ID range
- count per operation, per Type (F/N/B/P) and per Pri
- requirements still uncovered, and why
- ⚠ cases (statuses or behaviour not stated by the docs or schema)

Options: "Write cases", "Show the full draft first", "Narrow the scope". On "Show the full draft first", print the rows, then ask again.

### 8. Write

- Write the cases to the target file.
- Add new shared data to `test-data/<module>-environment.md` (e.g. a part that must exist for detail cases).
- Update `traceability.md`: add or update the area's row (UI 0, API count) and the totals.

### 9. Validate

Run `node manual-tests/tools/validate-cases.mjs <product>`. Fix every reported problem and re-run until it prints `OK`.

### 10. Report

Tell the user the files and IDs written, the API version they're based on, requirements still uncovered, and the ⚠ cases to confirm against a running instance. Offer `pw-api-coverage-planner` to plan automation; mention which cases are already automated in `tests/api-tests/` if their behaviour matches an existing spec.
