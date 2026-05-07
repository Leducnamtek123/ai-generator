# Notifications

## Purpose

Notifications unify product activity, billing, workflow, social, and moderation
events into a single user-facing inbox and a preference surface for channel
control.

## Contract

- Payment events create notifications for successful and failed checkout flows.
- Workflow events create notifications when generation-backed workflow steps
  complete or fail.
- Social events create notifications when a social account connects or
  disconnects.
- Moderation events create notifications when admin review actions update or
  remove templates.
- Notification inbox items carry a category so the UI can group and label them
  by source.
- Users can view and update notification preferences per category for email,
  in-app, and admin alert channels.

## Product Surfaces

- `frontend/src/app/[locale]/(dashboard)/notifications/page.tsx`
- `frontend/src/app/[locale]/(dashboard)/settings/page.tsx`
- `backend/src/notifications/*`

## Data Model

- `notification` stores user inbox items.
- `notification_preference` stores per-user channel toggles by category.

## Notes

- Email delivery is modeled through the same notification dispatch path that
  creates in-app items.
- Admin alert preferences are stored per category so moderation-facing routing
  can be expanded without changing the client contract.

