import { createRoot } from 'solid-js';
import { createDnD } from './createDnD';
import { DnDConfig, DndPayload, DnDInstance } from './models';

// ── Payload type used across all tests ──────────────────────────────

interface CardPayload {
  cardId: string;
}

// ── Test helpers (issue #15) ────────────────────────────────────────

const instances: DnDInstance<any>[] = [];

/**
 * Creates a DnD instance with `dragThreshold: 0` by default so that
 * existing pointer-based tests activate the drag immediately on pointerdown.
 */
function createTestDnD<P extends DndPayload>(config: DnDConfig<P> = {}) {
  const dnd = createDnD<P>({ dragThreshold: 0, ...config });
  instances.push(dnd);
  return dnd;
}

/** Shortcut: creates a `<div>`, appends it to `document.body`, and returns it. */
function createEl(tag = 'div'): HTMLElement {
  const el = document.createElement(tag);
  document.body.appendChild(el);
  return el;
}

// ── Suite ───────────────────────────────────────────────────────────

describe('createDnD', () => {
  afterEach(() => {
    instances.forEach((dnd) => dnd.destroy());
    instances.length = 0;
    document.body.innerHTML = '';
  });

  // ── Basic drag & drop ───────────────────────────────────────────

  it('drops payload on accepted zone', () => {
    const draggable = createEl();
    const zone = createEl();

    const dragStart = vi.fn();
    const dragEnd = vi.fn();
    const dropHandler = vi.fn();
    const onDrop = vi.fn();

    const dnd = createTestDnD<CardPayload>({
      activeClassName: 'is-active',
      overClassName: 'is-over',
      onDrop,
    });

    vi.spyOn(zone, 'getBoundingClientRect').mockReturnValue({
      x: 100,
      y: 200,
      width: 160,
      height: 120,
      top: 200,
      left: 100,
      right: 260,
      bottom: 320,
      toJSON: () => ({}),
    } as DOMRect);

    dnd.dndDraggable(draggable, () => ({
      id: 'zone-1',
      getPayload: () => ({ cardId: 'alpha' }),
      onDragStart: dragStart,
      onDragEnd: dragEnd,
    }));

    dnd.dndDropzone(zone, () => ({
      id: 'zone-2',
      accepts: () => true,
      onDrop: dropHandler,
    }));

    draggable.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, clientX: 110, clientY: 210 }));
    zone.dispatchEvent(new MouseEvent('pointerenter', { bubbles: true, clientX: 145, clientY: 245 }));
    document.dispatchEvent(new MouseEvent('pointerup', { bubbles: true, clientX: 160, clientY: 255 }));

    expect(dragStart).toHaveBeenCalledTimes(1);
    expect(dropHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceId: 'zone-1',
        payload: { cardId: 'alpha' },
        position: { zoneId: 'zone-2', x: 60, y: 55 },
        dropPosition: { zoneId: 'zone-2', x: 60, y: 55 },
      }),
    );
    expect(onDrop).toHaveBeenCalledWith(
      'zone-2',
      expect.objectContaining({
        sourceId: 'zone-1',
        payload: { cardId: 'alpha' },
        dropPosition: { zoneId: 'zone-2', x: 60, y: 55 },
      }),
    );
    expect(dragEnd).toHaveBeenCalledTimes(1);
    expect(draggable.classList.contains('is-active')).toBe(false);
    expect(zone.classList.contains('is-over')).toBe(false);
  });

  it('exposes pointer offset from source element on drop state', () => {
    const draggable = createEl();
    const zone = createEl();
    const dropHandler = vi.fn();

    vi.spyOn(draggable, 'getBoundingClientRect').mockReturnValue({
      x: 80,
      y: 120,
      width: 140,
      height: 48,
      top: 120,
      left: 80,
      right: 220,
      bottom: 168,
      toJSON: () => ({}),
    } as DOMRect);

    vi.spyOn(zone, 'getBoundingClientRect').mockReturnValue({
      x: 300,
      y: 200,
      width: 240,
      height: 180,
      top: 200,
      left: 300,
      right: 540,
      bottom: 380,
      toJSON: () => ({}),
    } as DOMRect);

    const dnd = createTestDnD<CardPayload>();

    dnd.dndDraggable(draggable, () => ({
      id: 'item-a',
      getPayload: () => ({ cardId: 'offset' }),
    }));

    dnd.dndDropzone(zone, () => ({
      id: 'drop-zone',
      onDrop: dropHandler,
    }));

    draggable.dispatchEvent(
      new MouseEvent('pointerdown', { bubbles: true, clientX: 110, clientY: 150 }),
    );
    zone.dispatchEvent(
      new MouseEvent('pointerenter', { bubbles: true, clientX: 340, clientY: 260 }),
    );
    document.dispatchEvent(
      new MouseEvent('pointerup', { bubbles: true, clientX: 360, clientY: 280 }),
    );

    expect(dropHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        pointerOffset: {
          x: 30,
          y: 30,
        },
        dropPosition: {
          zoneId: 'drop-zone',
          x: 60,
          y: 80,
        },
      }),
    );
  });

  it('handles rejected drops and calls onInvalidDrop', () => {
    const draggable = createEl();
    const zone = createEl();

    const onInvalidDrop = vi.fn();
    const zoneDrop = vi.fn();

    const dnd = createTestDnD<CardPayload>({ onInvalidDrop });

    dnd.dndDraggable(draggable, () => ({
      id: 'zone-1',
      getPayload: () => ({ cardId: 'beta' }),
    }));

    dnd.dndDropzone(zone, () => ({
      id: 'zone-2',
      accepts: () => false,
      onDrop: zoneDrop,
    }));

    draggable.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }));
    zone.dispatchEvent(new MouseEvent('pointerenter', { bubbles: true }));
    document.dispatchEvent(new MouseEvent('pointerup', { bubbles: true }));

    expect(zoneDrop).not.toHaveBeenCalled();
    expect(onInvalidDrop).toHaveBeenCalledWith({ sourceId: 'zone-1', payload: { cardId: 'beta' } });
    expect(onInvalidDrop).not.toHaveBeenCalledWith(
      expect.objectContaining({ position: expect.anything() }),
    );
    expect(onInvalidDrop).not.toHaveBeenCalledWith(
      expect.objectContaining({ dropPosition: expect.anything() }),
    );
  });

  it('tracks live dropzone-relative coordinates on active drag state', () => {
    const draggable = createEl();
    const zone = createEl();

    vi.spyOn(zone, 'getBoundingClientRect').mockReturnValue({
      x: 40,
      y: 50,
      width: 240,
      height: 180,
      top: 50,
      left: 40,
      right: 280,
      bottom: 230,
      toJSON: () => ({}),
    } as DOMRect);

    const dnd = createTestDnD<CardPayload>();

    dnd.dndDraggable(draggable, () => ({
      id: 'drag-item',
      getPayload: () => ({ cardId: 'position' }),
    }));

    dnd.dndDropzone(zone, () => ({
      id: 'drop-zone',
    }));

    draggable.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, clientX: 30, clientY: 30 }));
    zone.dispatchEvent(new MouseEvent('pointerenter', { bubbles: true, clientX: 60, clientY: 80 }));

    expect(dnd.getActiveDrag()?.position).toEqual({
      zoneId: 'drop-zone',
      x: 20,
      y: 30,
    });

    document.dispatchEvent(new MouseEvent('pointermove', { bubbles: true, clientX: 90, clientY: 95 }));

    expect(dnd.getActiveDrag()?.position).toEqual({
      zoneId: 'drop-zone',
      x: 50,
      y: 45,
    });

    document.dispatchEvent(new MouseEvent('pointerup', { bubbles: true }));
  });

  it('acquires hovered dropzone from pointermove without pointerenter', () => {
    const draggable = createEl();
    const zone = createEl();
    const dropHandler = vi.fn();

    vi.spyOn(zone, 'getBoundingClientRect').mockReturnValue({
      x: 200,
      y: 100,
      width: 150,
      height: 120,
      top: 100,
      left: 200,
      right: 350,
      bottom: 220,
      toJSON: () => ({}),
    } as DOMRect);

    const dnd = createTestDnD<CardPayload>();

    dnd.dndDraggable(draggable, () => ({
      id: 'source',
      getPayload: () => ({ cardId: 'move-hover' }),
    }));

    dnd.dndDropzone(zone, () => ({
      id: 'zone',
      onDrop: dropHandler,
    }));

    draggable.dispatchEvent(
      new MouseEvent('pointerdown', { bubbles: true, clientX: 20, clientY: 20 }),
    );
    document.dispatchEvent(
      new MouseEvent('pointermove', { bubbles: true, clientX: 240, clientY: 140 }),
    );
    document.dispatchEvent(
      new MouseEvent('pointerup', { bubbles: true, clientX: 250, clientY: 150 }),
    );

    expect(dropHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceId: 'source',
        payload: { cardId: 'move-hover' },
        dropPosition: { zoneId: 'zone', x: 50, y: 50 },
      }),
    );
  });

  it('ignores invalid bindings and resets state on destroy', () => {
    const draggable = createEl();

    const onInvalidDrop = vi.fn();

    const dnd = createTestDnD<CardPayload>({ onInvalidDrop });

    dnd.dndDraggable(draggable, () => ({
      id: '',
      getPayload: () => ({ cardId: 'gamma' }),
    }));

    draggable.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }));

    expect(dnd.getActiveDrag()).toBeNull();

    dnd.destroy();
    document.dispatchEvent(new MouseEvent('pointerup', { bubbles: true }));

    expect(dnd.getActiveDrag()).toBeNull();
    expect(onInvalidDrop).not.toHaveBeenCalled();
  });

  // ── Preview lifecycle ─────────────────────────────────────────

  it('creates a default drag ghost and removes it on pointerup', () => {
    const draggable = createEl();
    draggable.textContent = 'Default ghost';

    const dnd = createTestDnD<CardPayload>();

    dnd.dndDraggable(draggable, () => ({
      id: 'zone-1',
      getPayload: () => ({ cardId: 'preview' }),
    }));

    draggable.dispatchEvent(
      new MouseEvent('pointerdown', { bubbles: true, clientX: 20, clientY: 30 }),
    );

    const preview = document.querySelector('.dnd-preview') as HTMLElement | null;
    expect(preview).not.toBeNull();
    expect(preview?.textContent).toBe('Default ghost');

    document.dispatchEvent(
      new MouseEvent('pointermove', { bubbles: true, clientX: 65, clientY: 85 }),
    );

    expect(preview?.style.left).toBe('45px');
    expect(preview?.style.top).toBe('55px');

    document.dispatchEvent(new MouseEvent('pointerup', { bubbles: true }));
    expect(document.querySelector('.dnd-preview')).toBeNull();
  });

  it('uses custom preview element when provided', () => {
    const draggable = createEl();

    const createPreview = vi.fn(() => {
      const preview = document.createElement('div');
      preview.textContent = 'Custom preview';
      return preview;
    });

    const dnd = createTestDnD<CardPayload>();

    dnd.dndDraggable(draggable, () => ({
      id: 'zone-1',
      getPayload: () => ({ cardId: 'custom' }),
      createDragPreview: createPreview,
    }));

    draggable.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }));

    const preview = document.querySelector('.dnd-preview') as HTMLElement | null;
    expect(createPreview).toHaveBeenCalledTimes(1);
    expect(preview?.textContent).toBe('Custom preview');

    document.dispatchEvent(new MouseEvent('pointerup', { bubbles: true }));
  });

  it('removes active preview on destroy', () => {
    const draggable = createEl();

    const dnd = createTestDnD<CardPayload>();

    dnd.dndDraggable(draggable, () => ({
      id: 'zone-1',
      getPayload: () => ({ cardId: 'destroy' }),
    }));

    draggable.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }));
    expect(document.querySelector('.dnd-preview')).not.toBeNull();

    dnd.destroy();

    expect(document.querySelector('.dnd-preview')).toBeNull();
    expect(dnd.getActiveDrag()).toBeNull();
  });

  // ── Sortable ──────────────────────────────────────────────────

  it('computes sortable target index for same-list reorder', () => {
    const draggable = createEl();
    const targetItem = createEl();

    const dropHandler = vi.fn();

    vi.spyOn(targetItem, 'getBoundingClientRect').mockReturnValue({
      x: 0,
      y: 0,
      width: 120,
      height: 100,
      top: 0,
      left: 0,
      right: 120,
      bottom: 100,
      toJSON: () => ({}),
    } as DOMRect);

    const dnd = createTestDnD<CardPayload>();

    dnd.dndDraggable(draggable, () => ({
      id: 'item-1',
      getPayload: () => ({ cardId: 'same-list' }),
      sortable: { listId: 'list-a', index: 0 },
    }));

    dnd.dndDropzone(targetItem, () => ({
      id: 'item-2',
      sortable: { listId: 'list-a', index: 1 },
      onDrop: dropHandler,
    }));

    draggable.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, clientY: 10 }));
    targetItem.dispatchEvent(new MouseEvent('pointerenter', { bubbles: true, clientY: 80 }));
    document.dispatchEvent(new MouseEvent('pointerup', { bubbles: true, clientY: 80 }));

    expect(dropHandler).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceId: 'item-1',
        payload: { cardId: 'same-list' },
        sortable: {
          sourceListId: 'list-a',
          sourceIndex: 0,
          targetListId: 'list-a',
          targetIndex: 1,
          placement: 'after',
        },
      }),
    );
  });

  it('re-evaluates dropzone from pointerup coordinates for sortable drops', () => {
    const draggable = createEl();
    const zoneA = createEl();
    const zoneB = createEl();

    const onDrop = vi.fn();

    let zoneARect = {
      x: 0,
      y: 0,
      width: 120,
      height: 100,
      top: 0,
      left: 0,
      right: 120,
      bottom: 100,
      toJSON: () => ({}),
    } as DOMRect;

    let zoneBRect = {
      x: 200,
      y: 0,
      width: 120,
      height: 100,
      top: 0,
      left: 200,
      right: 320,
      bottom: 100,
      toJSON: () => ({}),
    } as DOMRect;

    vi.spyOn(zoneA, 'getBoundingClientRect').mockImplementation(() => zoneARect);
    vi.spyOn(zoneB, 'getBoundingClientRect').mockImplementation(() => zoneBRect);

    const dnd = createTestDnD<CardPayload>({ onDrop });

    dnd.dndDraggable(draggable, () => ({
      id: 'item-1',
      getPayload: () => ({ cardId: 'release-zone' }),
      sortable: { listId: 'list-a', index: 0 },
    }));

    dnd.dndDropzone(zoneA, () => ({
      id: 'zone-a-item',
      sortable: { listId: 'list-a', index: 0 },
    }));

    dnd.dndDropzone(zoneB, () => ({
      id: 'zone-b-item',
      sortable: { listId: 'list-b', index: 0 },
    }));

    draggable.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, clientX: 10, clientY: 10 }));
    zoneA.dispatchEvent(new MouseEvent('pointerenter', { bubbles: true, clientX: 20, clientY: 20 }));

    zoneARect = {
      ...zoneARect,
      x: -300,
      left: -300,
      right: -180,
    } as DOMRect;
    zoneBRect = {
      ...zoneBRect,
      x: 0,
      left: 0,
      right: 120,
    } as DOMRect;

    document.dispatchEvent(new MouseEvent('pointerup', { bubbles: true, clientX: 20, clientY: 20 }));

    expect(onDrop).toHaveBeenCalledWith(
      'zone-b-item',
      expect.objectContaining({
        sourceId: 'item-1',
        payload: { cardId: 'release-zone' },
        sortable: {
          sourceListId: 'list-a',
          sourceIndex: 0,
          targetListId: 'list-b',
          targetIndex: 0,
          placement: 'before',
        },
      }),
    );
  });

  it('re-evaluates sortable placement on pointerup with moved geometry', () => {
    const draggable = createEl();
    const targetItem = createEl();

    const onDrop = vi.fn();

    let targetRect = {
      x: 0,
      y: 0,
      width: 120,
      height: 100,
      top: 0,
      left: 0,
      right: 120,
      bottom: 100,
      toJSON: () => ({}),
    } as DOMRect;

    vi.spyOn(targetItem, 'getBoundingClientRect').mockImplementation(() => targetRect);

    const dnd = createTestDnD<CardPayload>({ onDrop });

    dnd.dndDraggable(draggable, () => ({
      id: 'item-1',
      getPayload: () => ({ cardId: 'release-placement' }),
      sortable: { listId: 'list-a', index: 0 },
    }));

    dnd.dndDropzone(targetItem, () => ({
      id: 'item-2',
      sortable: { listId: 'list-a', index: 1 },
    }));

    draggable.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true, clientX: 10, clientY: 10 }));
    targetItem.dispatchEvent(new MouseEvent('pointerenter', { bubbles: true, clientX: 10, clientY: 20 }));

    targetRect = {
      ...targetRect,
      y: -50,
      top: -50,
      bottom: 50,
    } as DOMRect;

    document.dispatchEvent(new MouseEvent('pointerup', { bubbles: true, clientX: 10, clientY: 20 }));

    expect(onDrop).toHaveBeenCalledWith(
      'item-2',
      expect.objectContaining({
        sourceId: 'item-1',
        payload: { cardId: 'release-placement' },
        sortable: {
          sourceListId: 'list-a',
          sourceIndex: 0,
          targetListId: 'list-a',
          targetIndex: 1,
          placement: 'after',
        },
      }),
    );
  });

  it('computes sortable target index for cross-list insertion', () => {
    const draggable = createEl();
    const listEndZone = createEl();

    const onDrop = vi.fn();

    const dnd = createTestDnD<CardPayload>({ onDrop });

    dnd.dndDraggable(draggable, () => ({
      id: 'item-1',
      getPayload: () => ({ cardId: 'cross-list' }),
      sortable: { listId: 'list-a', index: 1 },
    }));

    dnd.dndDropzone(listEndZone, () => ({
      id: 'list-b-end',
      sortable: { listId: 'list-b', index: 0 },
    }));

    draggable.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }));
    listEndZone.dispatchEvent(new MouseEvent('pointerenter', { bubbles: true }));
    document.dispatchEvent(new MouseEvent('pointerup', { bubbles: true }));

    expect(onDrop).toHaveBeenCalledWith(
      'list-b-end',
      expect.objectContaining({
        sourceId: 'item-1',
        payload: { cardId: 'cross-list' },
        sortable: {
          sourceListId: 'list-a',
          sourceIndex: 1,
          targetListId: 'list-b',
          targetIndex: 0,
        },
      }),
    );
  });

  it('computes sortable target index for start sentinel insertion', () => {
    const draggable = createEl();
    const listStartZone = createEl();

    const onDrop = vi.fn();

    vi.spyOn(listStartZone, 'getBoundingClientRect').mockReturnValue({
      x: 0,
      y: 0,
      width: 120,
      height: 40,
      top: 0,
      left: 0,
      right: 120,
      bottom: 40,
      toJSON: () => ({}),
    } as DOMRect);

    const dnd = createTestDnD<CardPayload>({ onDrop });

    dnd.dndDraggable(draggable, () => ({
      id: 'item-3',
      getPayload: () => ({ cardId: 'top-insert' }),
      sortable: { listId: 'list-a', index: 2 },
    }));

    dnd.dndDropzone(listStartZone, () => ({
      id: 'list-a-start',
      sortable: { listId: 'list-a', index: 0 },
    }));

    draggable.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }));
  listStartZone.dispatchEvent(new MouseEvent('pointerenter', { bubbles: true, clientX: 5, clientY: 5 }));
  document.dispatchEvent(new MouseEvent('pointerup', { bubbles: true, clientX: 5, clientY: 5 }));

    expect(onDrop).toHaveBeenCalledWith(
      'list-a-start',
      expect.objectContaining({
        sourceId: 'item-3',
        payload: { cardId: 'top-insert' },
        sortable: expect.objectContaining({
          sourceListId: 'list-a',
          sourceIndex: 2,
          targetListId: 'list-a',
          targetIndex: 0,
        }),
      }),
    );
  });

  it('calls onInvalidDrop when sortable zone rejects', () => {
    const draggable = createEl();
    const targetItem = createEl();

    const onInvalidDrop = vi.fn();

    const dnd = createTestDnD<CardPayload>({ onInvalidDrop });

    dnd.dndDraggable(draggable, () => ({
      id: 'item-1',
      getPayload: () => ({ cardId: 'reject' }),
      sortable: { listId: 'list-a', index: 0 },
    }));

    dnd.dndDropzone(targetItem, () => ({
      id: 'item-2',
      sortable: { listId: 'list-b', index: 0 },
      accepts: () => false,
    }));

    draggable.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }));
    targetItem.dispatchEvent(new MouseEvent('pointerenter', { bubbles: true, clientY: 10 }));
    document.dispatchEvent(new MouseEvent('pointerup', { bubbles: true }));

    expect(onInvalidDrop).toHaveBeenCalledWith({
      sourceId: 'item-1',
      payload: { cardId: 'reject' },
      sortable: {
        sourceListId: 'list-a',
        sourceIndex: 0,
        targetListId: 'list-b',
        targetIndex: 0,
      },
    });
  });

  // ── Callback ordering ─────────────────────────────────────────

  it('invokes callbacks in stable order for accepted drops', () => {
    const draggable = createEl();
    const zone = createEl();

    const callOrder: string[] = [];

    const dnd = createTestDnD<CardPayload>({
      onDrop: () => callOrder.push('config:onDrop'),
    });

    dnd.dndDraggable(draggable, () => ({
      id: 'source-zone',
      getPayload: () => ({ cardId: 'ordered' }),
      onDragStart: () => callOrder.push('draggable:onDragStart'),
      onDragEnd: () => callOrder.push('draggable:onDragEnd'),
    }));

    dnd.dndDropzone(zone, () => ({
      id: 'target-zone',
      onDrop: () => callOrder.push('zone:onDrop'),
    }));

    draggable.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }));
    zone.dispatchEvent(new MouseEvent('pointerenter', { bubbles: true }));
    document.dispatchEvent(new MouseEvent('pointerup', { bubbles: true }));

    expect(callOrder).toEqual([
      'draggable:onDragStart',
      'zone:onDrop',
      'config:onDrop',
      'draggable:onDragEnd',
    ]);
  });

  it('fires leave for previous zone before enter for next zone', () => {
    const draggable = createEl();
    const zoneA = createEl();
    const zoneB = createEl();

    const events: string[] = [];

    const dnd = createTestDnD<CardPayload>();

    dnd.dndDraggable(draggable, () => ({
      id: 'source',
      getPayload: () => ({ cardId: 'transition' }),
    }));

    dnd.dndDropzone(zoneA, () => ({
      id: 'zone-a',
      onDragEnter: () => events.push('a:enter'),
      onDragLeave: () => events.push('a:leave'),
    }));

    dnd.dndDropzone(zoneB, () => ({
      id: 'zone-b',
      onDragEnter: () => events.push('b:enter'),
      onDragLeave: () => events.push('b:leave'),
    }));

    draggable.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }));
    zoneA.dispatchEvent(new MouseEvent('pointerenter', { bubbles: true }));
    zoneB.dispatchEvent(new MouseEvent('pointerenter', { bubbles: true }));

    expect(events).toEqual(['a:enter', 'a:leave', 'b:enter']);
  });

  // ── Issue #1: destroy() only fires onDragEnd on active draggable ──

  it('destroy fires onDragEnd only on the active draggable', () => {
    const draggableA = createEl();
    const draggableB = createEl();

    const onDragEndA = vi.fn();
    const onDragEndB = vi.fn();

    const dnd = createTestDnD<CardPayload>();

    dnd.dndDraggable(draggableA, () => ({
      id: 'a',
      getPayload: () => ({ cardId: 'a' }),
      onDragEnd: onDragEndA,
    }));

    dnd.dndDraggable(draggableB, () => ({
      id: 'b',
      getPayload: () => ({ cardId: 'b' }),
      onDragEnd: onDragEndB,
    }));

    // Start drag on A
    draggableA.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }));
    expect(dnd.getActiveDrag()).not.toBeNull();

    // Destroy while A is active
    dnd.destroy();

    expect(onDragEndA).toHaveBeenCalledTimes(1);
    expect(onDragEndB).not.toHaveBeenCalled();
  });

  // ── Issue #3: drag threshold ──────────────────────────────────

  it('does not start drag until pointer moves past threshold', () => {
    const draggable = createEl();
    const onDragStart = vi.fn();

    const dnd = createDnD<CardPayload>({ dragThreshold: 10 });
    instances.push(dnd);

    dnd.dndDraggable(draggable, () => ({
      id: 'threshold',
      getPayload: () => ({ cardId: 'threshold' }),
      onDragStart,
    }));

    draggable.dispatchEvent(
      new MouseEvent('pointerdown', { bubbles: true, clientX: 100, clientY: 100 }),
    );
    expect(dnd.getActiveDrag()).toBeNull();
    expect(onDragStart).not.toHaveBeenCalled();

    // Move less than threshold (5px, need 10)
    document.dispatchEvent(
      new MouseEvent('pointermove', { bubbles: true, clientX: 105, clientY: 100 }),
    );
    expect(dnd.getActiveDrag()).toBeNull();

    // Move past threshold (11px from start)
    document.dispatchEvent(
      new MouseEvent('pointermove', { bubbles: true, clientX: 111, clientY: 100 }),
    );
    expect(dnd.getActiveDrag()).not.toBeNull();
    expect(onDragStart).toHaveBeenCalledTimes(1);
  });

  it('recovers hover when pointer entered zone before threshold activation', () => {
    const draggable = createEl();
    const zone = createEl();
    const onDrop = vi.fn();

    vi.spyOn(zone, 'getBoundingClientRect').mockReturnValue({
      x: 300,
      y: 300,
      width: 160,
      height: 140,
      top: 300,
      left: 300,
      right: 460,
      bottom: 440,
      toJSON: () => ({}),
    } as DOMRect);

    const dnd = createDnD<CardPayload>({ dragThreshold: 10, onDrop });
    instances.push(dnd);

    dnd.dndDraggable(draggable, () => ({
      id: 'threshold-source',
      getPayload: () => ({ cardId: 'threshold-recover' }),
    }));

    dnd.dndDropzone(zone, () => ({
      id: 'threshold-zone',
    }));

    draggable.dispatchEvent(
      new MouseEvent('pointerdown', { bubbles: true, clientX: 100, clientY: 100 }),
    );

    zone.dispatchEvent(
      new MouseEvent('pointerenter', { bubbles: true, clientX: 340, clientY: 340 }),
    );

    document.dispatchEvent(
      new MouseEvent('pointermove', { bubbles: true, clientX: 340, clientY: 340 }),
    );

    document.dispatchEvent(
      new MouseEvent('pointerup', { bubbles: true, clientX: 350, clientY: 350 }),
    );

    expect(onDrop).toHaveBeenCalledWith(
      'threshold-zone',
      expect.objectContaining({
        sourceId: 'threshold-source',
        payload: { cardId: 'threshold-recover' },
        dropPosition: { zoneId: 'threshold-zone', x: 50, y: 50 },
      }),
    );
  });

  it('treats pointerup before threshold as a click (no drag)', () => {
    const draggable = createEl();
    const onDragStart = vi.fn();
    const onInvalidDrop = vi.fn();

    const dnd = createDnD<CardPayload>({ dragThreshold: 10, onInvalidDrop });
    instances.push(dnd);

    dnd.dndDraggable(draggable, () => ({
      id: 'click',
      getPayload: () => ({ cardId: 'click' }),
      onDragStart,
    }));

    draggable.dispatchEvent(
      new MouseEvent('pointerdown', { bubbles: true, clientX: 50, clientY: 50 }),
    );

    // Release without moving past threshold
    document.dispatchEvent(new MouseEvent('pointerup', { bubbles: true }));

    expect(onDragStart).not.toHaveBeenCalled();
    expect(onInvalidDrop).not.toHaveBeenCalled();
    expect(dnd.getActiveDrag()).toBeNull();
  });

  // ── Issue #4: Escape key cancel ───────────────────────────────

  it('cancels active drag on Escape key', () => {
    const draggable = createEl();
    const onDragCancel = vi.fn();
    const onDragEnd = vi.fn();

    const dnd = createTestDnD<CardPayload>({ onDragCancel });

    dnd.dndDraggable(draggable, () => ({
      id: 'escape',
      getPayload: () => ({ cardId: 'escape' }),
      onDragEnd,
    }));

    draggable.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }));
    expect(dnd.getActiveDrag()).not.toBeNull();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

    expect(dnd.getActiveDrag()).toBeNull();
    expect(onDragCancel).toHaveBeenCalledTimes(1);
    expect(onDragEnd).toHaveBeenCalledTimes(1);
    expect(document.querySelector('.dnd-preview')).toBeNull();
  });

  it('Escape without active drag does nothing', () => {
    const onDragCancel = vi.fn();
    const dnd = createTestDnD<CardPayload>({ onDragCancel });

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

    expect(onDragCancel).not.toHaveBeenCalled();
  });

  // ── Issue #5: lazy global listeners ───────────────────────────

  it('does not have global listeners before a drag starts', () => {
    const draggable = createEl();
    const dnd = createTestDnD<CardPayload>();

    dnd.dndDraggable(draggable, () => ({
      id: 'lazy',
      getPayload: () => ({ cardId: 'lazy' }),
    }));

    // pointermove on document should not do anything (no listeners yet)
    const onDragStart = vi.fn();
    dnd.dndDraggable(createEl(), () => ({
      id: 'lazy2',
      getPayload: () => ({ cardId: 'lazy2' }),
      onDragStart,
    }));

    // Dispatching pointermove/pointerup without starting drag should not throw
    document.dispatchEvent(new MouseEvent('pointermove', { bubbles: true }));
    document.dispatchEvent(new MouseEvent('pointerup', { bubbles: true }));

    expect(dnd.getActiveDrag()).toBeNull();
  });

  it('removes global listeners after drag ends', () => {
    const draggable = createEl();
    const onInvalidDrop = vi.fn();

    const dnd = createTestDnD<CardPayload>({ onInvalidDrop });

    dnd.dndDraggable(draggable, () => ({
      id: 'listener-cleanup',
      getPayload: () => ({ cardId: 'cleanup' }),
    }));

    // Start and end drag
    draggable.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }));
    document.dispatchEvent(new MouseEvent('pointerup', { bubbles: true }));
    onInvalidDrop.mockClear();

    // A second pointerup should NOT trigger the handler (listeners were removed)
    document.dispatchEvent(new MouseEvent('pointerup', { bubbles: true }));
    expect(onInvalidDrop).not.toHaveBeenCalled();
  });

  // ── Issue #6: configurable previewClassName ───────────────────

  it('uses configured previewClassName', () => {
    const draggable = createEl();

    const dnd = createTestDnD<CardPayload>({ previewClassName: 'my-ghost' });

    dnd.dndDraggable(draggable, () => ({
      id: 'custom-class',
      getPayload: () => ({ cardId: 'class' }),
    }));

    draggable.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }));

    expect(document.querySelector('.my-ghost')).not.toBeNull();
    expect(document.querySelector('.dnd-preview')).toBeNull();

    document.dispatchEvent(new MouseEvent('pointerup', { bubbles: true }));
  });

  // ── Issue #11: touch-action ───────────────────────────────────

  it('sets touch-action: none on draggable elements', () => {
    const draggable = createEl();
    const dnd = createTestDnD<CardPayload>();

    dnd.dndDraggable(draggable, () => ({
      id: 'touch',
      getPayload: () => ({ cardId: 'touch' }),
    }));

    expect(draggable.style.touchAction).toBe('none');
  });

  it('clears touch-action on destroy', () => {
    const draggable = createEl();
    const dnd = createTestDnD<CardPayload>();

    dnd.dndDraggable(draggable, () => ({
      id: 'touch',
      getPayload: () => ({ cardId: 'touch' }),
    }));

    dnd.destroy();
    expect(draggable.style.touchAction).toBe('');
  });

  // ── Issue #13: configurable previewZIndex ─────────────────────

  it('applies configured previewZIndex', () => {
    const draggable = createEl();

    const dnd = createTestDnD<CardPayload>({ previewZIndex: 9999 });

    dnd.dndDraggable(draggable, () => ({
      id: 'zindex',
      getPayload: () => ({ cardId: 'zindex' }),
    }));

    draggable.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }));

    const preview = document.querySelector('.dnd-preview') as HTMLElement;
    expect(preview?.style.zIndex).toBe('9999');

    document.dispatchEvent(new MouseEvent('pointerup', { bubbles: true }));
  });

  // ── Issue #14: ARIA attributes ────────────────────────────────

  it('sets ARIA attributes on draggable elements', () => {
    const draggable = createEl();
    const dnd = createTestDnD<CardPayload>();

    dnd.dndDraggable(draggable, () => ({
      id: 'aria',
      getPayload: () => ({ cardId: 'aria' }),
    }));

    expect(draggable.getAttribute('aria-roledescription')).toBe('draggable');
    expect(draggable.getAttribute('aria-grabbed')).toBe('false');

    // Start drag — should set aria-grabbed to true
    draggable.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }));
    expect(draggable.getAttribute('aria-grabbed')).toBe('true');

    // End drag — should reset to false
    document.dispatchEvent(new MouseEvent('pointerup', { bubbles: true }));
    expect(draggable.getAttribute('aria-grabbed')).toBe('false');
  });

  it('sets ARIA attributes on dropzone elements', () => {
    const zone = createEl();
    const dnd = createTestDnD<CardPayload>();

    dnd.dndDropzone(zone, () => ({
      id: 'aria-zone',
    }));

    expect(zone.getAttribute('aria-roledescription')).toBe('drop zone');
  });

  it('removes ARIA attributes on destroy', () => {
    const draggable = createEl();
    const zone = createEl();
    const dnd = createTestDnD<CardPayload>();

    dnd.dndDraggable(draggable, () => ({
      id: 'aria-destroy',
      getPayload: () => ({ cardId: 'aria-destroy' }),
    }));

    dnd.dndDropzone(zone, () => ({ id: 'zone-aria-destroy' }));

    dnd.destroy();

    expect(draggable.getAttribute('aria-roledescription')).toBeNull();
    expect(draggable.getAttribute('aria-grabbed')).toBeNull();
    expect(zone.getAttribute('aria-roledescription')).toBeNull();
  });

  // ── Issue #2 / #10: per-element directive cleanup ─────────────

  it('cleans up draggable when Solid reactive scope disposes', () => {
    const draggable = createEl();
    const dnd = createTestDnD<CardPayload>();

    const dispose = createRoot((_dispose) => {
      dnd.dndDraggable(draggable, () => ({
        id: 'cleanup',
        getPayload: () => ({ cardId: 'cleanup' }),
      }));
      return _dispose;
    });

    // Verify element is functional (can start drag)
    draggable.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }));
    expect(dnd.getActiveDrag()).not.toBeNull();
    document.dispatchEvent(new MouseEvent('pointerup', { bubbles: true }));

    // Dispose reactive scope — removes listener & map entry
    dispose();

    // Element should no longer respond to pointerdown
    draggable.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }));
    expect(dnd.getActiveDrag()).toBeNull();
  });

  it('cleans up dropzone when Solid reactive scope disposes', () => {
    const draggable = createEl();
    const zone = createEl();
    const onDragEnter = vi.fn();

    const dnd = createTestDnD<CardPayload>();

    dnd.dndDraggable(draggable, () => ({
      id: 'source',
      getPayload: () => ({ cardId: 'zone-cleanup' }),
    }));

    const dispose = createRoot((_dispose) => {
      dnd.dndDropzone(zone, () => ({
        id: 'target',
        onDragEnter,
      }));
      return _dispose;
    });

    // Dispose the reactive scope
    dispose();

    // Start drag, hover over disposed zone — should not fire onDragEnter
    draggable.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }));
    zone.dispatchEvent(new MouseEvent('pointerenter', { bubbles: true }));

    expect(onDragEnter).not.toHaveBeenCalled();

    document.dispatchEvent(new MouseEvent('pointerup', { bubbles: true }));
  });

  it('resets active drag when the active draggable is cleaned up mid-drag', () => {
    const draggable = createEl();
    const onDragEnd = vi.fn();

    const dnd = createTestDnD<CardPayload>();

    const dispose = createRoot((_dispose) => {
      dnd.dndDraggable(draggable, () => ({
        id: 'mid-drag-cleanup',
        getPayload: () => ({ cardId: 'mid' }),
        onDragEnd,
      }));
      return _dispose;
    });

    // Start drag
    draggable.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }));
    expect(dnd.getActiveDrag()).not.toBeNull();

    // Dispose while drag is active — should call resetDragState
    dispose();

    expect(dnd.getActiveDrag()).toBeNull();
    expect(onDragEnd).toHaveBeenCalledTimes(1);
  });

  // ── pointercancel handling ────────────────────────────────────

  it('cancels active drag on pointercancel', () => {
    const draggable = createEl();
    const onDragCancel = vi.fn();
    const onDragEnd = vi.fn();

    const dnd = createTestDnD<CardPayload>({ onDragCancel });

    dnd.dndDraggable(draggable, () => ({
      id: 'cancel',
      getPayload: () => ({ cardId: 'cancel' }),
      onDragEnd,
    }));

    draggable.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }));
    expect(dnd.getActiveDrag()).not.toBeNull();

    document.dispatchEvent(new MouseEvent('pointercancel', { bubbles: true }));

    expect(dnd.getActiveDrag()).toBeNull();
    expect(onDragCancel).toHaveBeenCalledTimes(1);
    expect(onDragEnd).toHaveBeenCalledTimes(1);
  });
});
