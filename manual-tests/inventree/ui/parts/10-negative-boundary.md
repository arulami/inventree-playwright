# InvenTree Parts — Negative & boundary scenarios (UI)

Requirements: [requirements/parts.md](../../requirements/parts.md) · Test data: [test-data/parts-environment.md](../../test-data/parts-environment.md) · Legend: [README](../../../README.md#legend)

## 10. Negative & boundary scenarios (cross-cutting)

| ID | Title | Pre-conditions | Steps | Expected Result | Pri | Type | Req |
|---|---|---|---|---|---|---|---|
| TC-NEG-001 | Duplicate IPN when disallowed | `admin`: Allow Duplicate IPN = False; `RES-0001` exists | 1. Create part with IPN `RES-0001` | Rejected with IPN error | P1 | N | §14 |
| TC-NEG-002 | Duplicate IPN when allowed (default) | Default setting | 1. Create part with IPN `RES-0001` | Accepted | P2 | B | §14 |
| TC-NEG-003 | IPN case variant when disallowed ⚠ | As TC-NEG-001 | 1. IPN `res-0001` | Record behaviour (case-sensitivity) ⚠ | P3 | B | §14 |
| TC-NEG-004 | IPN regex enforced | IPN Regex = `^[A-Z]{3}-\d{4}$` | 1. IPN `RES-12`<br>2. IPN `RES-1234` | 1 rejected; 2 accepted | P1 | N | §14 |
| TC-NEG-005 | IPN editing disabled | Allow Editing IPN = False | 1. Edit existing part | IPN field read-only / change rejected | P2 | N | §14 |
| TC-NEG-006 | Duplicate part name | `R-10K-0603` exists | 1. Create part with the same name (same IPN/revision) | Rejected (name unique) ⚠ scope per §15 | P1 | N | VIEW-03 |
| TC-NEG-007 | Same name, different revision | — | 1. Create revision with same name, new code | Accepted | P2 | B | REV-01 |
| TC-NEG-008 | Field max lengths | — | 1. Name, IPN, Description, Keywords at max length and max+1 (e.g. 100/101) | Max accepted; max+1 rejected or blocked by input ⚠ (verify limits) | P2 | B | VIEW-02..06 |
| TC-NEG-009 | Whitespace-only name | — | 1. Name `"   "` | Rejected | P2 | N | VIEW-03 |
| TC-NEG-010 | Special characters / XSS in fields | — | 1. Name `<script>alert(1)</script>`, Description with `<img onerror>` | Saved as text; rendered escaped; no script runs anywhere (detail, list, breadcrumbs) | P1 | N | — |
| TC-NEG-011 | Unicode / emoji | — | 1. Name `Résistance 抵抗 🔧` | Saved and displayed correctly; searchable | P3 | B | — |
| TC-NEG-012 | Invalid external link | — | 1. Link `not a url`, `javascript:alert(1)` | Rejected | P2 | N | VIEW-07 |
| TC-NEG-013 | Min > max stock ⚠ | — | 1. Min 100, Max 10 | Rejected or warned ⚠ | P3 | B | PART-03, PART-04 |
| TC-NEG-014 | Negative min/max stock | — | 1. Min stock `-5` | Rejected | P2 | N | PART-03 |
| TC-NEG-015 | Low/over stock boundaries | Min 10, Max 50 | Set total stock to 9, 10, 50, 51 | 9 → low stock; 10 & 50 → neither; 51 → overstocked | P1 | B | PART-03, PART-04 |
| TC-NEG-016 | Delete part used in an assembly | Allow Deletion from Assembly = False; M3 Screw in a BOM | 1. Delete M3 Screw | Blocked | P1 | N | §14 |
| TC-NEG-017 | Delete part used in assembly (allowed) | Setting = True | 1. Delete M3 Screw | Deleted after confirmation; BOM line removed | P2 | F | §14 |
| TC-NEG-018 | Delete active part ⚠ | Active part, unlocked | 1. Delete | Blocked until made inactive ⚠ | P2 | N | ACT-02 |
| TC-NEG-019 | Virtual part with stock via other routes ⚠ | Virtual part | 1. Try receiving it on a PO / completing a build of it | No stock item created ⚠ | P2 | N | VRT-01 |
| TC-NEG-020 | Unique parameter collision (case) | `Serial Ref` = `ABC123` on part X | 1. Part Y: `Serial Ref` = `abc123` | Rejected | P1 | N | PRM-21 |
| TC-NEG-021 | Unique parameter collision (numeric/unit) | Unique template with units ohm; part X = `1000` | 1. Part Y = `1k` | Rejected | P2 | N | PRM-22 |
| TC-NEG-022 | Unique for model type only | Template "Unique for model type"; Part X = `Q1` | 1. Company: `Q1`<br>2. Part Y: `Q1` | 1 accepted; 2 rejected | P2 | B | PRM-20 |
| TC-NEG-023 | Duplicate parameter template name | `Resistance` exists | 1. Create template `Resistance` | Rejected | P2 | N | PRM-01 |
| TC-NEG-024 | Template with invalid units | — | 1. Create template units `foo` | Rejected | P2 | N | PRM-03 |
| TC-NEG-025 | Choices length boundary | — | 1. Choices string of 5000 chars, then 5001 | 5000 accepted; 5001 rejected | P3 | B | PRM-05 |
| TC-NEG-026 | Checkbox parameter invalid value via edit | RoHS checkbox | 1. Attempt value other than true/false | Not possible / rejected | P3 | N | PRM-06 |
| TC-NEG-027 | Concurrent edit ⚠ | Two sessions edit same part | 1. Both save different descriptions | Last save wins or conflict warning; no error page ⚠ | P3 | B | — |
| TC-NEG-028 | Direct URL to non-existent part | — | 1. Navigate to `/part/999999/` | Friendly "not found" page | P3 | N | — |
| TC-NEG-029 | Viewer cannot modify via direct URL/actions | `viewer` | 1. Open part; try Edit, New Stock Item, add parameter, add attachment | All blocked / hidden | P1 | P | CRT-02 |
| TC-NEG-030 | Global settings staff-only | `engineer` (non-staff) | 1. Open Admin Center → Parts settings | Not accessible | P2 | P | §14 |
