# InvenTree Parts — <Area> (API)

Requirements: [requirements/parts.md](../../requirements/parts.md) · Test data: [test-data/parts-environment.md](../../test-data/parts-environment.md) · Legend: [README](../../../README.md#legend)

<!-- Copy this file to NN-<area>.md (e.g. 01-parts-crud.md), replace <Area>, delete the example row, and add cases. -->

## 1. <Section>

| ID | Title | Pre-conditions | Method | Endpoint | Auth | Request | Expected status | Expected response | Pri | Type | Req |
|---|---|---|---|---|---|---|---|---|---|---|---|
| TC-API-PRT-001 *(example)* | Create part with required fields | Token for `engineer` | POST | `/api/part/` | Token | `{ "name": "Test Part A", "description": "…", "category": <Resistors id> }` | 201 | Body has `pk`; `name`, `description`, `category` echo the request; `active` = true | P1 | F | CRT-10, ACT-01 |
