# Product Docs

This folder contains the current product contract, split by domain instead of
keeping one large spec as the living source of truth.

## Current Contract Surfaces

- [platform-hardening.md](platform-hardening.md): shared backend baseline,
  request IDs, queue observability, and security/ops rules.
- [social-hub.md](social-hub.md): social publishing, inbox, analytics, and
  Facebook-first channel workflows.
- [notifications.md](notifications.md): inbox notifications and preference
  controls across product event sources.
- [community-marketplace.md](community-marketplace.md): browse, publish, and
  purchase flows for reusable templates.

## How To Add New Product Docs

When a new domain becomes real, add a focused contract file here with:

- scope
- current behavior
- target behavior
- affected users
- affected surfaces
- non-goals

Do not create domain files just to fill the folder. Use actual product truth,
not placeholders.

## Update Rule

When behavior changes:

1. Update the affected product doc.
2. Update or create the story packet.
3. Update [docs/TEST_MATRIX.md](../TEST_MATRIX.md).
4. Record a decision if the change affects architecture, scope, risk, or a
   previously settled product rule.
