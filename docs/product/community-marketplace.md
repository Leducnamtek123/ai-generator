# Community Marketplace

## Scope

The Community Marketplace lets creators browse, publish, and purchase reusable
templates using credits. It should feel like a production marketplace, not a
demo feed.

## Contract

- Buyers can browse live listings by search text and template type.
- Each listing must clearly expose the title, type, creator, price, tags, and
  a meaningful preview image or prompt snippet.
- Creators can publish a template with a title, description, prompt body, type,
  cover image URL, tags, price, and publish state.
- Listings must keep the canonical template type slugs from `TemplateTypeEnum`.
- Empty or missing thumbnails must degrade to a deliberate preview state, not a
  broken card.
- Publishing should be possible from scratch or from an existing template
  payload already stored in the marketplace system.

## Product Rules

- Title and prompt are required for publication.
- Price must be at least 1 credit.
- Tags should be short, searchable, and capped to a small number of items.
- The form should explain what each field does in plain language.
- The browse grid should never rely on placeholder demo data once listings are
  available.
