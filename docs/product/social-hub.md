# Social Hub

## Scope

The Social Hub module provides a unified workspace for social publishing,
channel connection, analytics, inbox management, and scheduling.

Facebook is the canonical learning baseline for the product. The repo should
treat Facebook Page workflows as the reference model for connection,
publishing, inbox, and reporting, then extend the same workspace model to other
channels.

Product references:

- Sprout Social: best overall product model to study for workflow structure.
- Meta Business Suite: native Facebook baseline for inbox and publishing.
- Hootsuite: useful reference for multichannel inbox, automation, and listening.
- Buffer: useful reference for simple scheduling and community workflows.
- Later: useful reference for calendar, approvals, and content operations.

The product should be understood as a pipeline, not a single composer:

`source content -> draft -> review/approval -> publish -> monitor -> reply -> analytics -> optimize`

## Phase 1 Contract

- The dashboard must read analytics from the Social Hub backend.
- The analytics date range must change the data returned by the backend.
- Audience distribution must reflect connected social channels instead of
  hardcoded platform percentages.
- Channel connection actions must use the existing Social Hub auth flow.
- Facebook connections are page-first: OAuth returns a pending page review,
  and only selected Facebook pages are saved as publish targets.
- Inbox interactions must support local filtering, selection, and reply
  composer state.

## Roadmap Shape

The Social Hub roadmap is split into product slices so each area can be built
and validated independently.

### Foundation

- Channel connection and page selection.
- Reconnect, disconnect, and token refresh flows.
- Workspace-scoped account management for multiple pages.

### Publishing

- Text, image, video, link, and multi-photo publishing.
- Draft, schedule, reschedule, duplicate, and delete actions.
- Per-platform customization and calendar-based planning.
- Approval flow before publish where the channel supports it.

### Inbox and Interaction

- Unified inbox for comments and messages.
- Reply, assign, mark handled, saved replies, and AI suggested replies.
- Customer context, notes, labels, and moderation actions where allowed.

### Monitoring and Listening

- Mention, keyword, and brand monitoring.
- Spike alerts and conversation history.
- Post-level comment thread visibility.

### Analytics and Governance

- Reach, impressions, engagement, follower growth, and exports.
- Page-level and post-level reporting.
- Role-based access, approval chains, audit logs, and response tracking.

### Content Sources and Reuse

- Media library, brand assets, templates, RSS/URL ingest, and approved content reuse.
- Import from external tools where supported by the product stack.

## Phase 2 and Beyond

- Calendar view should support month, week, and day layouts.
- Drag-and-drop scheduling should reschedule posts through the backend.
- Inbox should evolve toward a unified stream with quick actions and AI routing.
- Publish should continue to reuse the AI assistant modal for content drafting.
