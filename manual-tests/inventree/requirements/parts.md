# InvenTree Parts — Ingested Requirements

Source: InvenTree stable docs (https://docs.inventree.org/en/stable/part/ + sub-pages), fetched 2026-10-18.
Page footers dated 2026-08-28; sitemap lastmod 2026-10-17.
IDs (e.g. `PART-01`) are assigned here for traceability; the docs do not number them.

Pages ingested (all 12 `/part/*` pages in the sitemap + 2 linked pages):
`part/`, `part/views/`, `part/create/`, `part/template/`, `part/revision/`, `part/virtual/`,
`part/consumable/`, `part/trackable/`, `part/test/`, `part/pricing/`, `part/stocktake/`,
`part/notification/`, `concepts/parameters/` (Part Parameters moved here; `/part/parameter/` is 404),
`settings/global/` (Parts section).

---

## 1. Part core (`/part/`)

| ID | Requirement |
|---|---|
| PART-01 | A Part is the archetype of any stock item; a part can have many stock items across locations. |
| PART-02 | Total stock = sum of quantities of all the part's stock items. |
| PART-03 | Optional **minimum stock**: total stock below it → part flagged "low stock" (visible in UI). |
| PART-04 | Optional **maximum stock**: total stock above it → part flagged "overstocked" (visible in UI). |
| PART-05 | Parts belong to hierarchical **categories**. |
| PART-06 | Category view lists all parts in the category **including sub-categories**, plus its direct sub-categories. |
| PART-07 | Category part list shows name, description, image thumbnail, category, stock level; supports multiple user-configurable filters. |
| PART-08 | Clicking a part name opens the Part Detail page. |
| PART-09 | Units of measure: default blank = dimensionless "pieces"; physical units supported (e.g. metres). |
| PART-10 | Supplier part units default to the base part's unit; may be changed only to a **compatible** unit (m → ft, cm, in); incompatible unit → error. |
| PART-11 | One image per part; thumbnails auto-generated on upload. |
| PART-12 | Image actions (hover on image): Upload new image, Select from existing images, Delete image (removes association only). |
| PART-13 | Image upload also supported via API, Python lib, and mobile app (file or camera). |
| PART-14 | Bulk import of parts via data import wizard. |

### 1.1 Part attributes (flags)

| ID | Flag | Behaviour | Default (global setting) |
|---|---|---|---|
| ATTR-01 | Virtual | Non-physical (licence, labour, process step). **Cannot have stock items**; stock UI hidden. | False |
| ATTR-02 | Template | Can have variants. | False |
| ATTR-03 | Assembly | Built from components; has a BOM; can be disassembled. | False |
| ATTR-04 | Component | Can be used as a BOM sub-component. | True |
| ATTR-05 | Testable | Can have test templates; test results recorded against stock items. | — |
| ATTR-06 | Trackable | Stock items get batch and/or serial numbers; extra restrictions. | False |
| ATTR-07 | Purchaseable | Can link Supplier Parts and be ordered on Purchase Orders. | True |
| ATTR-08 | Salable | Can be added to Sales Orders. | False |
| ATTR-09 | Consumable | Used up in builds; not allocated as discrete items. | — |

### 1.2 Active / Locked

| ID | Requirement |
|---|---|
| ACT-01 | All parts are **Active** by default. |
| ACT-02 | Inactive parts are unavailable for many actions but remain in the DB (recommended over deletion for obsolete parts). |
| LOCK-01 | Parts can be **locked** to prevent modification. |
| LOCK-02 | Locked parts **cannot be deleted**. |
| LOCK-03 | BOM items of a locked assembly cannot be created, edited or deleted. |
| LOCK-04 | Parameters of a locked part cannot be created, edited or deleted. |
| LOCK-05 | Setting **Part Locking** (`PART_ENABLE_LOCKING`, default True): when disabled, locked state is ignored and all operations allowed. |

---

## 2. Part Detail view (`/part/views/`)

### 2.1 Header / details fields

| ID | Field | Rule |
|---|---|---|
| VIEW-01 | Category breadcrumb | Shown in top nav bar. |
| VIEW-02 | IPN | Optional. |
| VIEW-03 | Name | Simple **unique** text label. |
| VIEW-04 | Description | Long-form text. |
| VIEW-05 | Revision | Optional revision code. |
| VIEW-06 | Keywords | Optional; improves search. |
| VIEW-07 | External Link | URL to external docs. |
| VIEW-08 | Creation Date | Shows date and creating user. |
| VIEW-09 | Units | Default "pcs". |
| VIEW-10 | "Show Part Details" toggle in header panel. |

### 2.2 Tabs and visibility rules

| ID | Tab | Visible when |
|---|---|---|
| TAB-01 | Variants | Part is **Template** |
| TAB-02 | Stock | Always (hidden for Virtual per ATTR-01). Actions: Export, New Stock Item, Stock Actions (on selected rows) |
| TAB-03 | Allocations | Part is **Component** or **Salable** |
| TAB-04 | Bill of Materials | Part is **Assembly** |
| TAB-05 | Build Orders | (no rule stated) |
| TAB-06 | Used In | Part is **Component** |
| TAB-07 | Part Pricing | (no rule stated) |
| TAB-08 | Suppliers | Part is **Purchaseable** |
| TAB-09 | Purchase Orders | Part is **Purchaseable** |
| TAB-10 | Sales Orders | (no rule stated) |
| TAB-11 | Return Orders | Part is **Salable** AND return orders enabled |
| TAB-12 | Transfer Orders | Hidden if **Virtual** or transfer orders disabled |
| TAB-13 | Stock History | (requires Stocktake + user setting "Enable Stock History") |
| TAB-14 | Test Templates | Part is **Testable** |
| TAB-15 | Test Results | Part is **Testable** |
| TAB-16 | Related Parts | Global setting "Show related parts" enabled (default True) |
| TAB-17 | Parameters | Always |
| TAB-18 | Attachments | Always (multiple files) |
| TAB-19 | Notes | Always (markdown) |

---

## 3. Creating a Part (`/part/create/`)

| ID | Requirement |
|---|---|
| CRT-01 | Entry: Parts view → **Add Parts** dropdown → Create Part / Import from File / Import from Supplier (plugin). |
| CRT-02 | **Add Parts** menu hidden if user lacks *create* permission on the Part permission group. |
| CRT-03 | Form errors must be fixed before submit succeeds. |
| CRT-04 | On success, browser redirects to the new part's detail page. |
| CRT-05 | **Initial Stock** section shown only if setting "Initial Stock Data" enabled (default **False**); checking *Create Initial Stock* allows creating initial quantity. |
| CRT-06 | **Supplier Options** shown only if part is Purchaseable (and "Initial Supplier Data", default True); *Add Supplier Data* adds supplier + manufacturer part. |
| CRT-07 | Import from File → data import wizard. |
| CRT-08 | Import from Supplier requires a supplier-mixin plugin + supplier company setting (maybe API tokens); creates part, supplier part, manufacturer part; wizard confirms category, selects parameters, creates initial stock. |
| CRT-09 | Supplier part import via "Import supplier part" button on an existing part's Suppliers panel. |
| CRT-10 | Other creation routes: REST API, Python lib, Django admin. |
| CRT-11 | New parts get flag defaults from global settings (see §1.1). |
| CRT-12 | Category parameter templates are copied to new parts when "Copy Category Parameter Templates" enabled (default True). |

### 3.1 Duplicate Part (from Revisions/Templates pages + settings)

| ID | Requirement |
|---|---|
| DUP-01 | Part actions menu (⋮) → **Duplicate Part** opens Duplicate Part form. |
| DUP-02 | Copy BOM by default ("Copy Part BOM Data", default True). |
| DUP-03 | Copy parameters by default ("Copy Part Parameter Data", default True). |
| DUP-04 | Copy tests by default ("Copy Part Test Data", default True). |
| DUP-05 | Parameters whose template has a **uniqueness** requirement are **skipped** when copying. |

---

## 4. Part Parameters (`/concepts/parameters/`)

### 4.1 Templates

| ID | Requirement |
|---|---|
| PRM-01 | Template **Name** is required and **must be unique**. |
| PRM-02 | Description optional. |
| PRM-03 | Units optional; must be a valid physical unit. |
| PRM-04 | Model Type: model the template applies to (Part, Company…); blank = any model. |
| PRM-05 | Choices: comma-separated valid values; limited to **5000 characters**. |
| PRM-06 | Checkbox: values may only be true/false. |
| PRM-07 | Selection List: values only from the linked list; plugins may lock selection lists. |
| PRM-08 | Templates created/edited in Admin Center → Settings → Parameters → New Parameter (Name required, Units optional). |

### 4.2 Values

| ID | Requirement |
|---|---|
| PRM-10 | Add: Part → Parameters tab → New Parameter → select Template, enter Data → Submit. |
| PRM-11 | Values must be in units compatible with template units; incompatible → rejected. |
| PRM-12 | Unit enforcement controlled by "Enforce Parameter Units" (default True); disabled → any value accepted. |
| PRM-13 | Values may be entered in any compatible unit (e.g. `1k` for ohm). |

### 4.3 Uniqueness

| ID | Requirement |
|---|---|
| PRM-20 | Options: No uniqueness (default) / Unique for model type / Globally unique. |
| PRM-21 | Checks are **case-insensitive** (`ABC123` == `abc123`). |
| PRM-22 | With units, compared on **normalised numeric value** (`1k` dup of `1000` ohm); without units, raw text compare. |
| PRM-23 | Violations rejected with error message. |
| PRM-24 | Category default values are **not** applied for templates with a uniqueness requirement. |

### 4.4 Category parameters

| ID | Requirement |
|---|---|
| PRM-30 | Staff can link parameter templates (with default values) to a category. |
| PRM-31 | New parts created in that category **or sub-category** receive those parameters/defaults. |

### 4.5 Parametric table

| ID | Requirement |
|---|---|
| PRM-40 | "Parametric View" button shows parameters as columns. |
| PRM-41 | Click column header to sort; sorting is unit-aware. |
| PRM-42 | Filter operators: `=`, `>`, `>=`, `<`, `<=`, `!=`, `~` (contains, text). |
| PRM-43 | Filter options depend on type (choices vs numeric). |
| PRM-44 | Multiple filters combine with **AND**; multiple filters on the same parameter allowed (range). |
| PRM-45 | Unit-aware filters (`10k` == `10000`). |
| PRM-46 | Click filter button to remove it. |

---

## 5. Templates & Variants (`/part/template/`)

| ID | Requirement |
|---|---|
| TPL-01 | Any part can be made a template via the Template toggle in part options. |
| TPL-02 | Variants reference their template part. |
| TPL-03 | Variants created via Variants tab → **New Variant** → Duplicate Part form → Submit. |
| TPL-04 | Template stock **includes stock of all variants**. |
| TPL-05 | Serial numbers must be **unique across template and all its variants**. |
| TPL-06 | Test templates cascade from template to variants (see TST-02). |
| TPL-07 | Variant pricing is included in template pricing (settings "Use Variant Pricing" True, "Active Variants Only" False). |
| TPL-08 | Subscribing to a part also covers its variants (see NTF-03). |

---

## 6. Revisions (`/part/revision/`)

| ID | Requirement |
|---|---|
| REV-01 | A revision is a separate part (own part number, stock, parameters, BOM) linked to the original. |
| REV-02 | Fields: **Revision** (free string) and **Revision Of** (reference to original part). |
| REV-03 | A part **cannot be a revision of itself**. |
| REV-04 | Revision codes must be **unique** among revisions of a given part. |
| REV-05 | A **template** part **cannot have revisions**; variant parts can. |
| REV-06 | A revision of a variant must point to the **same template** as the original. |
| REV-07 | Creating a revision does not affect data referencing the original (stock, BOs, POs). |
| REV-08 | Create via ⋮ → Duplicate Part → set Revision Of + unique Revision → Submit → redirect to new part. |
| REV-09 | **Select Part Revision** dropdown shown at top of part page **only when multiple revisions exist**. |
| REV-10 | Setting "Part Revisions" (default True) enables the revision field. |
| REV-11 | Setting "Assembly Revision Only" (default False): only assembly parts may have revisions. |
| REV-12 | Default name display format: `IPN \| name \| revision` (each part omitted when empty). |

---

## 7. Virtual parts (`/part/virtual/`)

| ID | Requirement |
|---|---|
| VRT-01 | Cannot have stock items; stock UI hidden. Otherwise behaves like a regular part. |
| VRT-02 | Can be BOM sub-components; listed in BOM and included in cost; **not allocated** in builds. |
| VRT-03 | Hidden from build order required-parts list; cost still in total build cost. |
| VRT-04 | Can be added to Sales Orders; not allocated from stock; included in order total. |
| VRT-05 | Transfer Orders tab hidden (TAB-12). |

## 8. Consumable parts (`/part/consumable/`)

| ID | Requirement |
|---|---|
| CNS-01 | Can have stock; stock managed normally. |
| CNS-02 | Can be BOM sub-components. |
| CNS-03 | **Not allocated to or consumed by** build orders; stock not adjusted on build completion (manual adjustment needed). |
| CNS-04 | Part-level Consumable flag is permanent/global; BOM-line Consumable flag is per-assembly override; BOM flag has no extra effect if part already consumable. |

## 9. Trackable parts (`/part/trackable/`)

| ID | Requirement |
|---|---|
| TRK-01 | Stock items of a trackable part should have a batch number or serial number (manual, PO, BO). |
| TRK-02 | Not strictly enforced when creating a build output. |
| TRK-03 | Serial input syntax: `1`→[1]; `1,3,5`; `1-5`→[1..5]; `~`→next SN; `4+` (n needed)→[4..]; `2+2`→[2,3,4]. |
| TRK-04 | Rules combinable via space or comma: `1 3-5 9+2` → [1,3,4,5,9,10,11]; `~+2` (next 14) → [14,15,16]; `~+` (next 14, 2 needed) → [14,15]. |
| TRK-05 | Build output for trackable part: serials optional at creation; without serials, one output with full quantity is created; can be serialised/split before completion. |
| TRK-06 | If BOM has tracked sub-components, serials **are required** for build outputs regardless of whether assembly is trackable. |

## 10. Tests (`/part/test/`)

| ID | Requirement |
|---|---|
| TST-01 | Testable parts can define test templates; stock items record results against them. |
| TST-02 | Test templates **cascade to variants**. |
| TST-03 | Test Name must be unique for a part (or across its variant set). |
| TST-04 | Test Key auto-generated on save: lowercase alphanumerics only; leading `_` if needed for valid Python identifier. Examples: "Firmware Version"→`firmwareversion`; " My NEW T E sT "→`mynewtest`; "100 Percent Test"→`_100percenttest`; "Test 123"→`test123`. |
| TST-05 | Description is display-only. |
| TST-06 | **Required**: test crucial for stock item acceptance. |
| TST-07 | **Requires Value**: result must set value. |
| TST-08 | **Requires Attachment**: result must include file attachment. |
| TST-09 | **Enabled** = False disables test while keeping history. |
| TST-10 | Deleting a test template **also deletes its results**. |
| TST-11 | Test Results tab aggregates results across stock items (distinct from Test Templates tab). |

## 11. Pricing (`/part/pricing/`)

| ID | Requirement |
|---|---|
| PRC-01 | Sources: Internal Price, Supplier Price, Purchase Cost, BOM Price, Sale Price, Sale Cost. |
| PRC-02 | Manual min/max price overrides calculated values. |
| PRC-03 | All ranges calculated in **Default Currency**; empty category shows "No data". |
| PRC-04 | Overall pricing = min/max of available data; used for BOM costing etc. |
| PRC-05 | Internal price breaks user-entered, may be blank; "Internal Prices" (default False); "Internal Price Override" (default False) makes internal pricing override others. |
| PRC-06 | Purchase history from **completed** POs (purchaseable only); sale history from **completed** SOs (salable only). |
| PRC-07 | BOM pricing for assemblies; incomplete if any BOM item lacks pricing. |
| PRC-08 | Variant pricing included for templates. |
| PRC-09 | Pricing cached; recalculated by background worker on PO receipt with price, SO sale with price, BOM create/modify. |
| PRC-10 | "Pricing Rebuild Interval" default 30 days; 0 disables periodic. "Auto Update Pricing" default on; off → manual. |
| PRC-11 | Refresh/Recalculate button on pricing overview. |
| PRC-12 | Other settings: Use Supplier Pricing (T), Purchase History Override (F), Use Stock Item Pricing (T), Stock Item Pricing Age (0 days). |

## 12. Stocktake / Stock History (`/part/stocktake/`)

| ID | Requirement |
|---|---|
| STK-01 | Entry records: date, part, # stock items, total available quantity, value range. |
| STK-02 | Value uses stock item cost if recorded, else part price range. |
| STK-03 | Stock History tab needs user setting "Enable Stock History". |
| STK-04 | "Generate Stocktake Entry" button schedules generation. |
| STK-05 | Reports (CSV) filter by Part (incl. variants), Category (incl. subcats), Location (incl. sublocations); blank = all. Dashboard widget "Generate Report". |
| STK-06 | Settings: Enable Stocktake (F), Exclude External Locations (F), Automatic Stocktake Period (7 d; 0 disables), Delete Old Stocktake Entries (F), Stocktake Deletion Interval (365 d). |

## 13. Notifications (`/part/notification/`)

| ID | Requirement |
|---|---|
| NTF-01 | Low stock notification when stock falls below minimum (subscribed users, email). |
| NTF-02 | On new Build Order, low-stock check of required parts; notifies subscribers of the part being built. |
| NTF-03 | Subscribing to a part covers its variants. |
| NTF-04 | Subscribing to a category covers sub-categories and all parts in them. |
| NTF-05 | Email requires email config + Notifications settings + valid user email. |
| NTF-06 | Notification header, flyout, inbox, history; history entries deletable singly or all. |

---

## 14. Global Parts settings (`/settings/global/`, staff only)

| Setting | Default |
|---|---|
| IPN Regex | (empty) |
| Allow Duplicate IPN | True |
| Allow Editing IPN | True |
| Allow Deletion from Assembly | False |
| Part Locking (`PART_ENABLE_LOCKING`) | True |
| Part Revisions | True |
| Assembly Revision Only | False |
| Part Name Display Format | `{{ part.IPN if part.IPN }}{{ ' \| ' if part.IPN }}{{ part.name }}{{ ' \| ' if part.revision }}{{ part.revision if part.revision }}` |
| Show related parts | True |
| Initial Stock Data | False |
| Initial Supplier Data | True |
| Template / Assembly / Component / Trackable / Purchaseable / Salable / Virtual (defaults) | F / F / T / F / T / F / F |
| Copy Part BOM Data | True |
| Allow BOM Zero Quantity | False |
| Copy Part Parameter Data | True |
| Copy Part Test Data | True |
| Copy Category Parameter Templates | True |
| Part Category Default Icon | (empty) |
| Enforce Parameter Units | True |

Overriding a global setting via config makes it read-only in the UI.

---

## 15. Gaps / ambiguities in the docs

- Exact required fields on the Create Part form are shown only in screenshots (Name is unique per VIEW-03; IPN optional).
- "Name is unique" (Views page) vs. revisions sharing a name: uniqueness scope (name+IPN+revision?) not stated.
- Revision of a revision: not addressed.
- Test template flag defaults not stated; Testable/Consumable/Active default settings not listed.
- Batch code format/uniqueness and serial uniqueness for non-variant parts not stated.
- Internal setting keys are not documented except `PART_ENABLE_LOCKING`.
- No permission matrix beyond "create" on the Part group (CRT-02) and staff for global settings.
