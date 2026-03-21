import {
	DndPayload,
	DropzoneCoordinates,
	DragState,
	DraggableBinding,
	DropzoneBinding,
	SortablePlacement,
} from './models';

/**
 * Converts viewport pointer coordinates into coordinates relative to a dropzone.
 */
export function getDropzoneCoordinates<Payload extends DndPayload>(
	element: HTMLElement,
	binding: DropzoneBinding<Payload>,
	clientX: number,
	clientY: number,
): DropzoneCoordinates | undefined {
	if (!binding.id) {
		return undefined;
	}

	const bounds = element.getBoundingClientRect();

	return {
		zoneId: binding.id,
		x: clientX - bounds.left,
		y: clientY - bounds.top,
	};
}

/**
 * Extracts sortable source metadata from a draggable binding.
 *
 * Returns `undefined` when the binding has no sortable config,
 * an empty `listId`, or a non-finite index.
 */
export function getSortableSource<Payload extends DndPayload>(
	binding: DraggableBinding<Payload>,
) {
	const sortableBinding = binding.sortable;

	if (!sortableBinding || !sortableBinding.listId) {
		return undefined;
	}

	if (!Number.isFinite(sortableBinding.index)) {
		return undefined;
	}

	return {
		sourceListId: sortableBinding.listId,
		sourceIndex: sortableBinding.index,
	};
}

/**
 * Determines whether the pointer is in the "before" or "after" region
 * of a sortable dropzone element.
 *
 * The element is divided into three zones:
 * - Top 40 %  → `'before'`
 * - Bottom 40 % → `'after'`
 * - Middle 20 % (hysteresis) → keeps `currentPlacement` to prevent flickering
 *
 * Returns `undefined` when the binding has no sortable config,
 * the element has zero height, or no placement can be resolved.
 */
export function resolvePlacement<Payload extends DndPayload>(
	element: HTMLElement,
	binding: DropzoneBinding<Payload>,
	clientY: number,
	currentPlacement?: SortablePlacement,
): SortablePlacement | undefined {
	if (!binding.sortable) {
		return undefined;
	}

	const bounds = element.getBoundingClientRect();

	if (bounds.height <= 0) {
		return undefined;
	}

	const relativeY = clientY - bounds.top;
	const beforeThreshold = bounds.height * 0.4;
	const afterThreshold = bounds.height * 0.6;

	if (relativeY <= beforeThreshold) {
		return 'before';
	}

	if (relativeY >= afterThreshold) {
		return 'after';
	}

	return currentPlacement;
}

/**
 * Builds the final {@link DragState} for a drop, enriching it with
 * sortable target metadata (target list, target index, placement).
 *
 * For same-list reorders where the source index is before the computed
 * target index, `targetIndex` is decremented by one to account for the
 * source item being removed first.
 *
 * Returns the original `state` unchanged when either side lacks sortable
 * metadata or the zone's `listId` is empty.
 */
export function buildDropState<Payload extends DndPayload>(
	state: DragState<Payload>,
	zoneBinding: DropzoneBinding<Payload>,
	placement?: SortablePlacement,
	dropPosition?: DropzoneCoordinates,
): DragState<Payload> {
	if (!state.sortable || !zoneBinding.sortable || !zoneBinding.sortable.listId) {
		if (!dropPosition) {
			return state;
		}

		return {
			...state,
			dropPosition,
		};
	}

	const baseTargetIndex = Number.isFinite(zoneBinding.sortable.index)
		? zoneBinding.sortable.index
		: 0;

	let targetIndex = placement === 'after' ? baseTargetIndex + 1 : baseTargetIndex;

	if (
		state.sortable.sourceListId === zoneBinding.sortable.listId &&
		state.sortable.sourceIndex < targetIndex
	) {
		targetIndex -= 1;
	}

	const nextSortable = {
		...state.sortable,
		targetListId: zoneBinding.sortable.listId,
		targetIndex,
	};

	if (placement) {
		nextSortable.placement = placement;
	}

	return {
		...state,
		sortable: nextSortable,
		dropPosition,
	};
}