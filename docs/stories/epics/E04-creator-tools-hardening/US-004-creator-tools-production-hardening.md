# US-004 Creator Tools Production Hardening

## Status

in_progress

## Lane

normal

## Product Contract

The creator tools surface should behave like a real customer-facing product,
not a demo shell. Core tools must use real generation endpoints, show loading
and error states, avoid hardcoded result payloads, and guide users through
production-safe flows such as empty states, retry paths, and truthful
first-load behavior.

## Relevant Product Docs

- `docs/product/README.md`

## Acceptance Criteria

- AI Assistant routes quick actions to the correct generation endpoints and
  reports success or failure in the conversation.
- Icon Generator uses the live generation pipeline instead of hardcoded result
  URLs.
- Mockup Generator renders real generation output and shows backend failures.
- Video Editor starts from a truthful empty timeline and handles media loading
  errors with retry.
- Image Editor, Design Editor, and Clip Editor expose real toolbar actions
  instead of dead buttons, including undo/redo, zoom, style toggles, drag,
  resize, alignment guides, seek, duplicate, save, and export behaviors.
- Image Generator replaces placeholder tutorial copy with actionable guidance
  and keeps typed contract clean.

## Design Notes

- API surfaces:
  - `frontend/src/stores/generation-store.ts`
  - `frontend/src/lib/api/generations.ts`
  - `frontend/src/services/mediaApi.ts`
- UI surfaces:
  - `frontend/src/app/[locale]/(dashboard)/creator/ai-assistant/page.tsx`
  - `frontend/src/app/[locale]/(dashboard)/creator/icon-generator/page.tsx`
  - `frontend/src/app/[locale]/(dashboard)/creator/mockup-generator/page.tsx`
  - `frontend/src/app/[locale]/(dashboard)/creator/video-editor/page.tsx`
  - `frontend/src/app/[locale]/(dashboard)/creator/image-generator/page.tsx`
- Domain rules:
  - Generation state must come from the store or backend, not hardcoded mock
    arrays.
  - Quick actions must map to the correct endpoint for the requested task.
  - Empty states are valid product states and should be explicit.
  - Error states must be visible and actionable.

## Validation

| Layer | Expected proof |
| --- | --- |
| Unit | Generation action mapping and assistant message construction behave correctly. |
| Integration | Live generation endpoints populate `currentGeneration` and clear error states. |
| E2E | Creator tools render loading, error, and result states without demo payloads. |
| Platform | `frontend` build and typecheck remain green. |
| Release | Browser verification of the modified tool routes. |

## Harness Delta

- Added a creator tools hardening story packet.
- Added a test matrix row to track the creator tools contract.
- Replaced mock/demo behavior in the highest-impact creator tools with real or truthful state handling.

## Evidence

