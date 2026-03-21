import {
	getSortableSource,
	resolvePlacement,
	buildDropState,
	getDropzoneCoordinates,
} from './createDnD.logic';
import { DraggableBinding, DropzoneBinding, DragState } from './models';

// ── Test helpers ────────────────────────────────────────────────────

interface TestPayload {
	id: string;
}

function draggableBinding(
	overrides: Partial<DraggableBinding<TestPayload>> = {},
): DraggableBinding<TestPayload> {
	return { id: 'item', getPayload: () => ({ id: '1' }), ...overrides };
}

function dropzoneBinding(
	overrides: Partial<DropzoneBinding<TestPayload>> = {},
): DropzoneBinding<TestPayload> {
	return { id: 'zone', ...overrides };
}

function mockElement(height: number, top = 0): HTMLElement {
	const el = document.createElement('div');

	vi.spyOn(el, 'getBoundingClientRect').mockReturnValue({
		x: 0,
		y: top,
		width: 100,
		height,
		top,
		left: 0,
		right: 100,
		bottom: top + height,
		toJSON: () => ({}),
	} as DOMRect);

	return el;
}

// ── getSortableSource ───────────────────────────────────────────────

describe('getSortableSource', () => {
	it('returns undefined when no sortable binding', () => {
		expect(getSortableSource(draggableBinding())).toBeUndefined();
	});

	it('returns undefined when listId is empty', () => {
		const binding = draggableBinding({ sortable: { listId: '', index: 0 } });
		expect(getSortableSource(binding)).toBeUndefined();
	});

	it('returns undefined when index is NaN', () => {
		const binding = draggableBinding({ sortable: { listId: 'list', index: NaN } });
		expect(getSortableSource(binding)).toBeUndefined();
	});

	it('returns undefined when index is Infinity', () => {
		const binding = draggableBinding({
			sortable: { listId: 'list', index: Infinity },
		});
		expect(getSortableSource(binding)).toBeUndefined();
	});

	it('returns undefined when index is -Infinity', () => {
		const binding = draggableBinding({
			sortable: { listId: 'list', index: -Infinity },
		});
		expect(getSortableSource(binding)).toBeUndefined();
	});

	it('returns source meta for a valid binding', () => {
		const binding = draggableBinding({
			sortable: { listId: 'list-a', index: 2 },
		});

		expect(getSortableSource(binding)).toEqual({
			sourceListId: 'list-a',
			sourceIndex: 2,
		});
	});

	it('returns source meta for index zero', () => {
		const binding = draggableBinding({
			sortable: { listId: 'list-a', index: 0 },
		});

		expect(getSortableSource(binding)).toEqual({
			sourceListId: 'list-a',
			sourceIndex: 0,
		});
	});
});

// ── resolvePlacement ────────────────────────────────────────────────

describe('resolvePlacement', () => {
	it('returns undefined when no sortable binding', () => {
		const el = mockElement(100);
		expect(resolvePlacement(el, dropzoneBinding(), 50)).toBeUndefined();
	});

	it('returns undefined when element height is zero', () => {
		const el = mockElement(0);
		const binding = dropzoneBinding({ sortable: { listId: 'l', index: 0 } });

		expect(resolvePlacement(el, binding, 0)).toBeUndefined();
	});

	it('returns undefined when element height is negative', () => {
		const el = mockElement(-10);
		const binding = dropzoneBinding({ sortable: { listId: 'l', index: 0 } });

		expect(resolvePlacement(el, binding, 0)).toBeUndefined();
	});

	it.each([
		['at top (0%)', 0],
		['in upper region (20%)', 20],
		['at exact threshold (40%)', 40],
	])('returns "before" when pointer is %s', (_label, clientY) => {
		const el = mockElement(100);
		const binding = dropzoneBinding({ sortable: { listId: 'l', index: 0 } });

		expect(resolvePlacement(el, binding, clientY)).toBe('before');
	});

	it.each([
		['at exact threshold (60%)', 60],
		['in lower region (80%)', 80],
		['at bottom (100%)', 100],
	])('returns "after" when pointer is %s', (_label, clientY) => {
		const el = mockElement(100);
		const binding = dropzoneBinding({ sortable: { listId: 'l', index: 0 } });

		expect(resolvePlacement(el, binding, clientY)).toBe('after');
	});

	it('preserves "before" in hysteresis zone (40-60%)', () => {
		const el = mockElement(100);
		const binding = dropzoneBinding({ sortable: { listId: 'l', index: 0 } });

		expect(resolvePlacement(el, binding, 50, 'before')).toBe('before');
	});

	it('preserves "after" in hysteresis zone (40-60%)', () => {
		const el = mockElement(100);
		const binding = dropzoneBinding({ sortable: { listId: 'l', index: 0 } });

		expect(resolvePlacement(el, binding, 50, 'after')).toBe('after');
	});

	it('returns undefined in hysteresis zone with no current placement', () => {
		const el = mockElement(100);
		const binding = dropzoneBinding({ sortable: { listId: 'l', index: 0 } });

		expect(resolvePlacement(el, binding, 50)).toBeUndefined();
	});

	it('works with non-zero top offset', () => {
		const el = mockElement(100, 200);
		const binding = dropzoneBinding({ sortable: { listId: 'l', index: 0 } });

		// clientY = 220, relativeY = 20 → upper 40% → 'before'
		expect(resolvePlacement(el, binding, 220)).toBe('before');
		// clientY = 280, relativeY = 80 → lower 40% → 'after'
		expect(resolvePlacement(el, binding, 280)).toBe('after');
	});
});

