# InvenTree Parts — API Requirements

Source: OpenAPI schema `https://demo.inventree.org/api/schema/?format=json` — OpenAPI 3.0.3, InvenTree API version **560** — digested 2026-10-19 with `.claude/skills/mt-api-test-cases/scripts/openapi-digest.mjs`.
Conventions from https://docs.inventree.org/en/stable/api/, https://docs.inventree.org/en/stable/api/schema/ and https://docs.inventree.org/en/stable/settings/permissions/, fetched 2026-10-19.
Paths ingested: `/api/part/`, `/api/part/{id}/` (create-option schemas added 2026-10-19). Rendered reference: https://docs.inventree.org/en/stable/api/schema/part/.
IDs (e.g. `API-PRT-01`) are assigned here for traceability; the schema does not number them. Business rules from the product docs stay in [parts.md](parts.md) and are cited alongside these IDs.

⚠ = not stated by the docs or schema. Where noted, the behaviour was observed on the demo server (API 560) by the automated specs in `tests/api-tests/`.

---

## 1. Conventions

| ID | Requirement |
|---|---|
| API-CONV-01 | Token authentication: header `Authorization: Token <TOKEN-VALUE>` ("Token-based authentication with required prefix "Token""). Basic (`username:password`) and OAuth2 are also accepted. |
| API-CONV-02 | A token is issued by `GET /api/user/me/token/` with Basic credentials and an optional `name`; it is shown only once. Requesting a token with the same name re-issues it and invalidates previous ones of that name. Tokens are persistent until invalidated. |
| API-CONV-03 | An action outside the user's role(s) is refused with **403** and a permission error message. ⚠ body observed: `{"detail": "You do not have permission to perform this action."}` |
| API-CONV-04 | ⚠ A request without credentials is refused with **401** (not stated by the docs; observed: `{"detail": "Authentication credentials were not provided."}`). |
| API-CONV-05 | ⚠ A validation error returns **400** with a body keyed by field name, each holding a list of messages, e.g. `{"name": ["This field is required."]}`; object-level errors use `non_field_errors` (not stated by the docs; observed). |
| API-CONV-06 | ⚠ An unknown object `pk` on a detail endpoint returns **404** (not stated by the docs; observed: `{"detail": "No Part matches the given query."}`). |
| API-CONV-07 | List endpoints paginate with `limit` ("Number of results to return per page.") and `offset` ("The initial index from which to return the results."); the response holds `count` and `results` (required) and nullable `next` / `previous` URLs. |
| API-CONV-08 | Permissions: users get roles through groups; each role (e.g. *Parts*) has *view*, *add*, *change*, *delete* actions. OAuth2 scopes name them `r:<action>:<role>` (e.g. `r:change:part`). A superuser has all permissions. |

## 2. GET POST PUT PATCH /api/part/

