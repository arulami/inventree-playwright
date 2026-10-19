# InvenTree Parts — Part creation — manual entry (UI)

Requirements: [requirements/parts.md](../../requirements/parts.md) · Test data: [test-data/parts-environment.md](../../test-data/parts-environment.md) · Legend: [README](../../../README.md#legend)

## 1. Part creation — manual entry

| ID | Title | Pre-conditions | Steps | Expected Result | Pri | Type | Req |
|---|---|---|---|---|---|---|---|
| TC-CRT-001 | Create part with only the required fields | Logged in as `engineer` | 1. Parts → Add Parts → Create Part<br>2. Enter Name `Test Part A`, Description, Category `Resistors`<br>3. Submit | Part is created; browser redirects to the new part's detail page; name/description/category shown correctly | P1 | F | CRT-01, CRT-04 |
| TC-CRT-002 | Create part with all optional fields | `engineer` | 1. Create Part<br>2. Fill IPN, Revision, Keywords, External Link (valid URL), Units, Min stock, Max stock, image<br>3. Submit | All values are saved and shown in the Part Details panel | P1 | F | VIEW-02..09 |
| TC-CRT-003 | Mandatory field validation | `engineer` | 1. Create Part<br>2. Leave Name blank<br>3. Submit | Form is not submitted; error shown against Name; no part created | P1 | N | CRT-03 |
| TC-CRT-004 | Error correction then re-submit | TC-CRT-003 state | 1. Enter a valid Name<br>2. Submit | Error clears; part created; redirected to detail | P2 | F | CRT-03 |
| TC-CRT-005 | Flag defaults follow global settings | Default settings | 1. Open Create Part form<br>2. Inspect attribute toggles | Component=on, Purchaseable=on; Template, Assembly, Trackable, Salable, Virtual=off | P1 | F | CRT-11 |
| TC-CRT-006 | Changed default flag is applied to form | `admin` sets "Salable" default = True | 1. Open Create Part form | Salable toggle is on by default | P2 | F | CRT-11 |
| TC-CRT-007 | Initial Stock section hidden by default | "Initial Stock Data" = False (default) | 1. Open Create Part | No *Create Initial Stock* option visible | P2 | F | CRT-05 |
| TC-CRT-008 | Create part with initial stock | `admin` enables "Initial Stock Data" | 1. Create Part<br>2. Tick *Create Initial Stock*, qty 100, location set<br>3. Submit | Part created with one stock item, qty 100, at the chosen location; Stock tab shows it | P1 | F | CRT-05 |
| TC-CRT-009 | Initial stock quantity boundaries | Initial Stock enabled | 1. Try qty `0`, `-1`, `abc`, `0.5` (pcs part) | Negative and non-numeric rejected with a field error; record actual behaviour for 0 and 0.5 ⚠ | P2 | B | CRT-05 |
| TC-CRT-010 | Supplier options shown for purchaseable part | "Initial Supplier Data" = True | 1. Create Part with Purchaseable on | *Add Supplier Data* option visible | P2 | F | CRT-06 |
| TC-CRT-011 | Supplier options hidden for non-purchaseable part | — | 1. Create Part, toggle Purchaseable off | *Add Supplier Data* section disappears | P2 | F | CRT-06 |
| TC-CRT-012 | Create part with supplier + manufacturer data | — | 1. Create Part (Purchaseable)<br>2. Tick *Add Supplier Data*; set supplier, SKU, manufacturer, MPN<br>3. Submit | Part created; Suppliers tab lists the supplier part and its manufacturer part | P1 | F | CRT-06 |
| TC-CRT-013 | Category parameters auto-added on create | `Resistors` has category templates `Resistance`, `Tolerance` with defaults; "Copy Category Parameter Templates" = True | 1. Create a part in `SMD Resistors` (sub-category) | Parameters tab shows Resistance and Tolerance with their default values | P1 | F | CRT-12, PRM-31 |
| TC-CRT-014 | Category parameters not copied when setting off | Same as above; setting = False | 1. Create a part in `Resistors` | No parameters are auto-added | P2 | F | CRT-12 |
| TC-CRT-015 | Add Parts menu hidden without create permission | Logged in as `viewer` | 1. Open Parts view | *Add Parts* dropdown not shown | P1 | P | CRT-02 |
| TC-CRT-016 | Create part from within a category | `engineer` | 1. Open category `Capacitors`<br>2. Add Parts → Create Part | Category field pre-filled with `Capacitors` ⚠ | P3 | F | CRT-01 |
| TC-CRT-017 | Cancel create form | — | 1. Open Create Part, fill fields<br>2. Cancel/close | No part created; no redirect | P3 | F | CRT-01 |
