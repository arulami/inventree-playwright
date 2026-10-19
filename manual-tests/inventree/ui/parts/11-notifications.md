# InvenTree Parts — Notifications (UI)

Requirements: [requirements/parts.md](../../requirements/parts.md) · Test data: [test-data/parts-environment.md](../../test-data/parts-environment.md) · Legend: [README](../../../README.md#legend)

## 11. Notifications (part-related)

| ID | Title | Pre-conditions | Steps | Expected Result | Pri | Type | Req |
|---|---|---|---|---|---|---|---|
| TC-NTF-001 | Subscribe to part | — | 1. Click subscribe icon on M3 Screw | Icon state changes; subscription persists after reload | P3 | F | NTF-03 |
| TC-NTF-002 | Low stock notification | Subscribed; min 100 | 1. Reduce stock below 100 | Notification in header/inbox (and email if configured) | P2 | F | NTF-01 |
| TC-NTF-003 | Template subscription covers variants | Subscribed to Widget | 1. Drop Widget-Red below its min | Notification received | P3 | F | NTF-03 |
| TC-NTF-004 | Build order low-stock check | Subscribed to Controller Board; component low | 1. Create build order for Controller Board | Notification about low-stock components | P3 | F | NTF-02 |
