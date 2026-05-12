# Documentation Map

This directory is the working map for the repo. It contains the Harness rules,
product contracts, story packets, decisions, and validation proof that keep the
implementation aligned.

## Start Here

1. [HARNESS.md](HARNESS.md) - how humans and agents collaborate.
2. [FEATURE_INTAKE.md](FEATURE_INTAKE.md) - how a prompt becomes tiny, normal,
   or high-risk work.
3. [TEST_MATRIX.md](TEST_MATRIX.md) - what is implemented and what proof exists.
4. [product/README.md](product/README.md) - current product contract surfaces.
5. [stories/README.md](stories/README.md) - how to write and organize work
   packets.
6. [decisions/README.md](decisions/README.md) - how durable decisions are
   recorded.

## Core Files

- `HARNESS.md`: repo operating model.
- `FEATURE_INTAKE.md`: intake gate and risk lanes.
- `ARCHITECTURE.md`: architecture discovery and boundary rules.
- `TEST_MATRIX.md`: behavior-to-proof map.
- `HARNESS_BACKLOG.md`: harness improvements and recurring friction.
- `GLOSSARY.md`: shared terms.
- `codex-workflow.md`: Codex-specific workflow notes.

## Folders

- `product/`: current product contract docs.
- `stories/`: story packets, initiative notes, and backlog.
- `decisions/`: durable architecture and product decisions.
- `templates/`: reusable story, decision, validation, and intake templates.

## How To Use These Docs

- When a new request arrives, classify it with `FEATURE_INTAKE.md` first.
- When behavior changes, update the product doc, then the story packet, then
  `TEST_MATRIX.md`.
- When a decision changes architecture or policy, add or update a decision
  record.
- When the docs themselves feel incomplete, add the missing rule or template
  instead of leaving the gap implicit.
