---
description: How to derive manual UI and API test cases from requirements - coverage floor, test design techniques per requirement shape, API status and permission expectations, case quality, honesty markers, duplicate checks, priority guide
paths: [manual-tests/**]
---

# Manual Test Design Rules

How to turn requirements into cases. Format, columns and IDs are in `manual-test-cases.md` and `manual-tests/README.md`; this file covers *what* cases to write.

## Coverage floor

- Every requirement in scope gets **at least one positive (F) case**.
- Add N / B / P cases wherever the requirement has a constraint, a flag, a state, or a role. A requirement that is pure description (e.g. "a part can have many stock items") needs only its positive case.
- A case may cite several requirements, but each requirement must be the *goal* of at least one case — not only a pre-condition.

## Techniques by requirement shape

| Requirement shape | Cases to derive | Type |
|---|---|---|
| Required field | missing, blank `""`, whitespace-only | N |
| String `maxLength n` | exactly n (accepted), n+1 (rejected) | B |
| Numeric min / max | min−1, min, max, max+1; non-numeric | B / N |
| Enum / choices | each valid value (one case, data table in Steps/Request), one invalid value | F / N |
| Format (uri, date, email) | one valid, one malformed | F / N |
| Unique field | create a duplicate of an existing value | N |
| Interacting flags | decision table over the flags the docs say interact (e.g. Virtual × stock, Template × variants); one case per meaningful combination, not the full cross-product | F / N |
| State (active, locked, revision) | each allowed transition, and each operation the state forbids (e.g. delete a locked part) | F / N |
| Role-restricted action | permission matrix: allowed role succeeds; read-only role refused; unauthenticated refused | P |
| Global setting toggles behaviour | setting on vs off, one case each | F |

Pick values at the boundary, not "somewhere invalid": a 101-character name, not a 5000-character one.

## API specifics

- **Every case states one expected status.** Success statuses come from the schema digest. Error statuses come from the `## Conventions` IDs in `requirements/<module>-api.md` (validation → 400, no/invalid credentials → 401, authenticated without permission → 403, unknown `pk` → 404). Never invent a status the conventions don't state; if unsure, mark ⚠.
- **Permissions:** the operation's OAuth2 scope (`r:<action>:<ruleset>`, e.g. `r:add:part`) says which role permission it needs. Cover: a user with the permission (`engineer`), a user without it (`reader` / `viewer`), and no `Authorization` header.
- **404:** each `{id}` operation gets an unknown-`pk` case (use a `pk` that cannot exist, e.g. `999999999`).
- **Read-only fields:** for each write operation, one case that sends a read-only field (e.g. `pk`, `full_name`) and expects it to be ignored, not applied.
- **PUT vs PATCH:** PUT omitting a required field is rejected; PATCH with only one field succeeds and leaves others unchanged.
- **Lifecycle:** one case chaining create → read → update → delete → read (404).
- **List endpoints:** `limit`/`offset` (first page, offset past the end), one `ordering` value ascending and descending, `search` matching one of the searched fields the digest lists, and the most important filters. Use the real parameter names from the digest.
- **Request column:** the exact JSON or query string, with placeholders in `<>` for values that come from test data (`<Resistors id>`). **Expected response:** named fields and values, not "correct data".

## UI specifics

- Steps are what the user does (menus, buttons, fields by their visible label) — never selectors.
- Expected result is what the user sees: page, message, field value, disabled control. "Works correctly" is not an expected result.
- When a rule is enforced in both UI and API, the UI case checks what the user sees (error against the field, nothing created); the API case checks status and body. Write both, in their own files.

## Case quality

- **One behaviour per case.** If the title needs "and", split it — except lifecycle cases.
- **Concrete data** from `test-data/<module>-environment.md` (users, categories, seed parts). New shared data goes there first.
- **Pre-conditions** name the user and any state set up beforehand; chain to another case only with its ID (`TC-CRT-003 state`).
- Titles are behaviours: "Reader cannot create a part", not "Test create permission".

## Honesty

- Behaviour not stated in a cited source gets ⚠ in the title or expected result (see README legend). Do not upgrade an assumption into an expectation.
- If a requirement is ambiguous, write the case for the most literal reading, mark ⚠, and list it in the summary for the user.

## Before writing

- **No duplicates:** grep the area's existing cases for the same Req IDs. If a case already covers that behaviour, extend coverage elsewhere instead of restating it. API and UI cases for the same rule are not duplicates.
- **Gaps first:** prioritise requirements with zero cases over adding more cases to well-covered ones.

## Priority guide

- **P1** — core CRUD, blocking flows, data loss or security (permission leaks, deleting locked data).
- **P2** — validation, boundaries on important fields, secondary flows, filters.
- **P3** — cosmetic, rare combinations, informational fields.

## Finally

Run `node manual-tests/tools/validate-cases.mjs <product>` and fix every problem it reports before finishing.
