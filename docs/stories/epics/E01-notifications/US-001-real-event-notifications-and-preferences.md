# US-001 Real Event Notifications and Preferences

## Status

in_progress

## Lane

normal

## Product Contract

Notifications should come from real product events instead of placeholders.
Payment, workflow, social, and moderation actions must create user-facing
notification records, and users must be able to enable or disable email,
in-app, and admin alert channels per notification category.

## Relevant Product Docs

- `docs/product/notifications.md`

## Acceptance Criteria

- Payment success and failure create notifications for the affected user.
- Workflow completion and failure create notifications for the affected user.
- Social connect and disconnect create notifications for the affected user.
- Moderation actions create notifications for affected template authors.
- Settings UI loads saved preferences and lets the user update channel toggles
  per category.
- Notification inbox items expose their category so the UI can label them.

## Design Notes

- Commands:
  - `GET /v1/notifications`
  - `GET /v1/notifications/preferences`
  - `PATCH /v1/notifications/preferences`
- Queries:
  - `GET /v1/notifications/unread-count`
- API:
  - `frontend/src/services/notificationApi.ts`
- Tables:
  - `notification`
  - `notification_preference`
- Domain rules:
  - In-app notifications are only created when the stored preference enables
    that channel.
  - Email notifications reuse the same dispatch path and are gated by the saved
    preference.
  - Admin alert toggles are persisted per category so moderation routing stays
    configurable.
- UI surfaces:
  - `frontend/src/app/[locale]/(dashboard)/settings/page.tsx`
  - `frontend/src/app/[locale]/(dashboard)/notifications/page.tsx`

## Validation

| Layer | Expected proof |
| --- | --- |
| Unit | Notification dispatch and preference normalization behave correctly. |
| Integration | Backend endpoints persist preferences and create notifications from real domain events. |
| E2E | Settings page saves toggles and inbox reflects category-labeled events. |
| Platform | N/A |
| Release | Build and typecheck on both apps. |

## Harness Delta

- Added a notifications product doc.
- Added a story packet for real event notification wiring and preference UI.
- Updated the test matrix to track the new notification contract.

## Evidence

- Pending validation.