- `frontend` `npm run typecheck` passed.
- `frontend` `npm run build` passed.
- Browser verification succeeded on `http://localhost:3010/creator/image-generator`, `http://localhost:3010/creator/icon-generator`, `http://localhost:3010/creator/video-generator`, `http://localhost:3010/creator/mockup-generator`, `http://localhost:3010/creator/video-editor`, `http://localhost:3010/creator/ai-assistant`, `http://localhost:3010/creator/image-editor`, `http://localhost:3010/creator/design-editor`, `http://localhost:3010/creator/clip-editor`, `http://localhost:3010/creator/music-generator`, `http://localhost:3010/creator/voice-generator`, `http://localhost:3010/creator/sfx-generator`, `http://localhost:3010/creator/variations`, `http://localhost:3010/creator/image-extender`, `http://localhost:3010/creator/image-upscaler`, `http://localhost:3010/creator/video-upscaler`, `http://localhost:3010/creator/camera-change`, `http://localhost:3010/creator/skin-enhancer`, `http://localhost:3010/creator/lip-sync`, and `http://localhost:3010/creator/sketch-to-image`.
- The hardened creator pages now render live provider selection, reset actions, local save/export affordances, and honest failure handling where backend persistence is not yet present; async AI paths no longer leave the local UI stuck on failures.
- `image-editor` now has real undo/redo, rotate, flip, zoom, backend project save, and export behavior instead of inert toolbar buttons.
- `image-editor` now also surfaces concrete AI edit recipes and clearer empty/progress copy, so the first action in the editor is an explicit task instead of a generic upload prompt.
- `design-editor` now has working text style toggles, canvas zoom, undo/redo, local draft restore, and save/export behavior.
- `design-editor` now also surfaces starter prompts and clearer AI copy, so design generation starts from concrete briefs instead of a vague textarea placeholder.
- `clip-editor` now starts from a truthful empty timeline, restores only explicit drafts or optional sample data instead of showing mock clips by default, and wires playback, seek, duplicate, per-clip trim, clip move, and backend project save actions.
- `clip-editor` now also surfaces timeline starter presets and clearer empty-state guidance, so the first edit can begin from a concrete sequence instead of a bare upload prompt.
- `video-editor` now has working seek controls and playback progress rather than static play/pause chrome, alongside backend project load/save, project export, and undo/redo.
- `video-editor` now also surfaces starter timeline presets and clearer empty-state copy, so users can begin from a concrete edit structure instead of a blank video canvas.
- `ai-assistant` now wires attachment upload, template jump actions, and backend project persistence instead of leaving composer shortcuts inert.
- `icon-generator` now exposes backend project persistence, save/export, and per-result download/copy behaviors.
- `voice-generator` now supports text-to-speech preview and export for history items.
- `image-generator` now replaces vague tutorial copy with clickable prompt recipes, clearer prompt/negative-prompt guidance, and aspect-ratio-aware starting points for more production-like prompt creation.
- `image-generator` now also carries quality and model hints in its prompt recipes, so the first click lands on a more complete generation setup instead of only filling text fields.
- `image-generator` now also gives empty Personal and Community states a direct path into prompt recipes, so users can jump from browsing to creating without hunting for the tutorial tab or getting stuck on a dead-end search.
- `image-generator` now also gives empty Templates and Featured states a direct path into prompt recipes, so every browse surface can hand the user back to a concrete starting point.
- `image-generator` now opens a shared live template browser modal from the Browse templates button, keeping the browse experience in one place while pulling template data from the real `/api/v1/templates` feed.
- `image-generator` now also lets users reuse a previous generation prompt directly from Personal history and jump into the recipe workspace, making the history surface an actual restart path.
- `image-generator` now focuses the prompt composer after recipe/template/history selection, so the handoff from browse surfaces back to creation is immediate instead of leaving the caret behind.
- `image-generator` now also scrolls the prompt composer into view after those selections, so the focused field is visible on smaller or scrolled layouts.
- `image-generator` now validates the seed field before generation and gives the user a clear path to clear it, avoiding accidental NaN requests.
- `image-generator` now accepts the seed as an editable numeric text field, which keeps the value flexible while still rejecting invalid input before generation.
- `image-generator` now validates reference image URLs before generation and surfaces preview-load failures inline instead of silently accepting broken links.
- `image-generator` now shows a fallback preview card when a reference image link fails to load, so broken assets do not leave a blank hole in the editor.
- `image-generator` now opens the shared template browser modal from Browse templates, so template discovery starts in a dedicated overlay instead of an empty tab switch.
- `image-generator` now shows an explicit upload-in-progress state for reference images, so users can see that the file is being processed instead of clicking the button repeatedly.
- `image-generator` now also shows an inline upload failure message for reference images, separating upload failures from preview/load failures.
- `image-generator` now exposes upload progress for reference images with a progress bar and percentage label, making long uploads feel intentional instead of frozen.
- `video-generator` now replaces tutorial-style sample cards with clickable prompt recipes, clearer prompt-mode/duration/aspect-ratio guidance, and more actionable quick references.
- `icon-generator` now surfaces clickable prompt recipes and clearer prompt guidance so common icon generation tasks start from production-like inputs instead of a single vague example.
- `ai-assistant` now surfaces clickable starter prompts and clearer composer placeholders so users can request concrete briefs, edits, and prompt drafting instead of beginning from generic message text.
- `mockup-generator` now surfaces clickable starter setups and clearer empty-state guidance, so users can begin from a concrete device-and-scene combination instead of a generic upload prompt.
- `music-generator`, `voice-generator`, `sfx-generator`, `variations`, `mockup-generator`, `image-generator`, `video-generator`, `image-editor`, `image-upscaler`, `video-upscaler`, `camera-change`, `skin-enhancer`, `lip-sync`, `sketch-to-image`, and `workflow-editor` now have explicit save/export or download behaviors, plus error-safe submit flow and reset actions where applicable; `music-generator` now also plays rendered audio previews from generation results and downloads the rendered audio blob when available, `sfx-generator` now mirrors that behavior for generated sound effects, and `voice-generator` now prefers rendered audio previews/downloads when available while keeping speech synthesis as a fallback; `icon-generator`, `music-generator`, `voice-generator`, `sfx-generator`, `image-generator`, `video-generator`, and `image-editor` now also persist project content to backend storage instead of relying only on local draft storage, while `variations`, `mockup-generator`, `image-upscaler`, `video-upscaler`, `camera-change`, `skin-enhancer`, `lip-sync`, `sketch-to-image`, and `workflow-editor` continue to persist project content or workflow snapshots to backend storage instead of relying only on local draft storage.
- `bg-remover` and `image-extender` now persist project content to backend projects instead of relying only on local draft storage, while still exposing save/export/reset behavior.
