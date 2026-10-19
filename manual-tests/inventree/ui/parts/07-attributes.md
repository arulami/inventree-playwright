# InvenTree Parts — Part attributes, active & locked (UI)

Requirements: [requirements/parts.md](../../requirements/parts.md) · Test data: [test-data/parts-environment.md](../../test-data/parts-environment.md) · Legend: [README](../../../README.md#legend)

## 7. Part attributes

| ID | Title | Pre-conditions | Steps | Expected Result | Pri | Type | Req |
|---|---|---|---|---|---|---|---|
| TC-ATR-001 | Virtual: no stock | `Firmware Licence` | 1. Open part | Stock tab and New Stock Item hidden | P1 | F | ATTR-01, VRT-01 |
| TC-ATR-002 | Virtual: hidden in build required parts | Virtual part in a BOM | 1. Create build order for the assembly | Virtual part not listed in required parts; cost included in build cost | P2 | F | VRT-03 |
| TC-ATR-003 | Virtual: sales order, no allocation | — | 1. Add Firmware Licence to an SO; ship | Line included in total; no stock allocation required | P2 | F | VRT-04 |
| TC-ATR-004 | Virtual toggle on part with stock ⚠ | Part with existing stock | 1. Edit; set Virtual on | Blocked or warned (part already has stock) ⚠ | P2 | N | ATTR-01 |
| TC-ATR-005 | Template: variants allowed | — | 1. Toggle Template on | Variants tab appears; New Variant works | P1 | F | ATTR-02 |
| TC-ATR-006 | Template off with existing variants ⚠ | Widget has variants | 1. Try toggling Template off | Blocked or warned ⚠ | P2 | N | ATTR-02 |
| TC-ATR-007 | Assembly: BOM tab | — | 1. Toggle Assembly on/off | BOM tab appears/disappears | P1 | F | ATTR-03 |
| TC-ATR-008 | Component: Used In / BOM eligibility | — | 1. Toggle Component off | Used In tab hidden; part not offered when adding BOM lines | P1 | F | ATTR-04 |
| TC-ATR-009 | Trackable: serial on stock creation | `Controller Board` | 1. New Stock Item qty 3, serials `1-3` | 3 stock items with SN 1, 2, 3 | P1 | F | ATTR-06, TRK-03 |
| TC-ATR-010 | Trackable: serial syntax | Next SN = 8 | Enter in turn: `1,3,5`; `~`; `4+` (qty 3); `2+2`; `1 3-5 9+2`; `~+2` | [1,3,5]; [8]; [4,5,6]; [2,3,4]; [1,3,4,5,9,10,11]; [8,9,10] | P1 | B | TRK-03, TRK-04 |
| TC-ATR-011 | Trackable: serial count ≠ quantity | — | 1. Qty 3, serials `1-5` | Rejected (count mismatch) | P1 | N | TRK-03 |
| TC-ATR-012 | Trackable: duplicate serial | SN 1 exists | 1. Create another item with SN 1 | Rejected | P1 | N | TRK-03 |
| TC-ATR-013 | Trackable: serial unique across variants | Widget-Red SN 100 exists | 1. Create Widget-Blue SN 100 | Rejected | P1 | N | TPL-05 |
| TC-ATR-014 | Trackable: malformed serial | — | 1. Serials `5-1`, `a-b`, `1--3` | Rejected with error | P2 | N | TRK-03 |
| TC-ATR-015 | Trackable: batch code | — | 1. New Stock Item with batch `B2026-01`, no serial | Item created with batch | P2 | F | TRK-01 |
| TC-ATR-016 | Build output without serials | Trackable assembly, BOM has no tracked parts | 1. Create build output qty 5 with no serials | One output of qty 5 created | P2 | F | TRK-05 |
| TC-ATR-017 | Tracked BOM forces serials | BOM contains a trackable component | 1. Create build output with no serials | Serials required (error) | P2 | N | TRK-06 |
| TC-ATR-018 | Purchaseable: PO eligibility | — | 1. Create a PO; add line items | Purchaseable parts offered; non-purchaseable not offered | P1 | F | ATTR-07 |
| TC-ATR-019 | Salable: SO eligibility | — | 1. Create an SO; add line items | Salable parts offered; non-salable not offered | P1 | F | ATTR-08 |
| TC-ATR-020 | Testable: test tabs | — | 1. Toggle Testable on | Test Templates and Test Results tabs appear | P2 | F | ATTR-05 |
| TC-ATR-021 | Consumable: not allocated in build | Solder Paste in BOM, stock 10 | 1. Complete build order | Solder Paste not allocated; stock stays 10 | P2 | F | CNS-03 |
| TC-ATR-022 | Consumable: still stocked | — | 1. Add stock to Solder Paste | Stock managed normally | P3 | F | CNS-01 |
| TC-ATR-023 | Combined flags | Assembly + Component + Trackable + Purchaseable + Salable | 1. Open part | Union of tabs: BOM, Used In, Allocations, Suppliers, POs | P2 | F | §2.2 |

### 7.1 Active / Inactive

| ID | Title | Pre-conditions | Steps | Expected Result | Pri | Type | Req |
|---|---|---|---|---|---|---|---|
| TC-ACT-001 | New part is active | — | 1. Create part | Active = on | P1 | F | ACT-01 |
| TC-ACT-002 | Mark inactive | — | 1. Edit; Active off | Part shows inactive badge; remains in database/search | P1 | F | ACT-02 |
| TC-ACT-003 | Inactive part hidden by Active filter | — | 1. Category list with Active = Yes | Inactive part absent; with filter cleared it's present | P2 | F | ACT-02 |
| TC-ACT-004 | Inactive part excluded from new SO line ⚠ | Inactive salable part | 1. Add SO line; search part | Not selectable ⚠ | P1 | N | ACT-02 |
| TC-ACT-005 | Inactive part excluded from new PO line ⚠ | Inactive purchaseable part | 1. Add PO line | Not selectable ⚠ | P1 | N | ACT-02 |
| TC-ACT-006 | Inactive part excluded from new BOM line ⚠ | Inactive component | 1. Add BOM line | Not selectable ⚠ | P2 | N | ACT-02 |
| TC-ACT-007 | Inactive part — new build order ⚠ | Inactive assembly | 1. Create build order for it | Not selectable / rejected ⚠ | P2 | N | ACT-02 |
| TC-ACT-008 | Existing records survive deactivation | Part on an open PO and in a BOM | 1. Deactivate | Existing PO line and BOM line remain intact | P2 | F | ACT-02 |
| TC-ACT-009 | Reactivate | Inactive part | 1. Active on | All restrictions lifted | P2 | F | ACT-01 |
| TC-ACT-010 | Active Variants Only pricing | Setting on; Widget-Blue inactive with pricing | 1. View Widget pricing | Widget-Blue price excluded | P3 | F | PRC-12 |

### 7.2 Locked parts

| ID | Title | Pre-conditions | Steps | Expected Result | Pri | Type | Req |
|---|---|---|---|---|---|---|---|
| TC-LCK-001 | Lock a part | "Part Locking" = True | 1. Edit; Locked on | Lock indicator shown | P1 | F | LOCK-01 |
| TC-LCK-002 | Locked part cannot be deleted | Locked | 1. ⋮ → Delete | Blocked with message | P1 | N | LOCK-02 |
| TC-LCK-003 | Locking disabled globally | Part locked; `admin` sets Part Locking = False | 1. Edit BOM, parameters; delete part | All operations allowed | P1 | F | LOCK-05 |
| TC-LCK-004 | Unlock restores edits | Locked | 1. Unlock; edit BOM | Edit allowed | P2 | F | LOCK-01 |