// ── buildDropState ──────────────────────────────────────────────────

describe('buildDropState', () => {
	const baseState: DragState<TestPayload> = {
		sourceId: 'item-1',
		payload: { id: '1' },
		sortable: { sourceListId: 'list-a', sourceIndex: 0 },
	};

	it('returns same reference when drag state has no sortable', () => {
		const state: DragState<TestPayload> = {
			sourceId: 'x',
			payload: { id: '1' },
		};
		const result = buildDropState(
			state,
			dropzoneBinding({ sortable: { listId: 'l', index: 0 } }),
		);

		expect(result).toBe(state);
	});

	it('returns same reference when zone has no sortable', () => {
		const result = buildDropState(baseState, dropzoneBinding());
		expect(result).toBe(baseState);
	});

	it('returns same reference when zone sortable has empty listId', () => {
		const result = buildDropState(
			baseState,
			dropzoneBinding({ sortable: { listId: '', index: 0 } }),
		);

		expect(result).toBe(baseState);
	});

	it('uses zone index as targetIndex for "before" placement', () => {
		const result = buildDropState(
			baseState,
			dropzoneBinding({ sortable: { listId: 'list-b', index: 2 } }),
			'before',
		);

		expect(result.sortable?.targetListId).toBe('list-b');
		expect(result.sortable?.targetIndex).toBe(2);
		expect(result.sortable?.placement).toBe('before');
	});

	it('increments zone index for "after" placement', () => {
		const result = buildDropState(
			baseState,
			dropzoneBinding({ sortable: { listId: 'list-b', index: 2 } }),
			'after',
		);

		expect(result.sortable?.targetIndex).toBe(3);
		expect(result.sortable?.placement).toBe('after');
	});

	it('does not set placement when none provided', () => {
		const result = buildDropState(
			baseState,
			dropzoneBinding({ sortable: { listId: 'list-b', index: 2 } }),
		);

		expect(result.sortable?.placement).toBeUndefined();
		expect(result.sortable?.targetIndex).toBe(2);
	});

	it('adjusts targetIndex for same-list reorder when source < target', () => {
		const state: DragState<TestPayload> = {
			sourceId: 'item-1',
			payload: { id: '1' },
			sortable: { sourceListId: 'list-a', sourceIndex: 0 },
		};

		// zone index 2, "after" → base 3, same-list adjustment → 2
		const result = buildDropState(
			state,
			dropzoneBinding({ sortable: { listId: 'list-a', index: 2 } }),
			'after',
		);

		expect(result.sortable?.targetIndex).toBe(2);
	});

	it('does not adjust targetIndex for cross-list', () => {
		const result = buildDropState(
			baseState,
			dropzoneBinding({ sortable: { listId: 'list-b', index: 2 } }),
			'after',
		);

		expect(result.sortable?.targetIndex).toBe(3);
	});

	it('does not adjust when source >= target in same list', () => {
		const state: DragState<TestPayload> = {
			sourceId: 'item-3',
			payload: { id: '3' },
			sortable: { sourceListId: 'list-a', sourceIndex: 3 },
		};

		const result = buildDropState(
			state,
			dropzoneBinding({ sortable: { listId: 'list-a', index: 1 } }),
			'before',
		);

		expect(result.sortable?.targetIndex).toBe(1);
	});

	it('defaults to index 0 when zone index is NaN', () => {
		const result = buildDropState(
			baseState,
			dropzoneBinding({ sortable: { listId: 'list-b', index: NaN } }),
		);

		expect(result.sortable?.targetIndex).toBe(0);
	});

	it('handles same-index same-list (no-op reorder)', () => {
		const state: DragState<TestPayload> = {
			sourceId: 'item-1',
			payload: { id: '1' },
			sortable: { sourceListId: 'list-a', sourceIndex: 1 },
		};

		const result = buildDropState(
			state,
			dropzoneBinding({ sortable: { listId: 'list-a', index: 1 } }),
			'before',
		);

		// index 1, "before" → 1, source (1) is NOT < target (1) → no adjustment
		expect(result.sortable?.targetIndex).toBe(1);
	});

	it('attaches dropPosition when provided', () => {
		const result = buildDropState(
			baseState,
			dropzoneBinding({ sortable: { listId: 'list-b', index: 2 } }),
			'before',
			{ zoneId: 'zone', x: 24, y: 40 },
		);

		expect(result.dropPosition).toEqual({ zoneId: 'zone', x: 24, y: 40 });
	});
});

// ── getDropzoneCoordinates ─────────────────────────────────────────

describe('getDropzoneCoordinates', () => {
	it('returns undefined when zone binding has empty id', () => {
		const element = mockElement(100);
		const result = getDropzoneCoordinates(
			element,
			dropzoneBinding({ id: '' }),
			50,
			60,
		);

		expect(result).toBeUndefined();
	});

	it('returns coordinates relative to zone top-left', () => {
		const element = mockElement(120, 200);
		vi.spyOn(element, 'getBoundingClientRect').mockReturnValue({
			x: 40,
			y: 200,
			width: 200,
			height: 120,
			top: 200,
			left: 40,
			right: 240,
			bottom: 320,
			toJSON: () => ({}),
		} as DOMRect);

		const result = getDropzoneCoordinates(
			element,
			dropzoneBinding({ id: 'zone-a' }),
			70,
			260,
		);

		expect(result).toEqual({ zoneId: 'zone-a', x: 30, y: 60 });
	});
});
