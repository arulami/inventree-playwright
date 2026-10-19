---
description: Conventions for manual UI and API test case markdown files - layout, table columns, ID scheme, legend, requirement tracing, traceability counts
paths: [manual-tests/**]
---

# Manual Test Case Rules

`manual-tests/README.md` is the source of truth — read it before adding or editing cases. These files are documentation, not Playwright code: the automation rules do not apply here.

- **Layout:** `manual-tests/<product>/{requirements,test-data,ui/<module>,api/<module>}/` plus `<product>/traceability.md`. UI cases go under `ui/`, API cases under `api/` — never mix them in one file.
- **Columns:** keep the exact UI or API table header from the README. Steps are user-level actions (no selectors); multiple steps separated with `<br>`; escape literal `|` as `\|`.
- **IDs:** UI `TC-<AREA>-NNN`, API `TC-API-<AREA>-NNN`. Next free number in that area; IDs are append-only — never renumber, reuse, or silently delete. Insert with a letter suffix (`TC-REV-014a`).
- **Req:** cite IDs that exist in `<product>/requirements/<module>.md` (UI docs) or `<product>/requirements/<module>-api.md` (API schema, IDs `API-<AREA>-NN`), or `§N` section refs. Ranges (`VIEW-02..09`) are allowed. If the behaviour isn't documented, mark the title or expected result with ⚠ and use `—` or the closest ID.
- **Requirements files:** each starts with a source header — URLs ingested, fetch date, and for API files the schema's API version. Requirement IDs follow the same append-only rule as case IDs; mark removed requirements `(retired)` instead of deleting them.
- **Deriving cases:** follow `manual-test-design.md` for which cases to write.
- **Legend values only:** Pri `P1`/`P2`/`P3`; Type `F`/`N`/`B`/`P`.
- **Shared data:** reference users and seed data from `test-data/`; add new shared data there instead of repeating it in pre-conditions.
- **Traceability:** after adding or removing cases, update the counts in `<product>/traceability.md` so they match the `| TC-` rows in each file.
- **New area file:** `NN-<area>.md` with the standard header line (requirements · test data · legend links); for API, start from `api/<module>/_template.md`.
- **Validate:** finish with `node manual-tests/tools/validate-cases.mjs <product>` — it checks headers, IDs, legend values, Req references and traceability counts.
