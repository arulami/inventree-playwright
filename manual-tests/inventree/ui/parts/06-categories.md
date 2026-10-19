# InvenTree Parts — Part categories & parametric tables (UI)

Requirements: [requirements/parts.md](../../requirements/parts.md) · Test data: [test-data/parts-environment.md](../../test-data/parts-environment.md) · Legend: [README](../../../README.md#legend)

## 6. Part categories

| ID | Title | Pre-conditions | Steps | Expected Result | Pri | Type | Req |
|---|---|---|---|---|---|---|---|
| TC-CAT-001 | Create top-level category | `engineer` | 1. Parts → New Category `Tools` (no parent) | Created at top level | P1 | F | PART-05 |
| TC-CAT-002 | Create sub-category | — | 1. Inside `Resistors` → New Category `THT Resistors` | Parent = Resistors; listed under Resistors | P1 | F | PART-05 |
| TC-CAT-003 | Category lists sub-category parts | Part in `SMD Resistors` | 1. Open `Electronics` | Part from SMD Resistors included in the part list | P1 | F | PART-06 |
| TC-CAT-004 | Direct sub-categories only | — | 1. Open `Electronics` → sub-categories panel | Shows Resistors and Capacitors (not SMD Resistors directly) | P2 | F | PART-06 |
| TC-CAT-005 | Part list columns | — | 1. Open category part table | Name, description, thumbnail, category, stock level shown | P2 | F | PART-07 |
| TC-CAT-006 | Filter part list (single) | — | 1. Add filter Active = Yes | Only active parts listed | P1 | F | PART-07 |
| TC-CAT-007 | Combine multiple filters | — | 1. Filters Assembly = Yes and Trackable = Yes | Only parts matching both | P2 | F | PART-07 |
| TC-CAT-008 | Low stock filter/indicator | `M3 Screw` min stock 100, stock 60 | 1. Filter Low Stock | M3 Screw listed and flagged low stock | P1 | F | PART-03 |
| TC-CAT-009 | Navigate to part detail | — | 1. Click part name in list | Part Detail page opens | P2 | F | PART-08 |
| TC-CAT-010 | Move category to a new parent | — | 1. Edit `Capacitors`; parent = `Mechanical` | Breadcrumbs and parts follow the move | P2 | F | PART-05 |
| TC-CAT-011 | Category as its own parent | — | 1. Edit `Resistors`; parent = `Resistors` | Rejected | P2 | N | PART-05 |
| TC-CAT-012 | Category moved under its own descendant | — | 1. Edit `Electronics`; parent = `SMD Resistors` | Rejected (circular hierarchy) | P1 | N | PART-05 |
| TC-CAT-013 | Delete category with parts/sub-categories ⚠ | `Resistors` has parts and sub-category | 1. Delete Resistors | Options/confirmation for what happens to children shown; parts are not silently lost | P2 | N | PART-05 |
| TC-CAT-014 | Category default icon | `admin` sets "Part Category Default Icon" | 1. View categories without own icon | Default icon displayed | P3 | F | §14 |
| TC-CAT-015 | Add category parameter template | `admin` | 1. Settings → Categories → select `Resistors` → New Parameter `Resistance`, default `1k` | Template linked to category | P1 | F | PRM-30 |
| TC-CAT-016 | Unique template has no category default | Category template on `Serial Ref` (unique) with default | 1. Create a part in that category | Serial Ref default NOT applied | P2 | N | PRM-24 |
| TC-CAT-017 | Category subscription | `engineer` subscribes to `Electronics` | 1. Drop stock of a part in SMD Resistors below its minimum | Subscriber receives low-stock notification | P3 | F | NTF-04 |

### 6.1 Parametric tables

| ID | Title | Pre-conditions | Steps | Expected Result | Pri | Type | Req |
|---|---|---|---|---|---|---|---|
| TC-PTB-001 | Open parametric view | Resistors with parameters | 1. Category → Parametric View | Parameter columns shown | P1 | F | PRM-40 |
| TC-PTB-002 | Sort by unit-aware parameter | Values `1k`, `470`, `2.2k`, `1M` | 1. Click Resistance header (asc, then desc) | Order 470, 1k, 2.2k, 1M (and reverse) | P1 | F | PRM-41 |
| TC-PTB-003 | Numeric filter `>` | — | 1. Resistance > `1k` | Only 2.2k and 1M | P1 | F | PRM-42 |
| TC-PTB-004 | Range filter (two filters, same parameter) | — | 1. Resistance > `500` and < `1.5k` | Only 1k | P2 | F | PRM-44 |
| TC-PTB-005 | Unit-aware filter value | — | 1. Resistance = `1000`, then = `1k` | Same result both times | P2 | F | PRM-45 |
| TC-PTB-006 | Filter operators | — | 1. Exercise `=`, `>=`, `<=`, `!=`, `<` | Correct subsets each time | P2 | F | PRM-42 |
| TC-PTB-007 | Text contains filter | Colour values Red, Dark Red, Blue | 1. Colour `~ red` | Red and Dark Red | P2 | F | PRM-42 |
| TC-PTB-008 | Choice filter | Package parameter | 1. Filter Package | Choice list offered (0402/0603/0805) | P3 | F | PRM-43 |
| TC-PTB-009 | AND across parameters | — | 1. Resistance > 1k and Package = 0603 | Only parts matching both | P2 | F | PRM-44 |
| TC-PTB-010 | Remove filter | Filter active | 1. Click the filter button | Filter removed; full list returns | P3 | F | PRM-46 |
| TC-PTB-011 | Parts missing a parameter | One part has no Resistance | 1. Sort and filter by Resistance | No error; part sorts consistently and is excluded by value filters | P3 | B | PRM-41 |
| TC-PTB-012 | Invalid filter value | — | 1. Resistance > `abc` | Validation error or no results; no crash | P3 | N | PRM-42 |
