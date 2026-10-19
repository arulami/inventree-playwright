# Manual Test Cases

Manual UI and API test cases, kept separate from the automated Playwright suite in `tests/`.

## Layout

```
manual-tests/
  README.md                      # this file — conventions for every product
  <product>/                     # e.g. inventree
    requirements/<module>.md     # requirement IDs the cases trace to
    test-data/<module>-environment.md   # users, seed data, settings shared by the cases
    ui/<module>/NN-<area>.md     # manual UI cases, one file per area
    api/<module>/NN-<area>.md    # manual API cases, one file per area (see api/<module>/_template.md)
    traceability.md              # case counts per area (UI / API)
```

Current products:

| Product | Modules | Notes |
|---|---|---|
| [inventree](inventree/traceability.md) | Parts | Automated API tests for Parts live in `tests/api-tests/` (InvenTree demo server). |

## Legend

- **Priority:** **P1** = core / blocking, **P2** = important, **P3** = minor / cosmetic.
- **Type:** **F** = functional (positive), **N** = negative, **B** = boundary, **P** = permission.
- **⚠** = the case asserts behaviour the source docs do not state explicitly — confirm against the running instance before treating a failure as a defect.
- **Req** = requirement IDs from `<product>/requirements/<module>.md` (or a section reference such as `§14`). `—` when no documented requirement exists.

## Case format

### UI

| ID | Title | Pre-conditions | Steps | Expected Result | Pri | Type | Req |
|---|---|---|---|---|---|---|---|

### API

| ID | Title | Pre-conditions | Method | Endpoint | Auth | Request | Expected status | Expected response | Pri | Type | Req |
|---|---|---|---|---|---|---|---|---|---|---|---|

Multi-step cells use `<br>` between steps (`1. … <br>2. …`). Literal `|` inside a cell is escaped as `\|`.

## IDs

- UI: `TC-<AREA>-NNN` (e.g. `TC-CRT-001`, `TC-TAB-STK-003`). API: `TC-API-<AREA>-NNN` (e.g. `TC-API-PRT-001`).
- IDs are **append-only** — never renumber or reuse an ID. To insert a case next to an existing one, use a letter suffix (`TC-REV-014a`).
- A removed case keeps its ID retired; note it in the area file instead of deleting silently.

## Adding cases

1. Add a row to the matching area file under `ui/` or `api/` (create a new `NN-<area>.md` with the standard header if no area fits).
2. Reference shared users and seed data from `test-data/` instead of restating them; add new shared data there.
3. Cite requirement IDs in **Req**; add missing requirements to `requirements/<module>.md` first.
4. Update the counts in `<product>/traceability.md`.

New product: create `manual-tests/<product>/` with the same layout and add it to the table above.
