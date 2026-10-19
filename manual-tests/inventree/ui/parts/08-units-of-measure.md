# InvenTree Parts — Units of measure (UI)

Requirements: [requirements/parts.md](../../requirements/parts.md) · Test data: [test-data/parts-environment.md](../../test-data/parts-environment.md) · Legend: [README](../../../README.md#legend)

## 8. Units of measure

| ID | Title | Pre-conditions | Steps | Expected Result | Pri | Type | Req |
|---|---|---|---|---|---|---|---|
| TC-UOM-001 | Default unit is dimensionless | New part, Units blank | 1. Create; view stock | Quantities shown as pieces ("pcs") | P1 | F | PART-09, VIEW-09 |
| TC-UOM-002 | Physical unit on part | — | 1. Create `Hookup Wire` with Units `m` | Saved; stock quantities displayed in m | P1 | F | PART-09 |
| TC-UOM-003 | Invalid unit on part | — | 1. Units = `blargs` | Rejected with unit error | P1 | N | PART-09 |
| TC-UOM-004 | Fractional quantity for physical unit | Hookup Wire | 1. New Stock Item qty `12.5` | Accepted | P2 | B | PART-09 |
| TC-UOM-005 | Supplier part defaults to base unit | Hookup Wire (m) | 1. Add supplier part | Supplier part units default to `m` | P1 | F | PART-10 |
| TC-UOM-006 | Compatible supplier unit | — | 1. Set supplier part units `ft` / `cm` / `inch` | Accepted | P1 | F | PART-10 |
| TC-UOM-007 | Incompatible supplier unit | — | 1. Set supplier part units `kg` | Error shown; not saved | P1 | N | PART-10 |
| TC-UOM-008 | PO receipt converts units ⚠ | Supplier part in `ft`, pack 100 | 1. Receive 1 pack on a PO | Stock increases by 30.48 m ⚠ | P2 | F | PART-10 |
| TC-UOM-009 | Parameter in compatible unit | Tolerance `%` / Resistance `ohm` | 1. Enter `0.1 kohm` | Stored/normalised as 100 ohm for sort/filter | P2 | F | PRM-13 |
| TC-UOM-010 | Change units on part with stock ⚠ | Hookup Wire has stock | 1. Change Units to `ft` | Warning or conversion behaviour documented; no silent data corruption ⚠ | P3 | B | PART-09 |
