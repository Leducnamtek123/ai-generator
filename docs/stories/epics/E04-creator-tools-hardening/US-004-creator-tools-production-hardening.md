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
- `design-editor` now has working text style toggles, canvas zoom, undo/redo, local draft restore, and save/export behavior.
- `clip-editor` now starts from a truthful empty timeline, restores only explicit drafts or optional sample data instead of showing mock clips by default, and wires playback, seek, duplicate, per-clip trim, clip move, and backend project save actions.
- `video-editor` now has working seek controls and playback progress rather than static play/pause chrome, alongside backend project load/save, project export, and undo/redo.
- `ai-assistant` now wires attachment upload, template jump actions, and backend project persistence instead of leaving composer shortcuts inert.
- `icon-generator` now exposes backend project persistence, save/export, and per-result download/copy behaviors.
- `voice-generator` now supports text-to-speech preview and export for history items.
- `music-generator`, `voice-generator`, `sfx-generator`, `variations`, `mockup-generator`, `image-generator`, `video-generator`, `image-editor`, `image-upscaler`, `video-upscaler`, `camera-change`, `skin-enhancer`, `lip-sync`, `sketch-to-image`, and `workflow-editor` now have explicit save/export or download behaviors, plus error-safe submit flow and reset actions where applicable; `music-generator` now also plays rendered audio previews from generation results and downloads the rendered audio blob when available, `sfx-generator` now mirrors that behavior for generated sound effects, and `voice-generator` now prefers rendered audio previews/downloads when available while keeping speech synthesis as a fallback; `icon-generator`, `music-generator`, `voice-generator`, `sfx-generator`, `image-generator`, `video-generator`, and `image-editor` now also persist project content to backend storage instead of relying only on local draft storage, while `variations`, `mockup-generator`, `image-upscaler`, `video-upscaler`, `camera-change`, `skin-enhancer`, `lip-sync`, `sketch-to-image`, and `workflow-editor` continue to persist project content or workflow snapshots to backend storage instead of relying only on local draft storage.
- `bg-remover` and `image-extender` now persist project content to backend projects instead of relying only on local draft storage, while still exposing save/export/reset behavior.
