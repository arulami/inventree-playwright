# InvenTree Parts — Part creation — import flows (UI)

Requirements: [requirements/parts.md](../../requirements/parts.md) · Test data: [test-data/parts-environment.md](../../test-data/parts-environment.md) · Legend: [README](../../../README.md#legend)

## 2. Part creation — import flows

| ID | Title | Pre-conditions | Steps | Expected Result | Pri | Type | Req |
|---|---|---|---|---|---|---|---|
| TC-IMP-001 | Import parts from CSV | CSV with 5 valid rows (name, description, category, IPN) | 1. Add Parts → Import from File<br>2. Upload CSV; map columns<br>3. Complete wizard | 5 parts created with correct field values | P1 | F | CRT-07, PART-14 |
| TC-IMP-002 | Import with invalid rows | CSV with 1 row missing Name, 1 row with an unknown category | 1. Run import | Invalid rows flagged with errors; valid rows importable; invalid rows not created | P1 | N | CRT-07 |
| TC-IMP-003 | Import with column mapping mismatch | CSV headers differ from field names | 1. Upload; manually map columns | Mapping UI lets you assign columns; import succeeds after mapping | P2 | F | CRT-07 |
| TC-IMP-004 | Import unsupported file type | `.txt`/`.pdf` file | 1. Upload | Rejected with a clear error | P2 | N | CRT-07 |
| TC-IMP-005 | Import empty file / headers only | — | 1. Upload | No parts created; message that there is no data | P3 | B | CRT-07 |
| TC-IMP-006 | Import duplicate IPN when duplicates disallowed | "Allow Duplicate IPN" = False; CSV row uses `RES-0001` | 1. Import | Row rejected with duplicate IPN error | P2 | N | §14 |
| TC-IMP-007 | Import from Supplier unavailable without plugin | No supplier plugin installed | 1. Open Add Parts dropdown | *Import from Supplier* option not present | P2 | F | CRT-08 |
| TC-IMP-008 | Import part from supplier | Supplier mixin plugin installed; supplier company (and API token) configured | 1. Open category → *Import Part*<br>2. Search supplier part; select<br>3. Confirm category, select parameters, set initial stock<br>4. Finish | Part, supplier part and manufacturer part created; chosen parameters and initial stock present | P2 | F | CRT-08 |
| TC-IMP-009 | Import supplier part onto existing part | As above | 1. Open existing part → Suppliers panel → *Import supplier part* | Supplier part and its manufacturer part linked to the existing part | P2 | F | CRT-09 |
| TC-IMP-010 | Supplier plugin misconfigured | Plugin installed, no supplier company / token | 1. Attempt import | Error message shown; nothing is created | P3 | N | CRT-08 |
