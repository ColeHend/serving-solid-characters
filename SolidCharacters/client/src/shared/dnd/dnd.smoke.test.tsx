import { test, expect } from 'vitest';
import { render } from '@solidjs/testing-library';
import { DragDropProvider, createDraggable, createDroppable } from './index';

// Phase 2 verification gate: the vendored engine mounts and registers its
// primitives without throwing. Exercises useDragDropContext wiring, the
// register/onCleanup effects, and sensor binding under jsdom.

function Harness() {
  const drag = createDraggable(() => ({ id: 'field-chip', type: 'field', data: { fieldKey: 'name' } }));
  const drop = createDroppable(() => ({ id: 'page-0' }));
  return (
    <div>
      <div ref={drag.ref} data-testid="draggable">name</div>
      <div ref={drop.ref} data-testid="droppable">page</div>
    </div>
  );
}

test('mounts provider + draggable + droppable without throwing', () => {
  const { getByTestId, unmount } = render(() => (
    <DragDropProvider collisionDetection={undefined}>
      <Harness />
    </DragDropProvider>
  ));

  // Primitives applied their a11y attributes to the registered nodes.
  expect(getByTestId('draggable').getAttribute('aria-roledescription')).toBe('draggable');
  expect(getByTestId('droppable').getAttribute('role')).toBe('region');

  // Teardown runs the register/sensor onCleanup paths without throwing.
  expect(() => unmount()).not.toThrow();
});
