# Stories

Stories are work packets. They turn product intent into bounded implementation
and validation work.

This repo already has selected story packets in the epics folders below.

## Active Epics

- `docs/stories/epics/E00-platform-hardening/`
- `docs/stories/epics/E01-notifications/`
- `docs/stories/epics/E02-admin-managed-content/`
- `docs/stories/epics/E03-social-hub/`
- `docs/stories/epics/E04-creator-tools-hardening/`
- `docs/stories/epics/E05-community-marketplace/`

## Normal Story

Use `docs/templates/story.md` for normal feature work.

Suggested path:

```text
docs/stories/epics/E01-domain-name/US-001-short-story-title.md
```

## High-Risk Story

Use `docs/templates/high-risk-story/` when the feature intake classifies work as
high-risk.

Suggested path:

```text
docs/stories/epics/E02-risky-domain/US-012-risky-story-title/
  execplan.md
  overview.md
  design.md
  validation.md
```

## Status Flow

```text
planned -> in_progress -> implemented
                  |
                  v
               changed
                  |
                  v
               retired
```
