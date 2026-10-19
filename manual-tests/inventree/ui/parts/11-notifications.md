# InvenTree Parts — Notifications (UI)

Requirements: [requirements/parts.md](../../requirements/parts.md) · Test data: [test-data/parts-environment.md](../../test-data/parts-environment.md) · Legend: [README](../../../README.md#legend)

## 11. Notifications (part-related)

| ID | Title | Pre-conditions | Steps | Expected Result | Pri | Type | Req |
|---|---|---|---|---|---|---|---|
| TC-NTF-001 | Subscribe to part | — | 1. Click subscribe icon on M3 Screw | Icon state changes; subscription persists after reload | P3 | F | NTF-03 |
| TC-NTF-002 | Low stock notification | Subscribed; min 100 | 1. Reduce stock below 100 | Notification in header/inbox (and email if configured) | P2 | F | NTF-01 |
| TC-NTF-003 | Template subscription covers variants | Subscribed to Widget | 1. Drop Widget-Red below its min | Notification received | P3 | F | NTF-03 |
| TC-NTF-004 | Build order low-stock check | Subscribed to Controller Board; component low | 1. Create build order for Controller Board | Notification about low-stock components | P3 | F | NTF-02 |
| TC-NTF-005 | Header shows a new notification in the flyout | TC-NTF-002 state; logged in as `engineer` | 1. Look at the notification icon in the header<br>2. Open the notification flyout | Icon shows an unread indicator; flyout lists the low-stock notification for `M3 Screw` | P2 | F | NTF-06 |
| TC-NTF-006 | Notification inbox lists unread notifications | TC-NTF-005 state | 1. Open the notification inbox from the flyout | Inbox lists the `M3 Screw` low-stock notification as unread | P2 | F | NTF-06 |
| TC-NTF-007 | ⚠ Marking a notification read moves it to history | TC-NTF-006 state | 1. Mark the notification as read in the inbox<br>2. Open the notification history | Notification is no longer in the inbox; it appears in history; header unread indicator clears | P3 | F | NTF-06 |
| TC-NTF-008 | Delete a single history entry | TC-NTF-007 state; at least 2 entries in history | 1. Open the notification history<br>2. Delete one entry | Only that entry is removed; other entries remain after reload | P3 | F | NTF-06 |
| TC-NTF-009 | Delete all history entries | At least 2 entries in history | 1. Open the notification history<br>2. Delete all entries | History is empty after reload | P3 | F | NTF-06 |
| TC-NTF-010 | No notification when stock falls to exactly the minimum | `engineer` subscribed to `M3 Screw`; notification start state (test data) | 1. Reduce `M3 Screw` stock from 150 to exactly 100 | No low-stock notification is created; header shows no new notification | P2 | B | NTF-01 |
| TC-NTF-011 | Notification when stock falls one below the minimum | TC-NTF-010 state | 1. Reduce `M3 Screw` stock from 100 to 99 | Low-stock notification for `M3 Screw` appears for `engineer` | P2 | B | NTF-01 |
| TC-NTF-012 | Users not subscribed get no low-stock notification | `engineer` subscribed to `M3 Screw`; `viewer` not subscribed; notification start state | 1. Reduce `M3 Screw` stock below 100<br>2. Log in as `viewer` and open the notification flyout | `engineer` is notified; `viewer` has no notification for `M3 Screw` | P2 | N | NTF-01 |
| TC-NTF-013 | ⚠ Unsubscribing stops notifications | TC-NTF-001 state | 1. Click the subscribe icon on `M3 Screw` again<br>2. Reload<br>3. Reduce stock below 100 | Icon shows unsubscribed after reload; no low-stock notification is created | P2 | F | NTF-03, NTF-01 |
| TC-NTF-014 | ⚠ Subscribing to a variant does not cover its sibling variants | `engineer` subscribed only to `Widget-Red` | 1. Drop `Widget-Blue` stock below its minimum | No notification for `Widget-Blue` | P3 | N | NTF-03 |
| TC-NTF-015 | Category subscription does not cover other categories | `engineer` subscribed only to `Electronics` | 1. Drop `M3 Screw` (in `Fasteners`, under `Mechanical`) below its minimum | No notification for `M3 Screw` | P3 | N | NTF-04 |
| TC-NTF-016 | Build order with enough component stock sends no low-stock notification | Subscribed to `Controller Board`; all its components above their minimum | 1. Create a build order for `Controller Board` | No low-stock notification is created | P3 | N | NTF-02 |
| TC-NTF-017 | Low-stock email is sent when email is fully configured | Email server configured by `admin`; email notifications enabled; `engineer` email set (test data); subscribed to `M3 Screw`; notification start state | 1. Reduce `M3 Screw` stock below 100<br>2. Check the `engineer` mailbox | An email about low stock on `M3 Screw` is received, as well as the in-app notification | P2 | F | NTF-05, NTF-01 |
| TC-NTF-018 | No email for a user without an email address | As TC-NTF-017, but `viewer` (no email) is the subscriber | 1. Reduce `M3 Screw` stock below 100 | `viewer` gets the in-app notification; no email is sent | P3 | N | NTF-05 |
| TC-NTF-019 | ⚠ No email when email notifications are turned off in settings | As TC-NTF-017, with the user's email notification setting disabled | 1. Reduce `M3 Screw` stock below 100 | In-app notification appears; no email is received | P3 | N | NTF-05 |
| TC-NTF-020 | No email when no email server is configured | No email server configured; otherwise as TC-NTF-017 | 1. Reduce `M3 Screw` stock below 100 | In-app notification appears; no email is sent | P3 | N | NTF-05 |
