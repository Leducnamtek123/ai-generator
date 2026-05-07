# Test Matrix

This file maps product behavior to proof.

No product behavior has been defined or implemented yet. Do not mark a row
implemented until tests or validation evidence exist.

## Status Values

| Status | Meaning |
| --- | --- |
| planned | Accepted as intended behavior, not implemented |
| in_progress | Actively being built |
| implemented | Implemented and proof exists |
| changed | Contract changed after earlier implementation |
| retired | No longer part of the product contract |

## Matrix

| Story | Contract | Unit | Integration | E2E | Platform | Status | Evidence |
| --- | --- | --- | --- | --- | --- | --- | --- |
| [US-001](docs/stories/epics/E01-notifications/US-001-real-event-notifications-and-preferences.md) | Real event notifications and preference controls | pending | pending | pending | no | in_progress | none |
| [US-003](docs/stories/epics/E03-social-hub/US-003-social-hub-phase-1-core-interactivity.md) | Social Hub Phase 1 core interactivity and analytics contract | pending | pending | pending | no | in_progress | backend build passed; frontend typecheck blocked by unrelated parse errors |
| [US-002](docs/stories/epics/E02-admin-managed-content/US-002-admin-managed-content-migration.md) | Admin-managed content migration | pending | pending | pending | no | in_progress | none |
| [US-000](docs/stories/epics/E00-platform-hardening/US-000-production-hardening-baseline/overview.md) | Production hardening baseline for shared backend services | pending | pending | pending | no | in_progress | none |
| [US-004](docs/stories/epics/E04-creator-tools-hardening/US-004-creator-tools-production-hardening.md) | Creator tools production hardening for assistant, icon, mockup, video editor, and image generator | pending | pending | pending | no | in_progress | frontend build/typecheck passed after hardening AI Assistant, Icon Generator, Mockup Generator, Video Editor, and Image Generator; backend billing client now falls back from `billing-service` to `localhost` and live POST `/api/v1/generations/image` returns `processing` instead of 500 |
| [US-005](docs/stories/epics/E04-creator-tools-hardening/US-005-workflow-editor-node-layout-and-connection-affordances.md) | Workflow editor node layout, connection affordances, and canvas settings | pending | pending | pending | no | implemented | browser verification showed new nodes no longer stacking on one fixed point, the settings modal now changes real workflow behavior, and workflow handle wiring was restored for connect flows; utility and legacy nodes now render real connection handles, connection snapshots now mirror prompt/image/video aliases into panel state, with DOM verification for Text and Image Generator handles; rebuilt `ai-generator-web` and verified Image Generator prompt textarea remains editable in hand/pan mode on `http://localhost/creator/workflow-editor`; shared workflow node shells and toolbars were restyled so edge ports stay visible on the card border, connector affordances are tighter and easier to discover, and workflow ports now render visible type badges instead of plain dots |

## Evidence Rules

- Unit proof covers pure domain and application rules.
- Integration proof covers backend enforcement, data integrity, provider
  behavior, jobs, or service contracts.
- E2E proof covers user-visible browser flows.
- Platform proof covers only shell, deployment, mobile, desktop, or runtime
  behavior that cannot be proven in lower layers.
- A story can be implemented without every proof column if the story packet
  explains why.
