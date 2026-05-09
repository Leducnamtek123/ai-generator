# Creator Tools QA Checklist

Status legend:

- `Full work` = live UI flow works, errors are surfaced, and the tool is usable as-is.
- `Local-only persistence` = the tool works, but save/export is still client-side JSON or local draft storage.
- `Needs backend persistence` = the surface is usable, but the product still needs a real backend save/render pipeline to feel complete.

## Generation Tools

| Route | Status | What works | Remaining gap |
| --- | --- | --- | --- |
| `/creator/image-generator` | Full work | Live providers, prompt, model, search, history, templates, upload, backend project persistence, reset | No major gap in the current contract |
| `/creator/icon-generator` | Full work | Live provider selection, backend project persistence, save/export, per-result download/copy | No major gap in the current contract |
| `/creator/video-generator` | Full work | Live generation, start/end image upload, backend project persistence, save/export, error-safe submit | No major gap in the current contract |
| `/creator/ai-assistant` | Full work | Attachments, template jump, provider selection, backend project persistence, image download/copy, reset conversation | No major gap in the current contract |
| `/creator/mockup-generator` | Full work | Generate, reset, backend project persistence, save/export, per-result download | No major gap in the current contract |
| `/creator/variations` | Full work | Generate, reset, backend project persistence, save/export, per-result download/copy | No major gap in the current contract |
| `/creator/music-generator` | Full work | Generate, reset, backend project persistence, rendered audio preview/download when available, per-track save/download | No major gap in the current contract |
| `/creator/voice-generator` | Full work | Generate, reset, rendered audio preview/download when available, backend project persistence, history download/export | Speech synthesis remains the fallback when no audio render exists |
| `/creator/sfx-generator` | Full work | Generate, reset, backend project persistence, rendered audio preview/download when available, error-safe submit | No major gap in the current contract |
| `/creator/bg-remover` | Full work | Upload, remove background, backend project persistence, save/export, reset | No major gap in the current contract |
| `/creator/image-extender` | Full work | Upload, extend, backend project persistence, save/export, reset | No major gap in the current contract |
| `/creator/image-upscaler` | Full work | Upload, upscale, backend project persistence, reuse menu, save/export, reset | No major gap in the current contract |
| `/creator/video-upscaler` | Full work | Upload, upscale, backend project persistence, save/export, reset, error handling | No major gap in the current contract |
| `/creator/camera-change` | Full work | Upload, change camera, backend project persistence, save/export, reset | No major gap in the current contract |
| `/creator/skin-enhancer` | Full work | Upload, enhance skin, backend project persistence, save/export, reset | No major gap in the current contract |
| `/creator/lip-sync` | Full work | Upload video/audio, sync, backend project persistence, download history outputs, reset | No major gap in the current contract |
| `/creator/sketch-to-image` | Full work | Canvas draw, generate, backend project persistence, save/export, reset | No major gap in the current contract |

## Editor Surfaces

| Route | Status | What works | Remaining gap |
| --- | --- | --- | --- |
| `/creator/image-editor` | Full work | Undo/redo, rotate, flip, zoom, filter controls, backend project save, export PNG | No layer/object model yet |
| `/creator/design-editor` | Full work | Text style toggles, zoom, undo/redo, drag, resize handles, alignment guides, backend project save, local draft restore, export | No major gap in the current editor contract |
| `/creator/clip-editor` | Full work | Truthful empty timeline, draft/project restore, sample loading, playback, seek, duplicate, clip move, per-clip trim, backend save/export | No final render pipeline |
| `/creator/video-editor` | Full work | Playback seek, undo/redo, media picker, backend project load/save, project export | No final video render pipeline |
| `/creator/workflow-editor` | Full work | Execution wiring, provider routing, undo/redo-like controls, backend project snapshot save, save/export JSON, legacy `/workflow-editor` and `/spaces` aliases | No final render contract; workflow snapshot persistence now available |

## Quick Read

- Best production-ready surfaces today: `image-generator`, `icon-generator`, `video-generator`, `ai-assistant`, `image-editor`.
- Surfaces that still rely on local JSON or draft storage: `none in the creator suite`; creator tools now persist project snapshots where applicable, but final render/export validation still needs broader proof.
- The remaining broad product gap is not basic clickability anymore. It is backend-backed persistence and true render/export pipelines for the editor surfaces.
