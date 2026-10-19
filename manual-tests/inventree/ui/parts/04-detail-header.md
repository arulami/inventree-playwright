# InvenTree Parts — Part detail — header & details panel (UI)

Requirements: [requirements/parts.md](../../requirements/parts.md) · Test data: [test-data/parts-environment.md](../../test-data/parts-environment.md) · Legend: [README](../../../README.md#legend)

## 4. Part detail — header & details panel

| ID | Title | Pre-conditions | Steps | Expected Result | Pri | Type | Req |
|---|---|---|---|---|---|---|---|
| TC-HDR-001 | Category breadcrumb | Part in `SMD Resistors` | 1. Open `R-10K-0603` | Breadcrumb shows Electronics › Resistors › SMD Resistors; each crumb navigates to that category | P2 | F | VIEW-01 |
| TC-HDR-002 | Details panel fields | Part with all fields filled | 1. Open part; toggle *Show Part Details* | IPN, Name, Description, Revision, Keywords, External Link, Creation Date (with user), Units visible | P1 | F | VIEW-02..10 |
| TC-HDR-003 | Creation date and user | Part created by `engineer` | 1. Open part | Creation date = creation day; creator = `engineer` | P3 | F | VIEW-08 |
| TC-HDR-004 | External link opens | Link set | 1. Click link | Opens the URL in a new tab | P3 | F | VIEW-07 |
| TC-HDR-005 | Keyword search | `R-10K-0603` keyword `pullup` | 1. Search `pullup` in part search | Part returned | P2 | F | VIEW-06 |
| TC-HDR-006 | Name display format | IPN `RES-0001`, revision `B` | 1. View part in a list/table | Displayed as `RES-0001 \| R-10K-0603 \| B` | P3 | F | REV-12 |
| TC-HDR-007 | Upload part image | — | 1. Hover image → Upload new image → select PNG | Image shown on detail page; thumbnail shown in category list | P2 | F | PART-11, PART-12 |
| TC-HDR-008 | Select existing image | Another part already has an image | 1. Hover → Select from existing images → pick | Selected image associated with this part | P3 | F | PART-12 |
| TC-HDR-009 | Delete image | Part has image | 1. Hover → Delete image | Image removed from this part only; other parts using the same file keep it | P3 | F | PART-12 |
| TC-HDR-010 | Upload invalid image | — | 1. Upload a `.txt` renamed `.png` / oversized file | Rejected with error | P3 | N | PART-11 |
| TC-HDR-011 | Edit part | `engineer` | 1. ⋮ → Edit; change description; Submit | Change saved and shown | P1 | F | — |
| TC-HDR-012 | Viewer cannot edit | `viewer` | 1. Open part | Edit / Delete / Duplicate actions absent or disabled | P1 | P | — |
