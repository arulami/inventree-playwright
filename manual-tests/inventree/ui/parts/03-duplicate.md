# InvenTree Parts — Duplicate part (UI)

Requirements: [requirements/parts.md](../../requirements/parts.md) · Test data: [test-data/parts-environment.md](../../test-data/parts-environment.md) · Legend: [README](../../../README.md#legend)

## 3. Duplicate part

| ID | Title | Pre-conditions | Steps | Expected Result | Pri | Type | Req |
|---|---|---|---|---|---|---|---|
| TC-DUP-001 | Duplicate part with default copy options | `Controller Board` has BOM, parameters, tests | 1. ⋮ → Duplicate Part<br>2. Change name; Submit | New part created; BOM, parameters and test templates copied (all copy options on by default) | P1 | F | DUP-01..04 |
| TC-DUP-002 | Duplicate without BOM | — | 1. Duplicate; untick Copy BOM | New part has empty BOM | P2 | F | DUP-02 |
| TC-DUP-003 | Duplicate without parameters / tests | — | 1. Duplicate; untick Copy Parameters and Copy Tests | New part has no parameters or test templates | P2 | F | DUP-03, DUP-04 |
| TC-DUP-004 | Copy defaults follow settings | `admin` sets "Copy Part BOM Data" = False | 1. Open Duplicate form | Copy BOM unticked by default | P3 | F | DUP-02 |
| TC-DUP-005 | Unique-parameter skipped on duplicate | Source part has `Serial Ref` (globally unique) = `SR-1` and `Colour` = `Red` | 1. Duplicate with Copy Parameters on | `Colour` copied; `Serial Ref` NOT copied | P1 | F | DUP-05 |