| ID | Requirement |
|---|---|
| API-PRT-01 | `GET /api/part/` (`part_list`) lists parts — **200**, paginated `Part` objects. Scope `r:view:part` (or `r:view:build`). |
| API-PRT-02 | `POST /api/part/` (`part_create`) creates a part — **201**, returns the `Part`. Scope `r:add:part` (or `r:add:build`). |
| API-PRT-03 | ⚠ `PUT /api/part/` (`part_bulk_update`) — **200**; "Perform a PUT operation against this list endpoint." Scope `r:change:part`. The request format for selecting which parts to update is not documented. |
| API-PRT-04 | ⚠ `PATCH /api/part/` (`part_bulk_partial_update`) — **200**; "a custom implementation" of PATCH on the list endpoint. Scope `r:change:part`. The request format is not documented. |
| API-PRT-05 | `name` — the only field required in a create/PUT request; string, maxLength **100**. |
| API-PRT-06 | `description` — optional string, maxLength **250**. |
| API-PRT-07 | `IPN` — optional string, maxLength **100**, default `""`. |
| API-PRT-08 | `keywords` — optional string, maxLength **250**, nullable. |
| API-PRT-09 | `units` — optional string, maxLength **20**, nullable ("Units of measure for this part"). |
| API-PRT-10 | `revision` — optional string, maxLength **100**, nullable, default `""`. |
| API-PRT-11 | `link` — nullable; either a URI (maxLength **2000**) or the empty string. |
| API-PRT-12 | `default_expiry` — integer, minimum **0**, maximum **2147483647** (days). |
| API-PRT-13 | `minimum_stock`, `maximum_stock` — number, default **0**. ⚠ Negative values are rejected (no minimum in the schema; observed: "Ensure this value is greater than or equal to 0."). |
| API-PRT-14 | Reference fields `category`, `default_location`, `variant_of`, `revision_of`, `responsible`, `creation_user` — nullable integer `pk`s. ⚠ A `pk` that does not exist is rejected (observed: `Invalid pk "<pk>" - object does not exist.`). |
| API-PRT-15 | Boolean flags `active`, `assembly`, `component`, `consumable`, `is_template`, `locked`, `purchaseable`, `salable`, `testable`, `trackable`, `virtual` are writable. |
| API-PRT-16 | Write-only create options: `duplicate`, `initial_stock`, `initial_supplier` (objects), `existing_image` (filename), `copy_category_parameters` (boolean, default **true**). |
| API-PRT-17 | Read-only fields are ignored on write: `pk`, `full_name`, `barcode_hash`, `category_name`, `category_path`, `creation_date`, `revision_count`, `starred`, `thumbnail`, `pricing_min`, `pricing_max`, `pricing_updated`, `in_stock`, `total_in_stock`, `unallocated_stock`, `variant_stock`, `stock_item_count`, `external_stock`, `ordering`, `building`, `scheduled_to_build`, allocation / requirement counts, `category_default_location`. |
| API-PRT-18 | List pagination per API-CONV-07 (`limit`, `offset`). |
| API-PRT-19 | `ordering` accepts `id`, `name`, `creation_date`, `IPN`, `ordering`, `in_stock`, `total_in_stock`, `unallocated_stock`, `category`, `default_location`, `units`, `pricing_min`, `pricing_max`, `pricing_updated`, `revision`, `revision_count`, each optionally prefixed `-` for descending. |
| API-PRT-20 | `search` matches `IPN`, category name, `description`, `keywords`, manufacturer part MPN, `name`, `revision`, supplier part SKU, tag name and tag slug. |
| API-PRT-21 | List filters (50 in total). Key ones: `category` (with `cascade` to include sub-categories), `active`, `IPN`, `IPN_regex`, `name_regex`, `is_template`, `is_variant`, `variant_of`, `assembly`, `component`, `purchaseable`, `salable`, `trackable`, `virtual`, `locked`, `has_stock`, `low_stock`, `created_after` / `created_before` (date). |
| API-PRT-22 | Detail toggles on list and detail endpoints: `category_detail`, `location_detail`, `path_detail`, `parameters`, `price_breaks`, `tags` (boolean, default false) add nested data to each part. |

## 3. GET PUT PATCH DELETE /api/part/{id}/

| ID | Requirement |
|---|---|
| API-PRT-23 | `GET /api/part/{id}/` (`part_retrieve`) returns one `Part` — **200**. Scope `r:view:part`. |
| API-PRT-24 | `PUT /api/part/{id}/` (`part_update`) replaces the writable fields — **200**; the request requires `name` (API-PRT-05). Scope `r:change:part`. |
| API-PRT-25 | `PATCH /api/part/{id}/` (`part_partial_update`) updates only the fields sent — **200**; no field is required. Scope `r:change:part`. |
| API-PRT-26 | `DELETE /api/part/{id}/` (`part_destroy`) deletes the part — **204**. Scope `r:delete:part`. ⚠ An active part cannot be deleted (observed: 400 `non_field_errors` "Cannot delete this part as it is still active"; the docs only recommend deactivating, ACT-02). |
| API-PRT-27 | `locked` — "Locked parts cannot be edited" (schema field description). See LOCK-01..05 for the documented locking rules. |
| API-PRT-28 | ⚠ `tags` (array of strings) is listed only on the PATCH request schema (`PatchedPart`), not on create/PUT. |

## 4. Create options on POST /api/part/

Write-only objects from API-PRT-16, digested from the `InitialSupplier`, `InitialStock` and `PartDuplicateOptions` schemas (API 560).

| ID | Requirement |
|---|---|
| API-PRT-29 | `initial_supplier` — `supplier` (company `pk`, nullable, "leave blank to skip"), `sku` (string, maxLength **100**), `manufacturer` (company `pk`, nullable), `mpn` (string, maxLength **100**). Creates the supplier part and manufacturer part for the new part (CRT-06). |
| API-PRT-30 | `initial_stock` — `quantity` (**required**; "If quantity is zero, no stock is added"), `location` (location `pk`, nullable). Applies when the "Initial Stock Data" setting is enabled (CRT-05, default False). |
| API-PRT-31 | `duplicate` — `original` (part `pk`, **required**) plus booleans `copy_image`, `copy_bom`, `copy_notes`, `copy_tests`, `copy_parameters`. Creates the new part as a copy of `original` (DUP-01..05). |
