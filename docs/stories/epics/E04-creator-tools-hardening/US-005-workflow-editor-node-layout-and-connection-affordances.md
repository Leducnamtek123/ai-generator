# US-005 Workflow Editor Node Layout, Connection Affordances, and Canvas Settings

## Status

implemented

## Lane

normal

## Product Contract

The workflow editor should let users build connected graphs without fighting the
canvas. New nodes should appear in distinct, visible positions, and the editor
should expose real canvas settings so the modal controls actually change editor
behavior instead of only changing appearance.

## Relevant Product Docs

- `docs/product/README.md`

## Acceptance Criteria

- Adding multiple nodes does not stack them on top of each other by default.
- Newly added nodes remain visible in the main canvas area.
- Existing connection controls still work after node placement changes.
- The settings modal toggles real workflow behavior for helper lines, rich
  tooltips, experimental tools, autoplay videos, and mouse-wheel navigation.

## Design Notes

- Commands:
  - `npm run typecheck` in `frontend/`
- Queries:
  - `frontend/src/components/workflow/hooks/useWorkflowHandlers.ts`
  - `frontend/src/components/workflow/WorkflowCanvas.tsx`
- UI surfaces:
  - `frontend/src/app/[locale]/(dashboard)/creator/workflow-editor/page.tsx`
- `frontend/src/components/workflow/FloatingToolbar.tsx`
- `frontend/src/components/workflow/ShortcutsModal.tsx`
- `frontend/src/components/workflow/nodes/*`
- `frontend/src/stores/workflow-ui-store.ts`
- `frontend/src/components/workflow/hooks/useWorkflowHandlers.ts`
- Domain rules:
- New nodes should land near the visible canvas instead of reusing one fixed point.
- Connection UX must remain compatible with the existing React Flow handles.
- Handle ids and click affordances must stay aligned so nodes can be connected by drag or by clicking source/target handles.
- Workflow settings should persist and immediately affect the canvas, node
  selector, and tooltips.

## Validation

| Layer | Expected proof |
| --- | --- |
| Unit | Node placement helper returns distinct coordinates as node count grows. |
| Integration | Existing workflow handlers continue to save nodes and edges normally. |
| E2E | Browser verification shows newly added nodes visible, separated, and settings toggles changing editor behavior. |
| Platform | `frontend` typecheck remains green. |
| Release | Manual browser check of workflow editor node placement and settings controls. |

## Harness Delta

- Added a workflow editor hardening story for canvas placement and connection usability.
- Captured the user-visible symptom so future edits do not collapse nodes back onto one coordinate.
- Captured the settings modal so future edits do not regress from real controls back to fake toggles.

## Evidence

- `frontend` `npm run typecheck` passed after updating workflow node placement.
- Browser verification showed newly added nodes landing in distinct positions instead of overlapping.
- Browser verification showed the settings modal toggles working and the experimental tools option exposing the `Tool` node in the add-node menu.
- Workflow connection wiring was restored by aligning handle ids and wiring click-to-connect affordances across the workflow node set.
- Connection snapshot aliases now mirror connected prompt/image/video/reference values into the workflow node data used by the property panels and local execution path.
- Reference-style nodes and legacy `input` / `process` / `output` nodes now participate in execution instead of being silently dropped.
- Image Generator now renders an actual prompt textarea on the canvas, and Text/Image prompt inputs opt out of canvas pan/drag so they remain editable while the hand tool is active.
- Workflow canvas unload persistence now uses `sendBeacon` with a fetch fallback so pending graph changes still have a reliable save path when the page closes.
- Media and generated image previews now use browser-native media rendering for arbitrary uploaded/provider URLs instead of being blocked by `next/image` host restrictions.
- Browser verification on `http://localhost/creator/workflow-editor` after rebuilding `ai-generator-web` confirmed Image Generator prompt entry works in hand/pan mode with no console errors.
- The shared workflow node shell and node toolbars were restyled to use a tighter card language, edge-aligned ports that no longer clip behind the card, and smaller connector affordances so the canvas reads more like a polished creative workspace.
- Workflow ports now render visible type badges inside the connector circles, so prompt/image/output handles read like deliberate UI affordances instead of plain dots.
