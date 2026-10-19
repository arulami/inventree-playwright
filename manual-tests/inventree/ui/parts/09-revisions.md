# InvenTree Parts — Part revisions (UI)

Requirements: [requirements/parts.md](../../requirements/parts.md) · Test data: [test-data/parts-environment.md](../../test-data/parts-environment.md) · Legend: [README](../../../README.md#legend)

## 9. Part revisions

| ID | Title | Pre-conditions | Steps | Expected Result | Pri | Type | Req |
|---|---|---|---|---|---|---|---|
| TC-REV-001 | Create revision via Duplicate | Controller Board, Revision `A` | 1. ⋮ → Duplicate Part<br>2. Revision Of = Controller Board; Revision = `B`; Submit | New part created and opened; links back to the original | P1 | F | REV-08 |
| TC-REV-002 | Revision has independent data | Rev B created | 1. Add stock/parameters/BOM to rev B | Rev A data unchanged | P1 | F | REV-01 |
| TC-REV-003 | Existing references unaffected | Rev A on open PO and build order | 1. Create rev B | PO and build still reference rev A | P2 | F | REV-07 |
| TC-REV-004 | Free-text revision codes | — | Create revisions with codes `C`, `1.1`, `2026-10`, `rev_é` | All accepted | P3 | B | REV-02 |
| TC-REV-005 | Circular reference: self | Controller Board | 1. Edit; Revision Of = Controller Board | Rejected | P1 | N | REV-03 |
| TC-REV-006 | Duplicate revision code | Rev B exists for Controller Board | 1. Create another revision of Controller Board with code `B` | Rejected (unique code) | P1 | N | REV-04 |
| TC-REV-007 | Revision code case variants ⚠ | Rev B exists | 1. Create revision `b` | Record whether accepted; flag if it collides in display ⚠ | P3 | B | REV-04 |
| TC-REV-008 | Same code on different parent parts | Part X rev B exists | 1. Create Part Y rev B | Accepted (uniqueness is per part) | P2 | B | REV-04 |
| TC-REV-009 | Template cannot have revisions | Widget (template) | 1. Duplicate; Revision Of = Widget | Rejected | P1 | N | REV-05 |
| TC-REV-010 | Template revision via edit | Widget | 1. Edit an existing part; Revision Of = Widget | Rejected | P1 | N | REV-05 |
| TC-REV-011 | Making a part with revisions into a template ⚠ | Controller Board has rev B | 1. Toggle Template on Controller Board | Rejected ⚠ | P2 | N | REV-05 |
| TC-REV-012 | Variant can have revisions | Widget-Red | 1. Create revision of Widget-Red, code `B`, variant of Widget | Accepted | P1 | F | REV-05 |
| TC-REV-013 | Variant revision must keep template | Widget-Red | 1. Create revision of Widget-Red with Variant Of blank or another template | Rejected | P1 | N | REV-06 |
| TC-REV-014 | Revision-of-revision prevented (duplicate flow) | Rev B is a revision of Controller Board | 1. Open rev B → ⋮ → Duplicate Part<br>2. Revision Of = rev B; Revision = `C`; Submit | Rejected with error on *Revision Of*; no part created. New revisions must point at the original (Controller Board) ⚠ rule enforced by app, not stated in docs | P1 | N | REV-02, REV-03 |
| TC-REV-014a | Revision-of-revision prevented (edit flow) | Rev B as above; standalone part `Board X` | 1. Edit `Board X`; Revision Of = rev B; Submit | Rejected; Board X unchanged | P1 | N | REV-02, REV-03 |
| TC-REV-014b | Correct path for next revision | Rev B exists | 1. Duplicate rev B; Revision Of = Controller Board (original); Revision = `C` | Accepted; selector on any revision lists A, B, C | P1 | F | REV-08, REV-09 |
| TC-REV-014c | Part that has revisions cannot itself become a revision | Controller Board has rev B; another part `Board Y` | 1. Edit Controller Board; Revision Of = Board Y | Rejected (would create a revision chain) ⚠ | P2 | N | REV-02, REV-03 |
| TC-REV-015 | Indirect circular reference ⚠ | A → B (B is revision of A) | 1. Edit A; Revision Of = B | Rejected | P1 | N | REV-03 |
| TC-REV-016 | Revisions disabled | `admin` Part Revisions = False | 1. Open Create/Edit/Duplicate forms | Revision fields hidden/disabled | P2 | F | REV-10 |
| TC-REV-017 | Assembly Revision Only | Setting = True | 1. Create revision of `M3 Screw` (not assembly)<br>2. Create revision of Controller Board | 1 rejected; 2 accepted | P2 | N | REV-11 |
| TC-REV-018 | Name display includes revision | Rev B | 1. View in tables | `IPN \| Name \| B` | P3 | F | REV-12 |
| TC-REV-019 | Revision without Revision code ⚠ | — | 1. Duplicate; Revision Of set; Revision blank | Rejected or record behaviour ⚠ | P2 | B | REV-02 |
| TC-REV-020 | Delete original part with revisions ⚠ | Rev B exists | 1. Delete rev A | Behaviour recorded (blocked, or rev B unlinked); no orphaned errors on rev B page ⚠ | P3 | N | REV-01 |
