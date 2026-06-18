# shared/dnd

Vendored copy of **SolidDragNDrop** (`To_Adapt_And_Delete/SolidDragNDrop/src`), a
headless drag-and-drop engine whose only peer dependency is `solid-js`. Copied
wholesale with zero import rewrites — every cross-file import is relative or from
`solid-js`.

## Import convention — import directly from this barrel

Consumers import from the local barrel, e.g. from a component three levels deep:

```ts
import { DragDropProvider, createDraggable, createDroppable, pointerWithin } from '../../../shared/dnd';
```

**Do not** re-export this module from `src/shared/index.ts`. Adding
`export * from './dnd'` there would pull the entire DnD type surface into every
`../shared` consumer. Keep it a direct, opt-in import.

## Provenance & maintenance

- Source of truth: the vendored tree under this folder. The original
  `To_Adapt_And_Delete/` copy is deleted once the full sheet-mapper build is green.
- `state.ts` is the one file exceeding the repo's ≤200-line rule (285 lines); it
  carries a header comment explaining the documented exception.
- This is a fork-by-copy: fixes are made here, not upstream.
