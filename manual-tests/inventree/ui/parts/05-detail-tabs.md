# InvenTree Parts — Part detail — tabs (UI)

Requirements: [requirements/parts.md](../../requirements/parts.md) · Test data: [test-data/parts-environment.md](../../test-data/parts-environment.md) · Legend: [README](../../../README.md#legend)

## 5. Part detail — tabs

### 5.1 Stock

| ID | Title | Pre-conditions | Steps | Expected Result | Pri | Type | Req |
|---|---|---|---|---|---|---|---|
| TC-TAB-STK-001 | Stock tab lists stock items | `M3 Screw` has 3 stock items at 2 locations | 1. Open Stock tab | 3 rows with quantity, location, status | P1 | F | TAB-02 |
| TC-TAB-STK-002 | Total stock equals sum | Items of 10, 20, 30 | 1. Check header/overview stock figure | Total = 60 | P1 | F | PART-02 |
| TC-TAB-STK-003 | New Stock Item | — | 1. Stock tab → New Stock Item; qty 5; location; Submit | Item added; total increases by 5 | P1 | F | TAB-02 |
| TC-TAB-STK-004 | Stock Actions require selection | — | 1. Check Stock Actions with no rows selected<br>2. Select 2 rows | Disabled with no selection; enabled (count, transfer, etc.) after selection | P2 | F | TAB-02 |
| TC-TAB-STK-005 | Export stock | — | 1. Export → choose format → confirm | File downloaded containing all stock items for the part | P2 | F | TAB-02 |
| TC-TAB-STK-006 | Template stock includes variants | Widget-Red 5, Widget-Blue 3, Widget 0 | 1. Open Widget Stock tab / stock total | Total 8; variant items listed | P1 | F | TPL-04 |

### 5.2 Bill of Materials

| ID | Title | Pre-conditions | Steps | Expected Result | Pri | Type | Req |
|---|---|---|---|---|---|---|---|
| TC-TAB-BOM-001 | BOM tab visible only for assemblies | `Controller Board` (assembly), `M3 Screw` (not) | 1. Open each part | BOM tab on Controller Board only | P1 | F | TAB-04 |
| TC-TAB-BOM-002 | Add BOM item | Controller Board unlocked | 1. BOM tab → Add item `M3 Screw` qty 4 | Line added with qty 4 | P1 | F | ATTR-03 |
| TC-TAB-BOM-003 | Only components selectable | `Firmware Licence` with Component off ⚠ | 1. Add BOM item; search for non-component part | Non-component parts not offered / rejected | P2 | N | ATTR-04 |
| TC-TAB-BOM-004 | Zero quantity rejected by default | "Allow BOM Zero Quantity" = False | 1. Add BOM item with qty 0 | Validation error | P2 | B | §14 |
| TC-TAB-BOM-005 | Zero quantity allowed when enabled | Setting = True | 1. Add BOM item with qty 0 and a setup quantity | Accepted | P3 | B | §14 |
| TC-TAB-BOM-006 | Virtual part in BOM | — | 1. Add `Firmware Licence` (set Component on) to BOM | Line added and included in BOM pricing | P2 | F | VRT-02 |
| TC-TAB-BOM-007 | Consumable BOM line flag | — | 1. Add `M3 Screw`, tick Consumable on the line | Line marked consumable for this assembly only; M3 Screw not consumable elsewhere | P2 | F | CNS-04 |
| TC-TAB-BOM-008 | BOM edit blocked on locked assembly | Controller Board locked; locking enabled | 1. Try add / edit / delete a BOM line | All three operations blocked with message | P1 | N | LOCK-03 |

### 5.3 Allocations

| ID | Title | Pre-conditions | Steps | Expected Result | Pri | Type | Req |
|---|---|---|---|---|---|---|---|
| TC-TAB-ALC-001 | Allocations tab visibility | Parts with: component only; salable only; neither | 1. Open each | Tab shown for component and salable parts; hidden for neither | P1 | F | TAB-03 |
| TC-TAB-ALC-002 | Build allocation shown | `M3 Screw` allocated to an open build order | 1. Open Allocations tab | Build order, quantity allocated listed | P2 | F | TAB-03 |
| TC-TAB-ALC-003 | Sales allocation shown | Widget-Red allocated to an open SO | 1. Open Allocations tab | Sales order allocation listed | P2 | F | TAB-03 |

### 5.4 Build Orders / Used In

| ID | Title | Pre-conditions | Steps | Expected Result | Pri | Type | Req |
|---|---|---|---|---|---|---|---|
| TC-TAB-BLD-001 | Build Orders tab content | Controller Board has 2 builds | 1. Open Build Orders tab | Each build shows quantity, status, creation and completion dates | P2 | F | TAB-05 |
| TC-TAB-USE-001 | Used In tab for components | M3 Screw in Controller Board BOM | 1. Open M3 Screw → Used In | Controller Board listed | P2 | F | TAB-06 |
| TC-TAB-USE-002 | Used In hidden for non-components | Part with Component off | 1. Open part | No Used In tab | P2 | F | TAB-06 |

### 5.5 Parameters

| ID | Title | Pre-conditions | Steps | Expected Result | Pri | Type | Req |
|---|---|---|---|---|---|---|---|
| TC-TAB-PRM-001 | Add parameter | — | 1. Parameters tab → New Parameter → `Resistance`, `10k` → Submit | Parameter listed with value 10k ohm | P1 | F | PRM-10 |
| TC-TAB-PRM-002 | Compatible unit accepted | Resistance base unit `ohm` | 1. Add Resistance `4.7kohm` / `1Mohm` | Accepted | P1 | F | PRM-13 |
| TC-TAB-PRM-003 | Incompatible unit rejected | "Enforce Parameter Units" = True | 1. Add Resistance `5 m` | Rejected with unit error | P1 | N | PRM-11 |
| TC-TAB-PRM-004 | Unit enforcement off | Setting = False | 1. Add Resistance `5 m` | Accepted | P2 | F | PRM-12 |
| TC-TAB-PRM-005 | Choices enforced | `Package` choices 0402,0603,0805 | 1. Add Package; check options; try `1206` | Only listed choices offered; other value rejected | P1 | N | PRM-05 |
| TC-TAB-PRM-006 | Checkbox parameter | `RoHS` checkbox | 1. Add RoHS | Only true/false control offered | P2 | F | PRM-06 |
| TC-TAB-PRM-007 | Selection list parameter | Template linked to a selection list | 1. Add parameter | Values only from the list | P2 | F | PRM-07 |
| TC-TAB-PRM-008 | Edit and delete parameter | Unlocked part | 1. Edit value; then delete | Changes applied; parameter removed | P2 | F | PRM-10 |
| TC-TAB-PRM-009 | Parameter changes blocked on locked part | Part locked | 1. Try create / edit / delete parameter | All blocked | P1 | N | LOCK-04 |

### 5.6 Variants

| ID | Title | Pre-conditions | Steps | Expected Result | Pri | Type | Req |
|---|---|---|---|---|---|---|---|
| TC-TAB-VAR-001 | Variants tab only for templates | Widget (template), M3 Screw (not) | 1. Open each | Variants tab on Widget only | P1 | F | TAB-01 |
| TC-TAB-VAR-002 | Create variant | — | 1. Widget → Variants → New Variant<br>2. Name `Widget-Green`; Submit | Variant created referencing Widget; listed in Variants tab | P1 | F | TPL-03 |
| TC-TAB-VAR-003 | Enable template via toggle | Part not template | 1. Details → part options → toggle Template on | Variants tab appears | P2 | F | TPL-01 |
| TC-TAB-VAR-004 | Variant inherits test templates | Widget has test `Burn In` | 1. Open Widget-Red → Test Templates | `Burn In` shown as inherited | P1 | F | TST-02 |

### 5.7 Revisions (selector)

| ID | Title | Pre-conditions | Steps | Expected Result | Pri | Type | Req |
|---|---|---|---|---|---|---|---|
| TC-TAB-REV-001 | Selector hidden with a single revision | Part with no revisions | 1. Open part | No *Select Part Revision* dropdown | P2 | F | REV-09 |
| TC-TAB-REV-002 | Selector shown with multiple revisions | Controller Board rev A and rev B | 1. Open rev A | Dropdown lists A and B; choosing B navigates to rev B | P1 | F | REV-09 |

### 5.8 Attachments / Notes

| ID | Title | Pre-conditions | Steps | Expected Result | Pri | Type | Req |
|---|---|---|---|---|---|---|---|
| TC-TAB-ATT-001 | Upload multiple attachments | — | 1. Attachments → upload a PDF datasheet and a PNG | Both listed with filename; downloadable | P2 | F | TAB-18 |
| TC-TAB-ATT-002 | Add link attachment ⚠ | — | 1. Add external link attachment | Link listed and opens | P3 | F | TAB-18 |
| TC-TAB-ATT-003 | Delete attachment | Attachment present | 1. Delete | Removed from list | P3 | F | TAB-18 |
| TC-TAB-NTS-001 | Markdown notes | — | 1. Notes tab → enter `**bold**` and a list; save; reload | Rendered as markdown and persisted | P3 | F | TAB-19 |

### 5.9 Related Parts

| ID | Title | Pre-conditions | Steps | Expected Result | Pri | Type | Req |
|---|---|---|---|---|---|---|---|
| TC-TAB-REL-001 | Add related part | "Show related parts" = True | 1. Related Parts → add `M3 Screw` to `Controller Board` | Relation listed on Controller Board and on M3 Screw ⚠ (two-way) | P2 | F | TAB-16 |
| TC-TAB-REL-002 | Tab hidden when disabled | Setting = False | 1. Open part | No Related Parts tab | P2 | F | TAB-16 |
| TC-TAB-REL-003 | Relate part to itself | — | 1. Add the same part as related | Rejected ⚠ | P3 | N | TAB-16 |
| TC-TAB-REL-004 | Duplicate relation | Relation exists | 1. Add same relation again | Rejected or no duplicate row ⚠ | P3 | N | TAB-16 |
| TC-TAB-REL-005 | Remove relation | Relation exists | 1. Delete row | Removed on both parts | P3 | F | TAB-16 |

### 5.10 Test Templates / Test Results

| ID | Title | Pre-conditions | Steps | Expected Result | Pri | Type | Req |
|---|---|---|---|---|---|---|---|
| TC-TAB-TST-001 | Tabs visible only for testable parts | Testable vs non-testable part | 1. Open each | Test Templates and Test Results tabs only on testable part | P1 | F | TAB-14, TAB-15 |
| TC-TAB-TST-002 | Create test template | Widget testable | 1. Test Templates → Add; Name `Firmware Version`; Required, Requires Value; Submit | Template listed; key `firmwareversion` | P1 | F | TST-04, TST-06, TST-07 |
| TC-TAB-TST-003 | Test key generation | — | Create templates named: `" My NEW T E sT "`, `100 Percent Test`, `Test 123` | Keys: `mynewtest`, `_100percenttest`, `test123` | P2 | B | TST-04 |
| TC-TAB-TST-004 | Duplicate test name on same part | `Firmware Version` exists | 1. Add another `Firmware Version` | Rejected | P1 | N | TST-03 |
| TC-TAB-TST-005 | Duplicate test name across variant set | Widget has `Burn In` | 1. On Widget-Red, add `Burn In` | Rejected | P2 | N | TST-03 |
| TC-TAB-TST-006 | Same name differing only in case/spaces ⚠ | `Firmware Version` exists | 1. Add `firmware  version` | Rejected (same key) ⚠ | P3 | B | TST-03, TST-04 |
| TC-TAB-TST-007 | Requires Value enforced | Template with Requires Value | 1. Record a result on a stock item without a value | Rejected | P1 | N | TST-07 |
| TC-TAB-TST-008 | Requires Attachment enforced | Template with Requires Attachment | 1. Record a result without a file | Rejected | P1 | N | TST-08 |
| TC-TAB-TST-009 | Disable test template | Template has results | 1. Set Enabled = off | Template disabled; historical results still visible | P2 | F | TST-09 |
| TC-TAB-TST-010 | Delete template deletes results | Template has results | 1. Delete template | Template and all its results removed (confirm the warning) | P2 | F | TST-10 |
| TC-TAB-TST-011 | Test Results aggregation | 2 stock items with results | 1. Open Test Results tab | Results for both items shown in one table | P2 | F | TST-11 |

### 5.11 Other tabs

| ID | Title | Pre-conditions | Steps | Expected Result | Pri | Type | Req |
|---|---|---|---|---|---|---|---|
| TC-TAB-SUP-001 | Suppliers & Purchase Orders tabs | Purchaseable vs non-purchaseable | 1. Open each | Both tabs only on purchaseable part | P1 | F | TAB-08, TAB-09 |
| TC-TAB-SO-001 | Sales Orders tab content | Salable part in an SO | 1. Open Sales Orders tab | Customer, status, creation and shipment dates | P3 | F | TAB-10 |
| TC-TAB-RO-001 | Return Orders tab visibility | Salable part; toggle return order feature | 1. Open with feature on / off; also with non-salable part | Shown only when salable AND feature enabled | P2 | F | TAB-11 |
| TC-TAB-TO-001 | Transfer Orders tab visibility | Feature enabled | 1. Open regular part and virtual part<br>2. Disable feature; reopen | Shown for regular part; hidden for virtual; hidden for all when disabled | P2 | F | TAB-12 |
| TC-TAB-PRC-001 | Pricing tab with no data | New part | 1. Open Part Pricing | Each category shows "No data" | P3 | F | PRC-03 |
| TC-TAB-PRC-002 | Manual price override | — | 1. Set min/max override | Overall pricing uses overridden values | P2 | F | PRC-02 |
| TC-TAB-PRC-003 | BOM pricing incomplete | One BOM line without pricing | 1. Open assembly pricing | BOM pricing shown only for priced lines; flagged as incomplete | P2 | F | PRC-07 |
| TC-TAB-HIS-001 | Stock History tab | Stocktake enabled; user setting on | 1. Stock History → Generate Stocktake Entry | Entry appears after generation | P3 | F | STK-03, STK-04 |
