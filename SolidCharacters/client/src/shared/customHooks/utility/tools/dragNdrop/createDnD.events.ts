import { buildDropState, getDropzoneCoordinates, getSortableSource } from './createDnD.logic';
import { DndPayload, DragState, DropzoneBinding } from './models';
import { DnDContext, PendingDrag } from './createDnD.context';
import { createHoverHelpers } from './createDnD.hover';

export type EventController<Payload extends DndPayload> = {
	removePlacementClasses: (element: HTMLElement) => void;
	updatePlacementClasses: (
		element: HTMLElement,
		binding: DropzoneBinding<Payload>,
		clientY?: number,
	) => void;
	clearHoveredDropzone: () => void;
	addGlobalListeners: () => void;
	removeGlobalListeners: () => void;
	activateDrag: (pending: PendingDrag<Payload>, event: PointerEvent) => void;
	resetDragState: (dragState?: DragState<Payload> | null) => void;
	cancelPendingDrag: () => void;
	cancelActiveDrag: () => void;
	onPointerMove: (event: PointerEvent) => void;
	onPointerUp: (event: PointerEvent) => void;
	onPointerCancel: () => void;
	onKeyDown: (event: KeyboardEvent) => void;
};

export function createEventController<Payload extends DndPayload>(
	context: DnDContext<Payload>,
): EventController<Payload> {
	const { state, config, classes, preview, draggables, dropzones, dragThreshold } = context;
	const { removePlacementClasses, updatePlacementClasses, clearHoveredDropzone } =
		createHoverHelpers(context);

	const getDropzoneFromPoint = (clientX: number, clientY: number) => {
		if (typeof document.elementFromPoint === 'function') {
			let current: Element | null = document.elementFromPoint(clientX, clientY);
			while (current) {
				if (current instanceof HTMLElement && dropzones.has(current)) {
					return current;
				}
				current = current.parentElement;
			}
		}

		for (const [element] of dropzones) {
			const bounds = element.getBoundingClientRect();
			if (
				clientX >= bounds.left &&
				clientX <= bounds.right &&
				clientY >= bounds.top &&
				clientY <= bounds.bottom
			) {
				return element;
			}
		}

		return null;
	};

	const applyHoveredDropzoneFromPoint = (event: PointerEvent) => {
		if (!state.activeDrag) return;

		const nextZone = getDropzoneFromPoint(event.clientX, event.clientY);
		const previousZone = state.hoveredDropzone;

		if (previousZone && previousZone !== nextZone) {
			const previousBinding = dropzones.get(previousZone)?.getBinding();
			previousBinding?.onDragLeave?.(state.activeDrag);
			removePlacementClasses(previousZone);
			previousZone.classList.remove(classes.overClassName);
			state.hoveredDropzone = null;
			state.hoveredPlacement = undefined;
		}

		if (!nextZone) {
			if (state.activeDrag.position) {
				state.activeDrag = {
					...state.activeDrag,
					position: undefined,
				};
			}
			return;
		}

		const binding = dropzones.get(nextZone)?.getBinding();
		if (!binding || binding.disabled || !binding.id) {
			if (state.activeDrag.position) {
				state.activeDrag = {
					...state.activeDrag,
					position: undefined,
				};
			}
			return;
		}

		const enteringNewZone = state.hoveredDropzone !== nextZone;
		state.hoveredDropzone = nextZone;
		nextZone.classList.add(classes.overClassName);
		updatePlacementClasses(nextZone, binding, event.clientY);

		state.activeDrag = {
			...state.activeDrag,
			position: getDropzoneCoordinates(nextZone, binding, event.clientX, event.clientY),
		};

		if (enteringNewZone) {
			binding.onDragEnter?.(state.activeDrag);
		}
	};

	const addGlobalListeners = () => {
		if (state.globalListenersActive) return;
		state.globalListenersActive = true;
		document.addEventListener('pointermove', onPointerMove);
		document.addEventListener('pointerup', onPointerUp);
		document.addEventListener('pointercancel', onPointerCancel);
		document.addEventListener('keydown', onKeyDown);
	};

	const removeGlobalListeners = () => {
		if (!state.globalListenersActive) return;
		state.globalListenersActive = false;
		document.removeEventListener('pointermove', onPointerMove);
		document.removeEventListener('pointerup', onPointerUp);
		document.removeEventListener('pointercancel', onPointerCancel);
		document.removeEventListener('keydown', onKeyDown);
	};

	const resetDragState = (dragState: DragState<Payload> | null = state.activeDrag) => {
		if (state.activeDraggable && dragState) {
			draggables.get(state.activeDraggable)?.getBinding().onDragEnd?.(dragState);
		}

		if (state.activeDraggable) {
			state.activeDraggable.classList.remove(classes.activeClassName);
			state.activeDraggable.setAttribute('aria-grabbed', 'false');
		}

		clearHoveredDropzone();
		preview.remove();
		state.activeDrag = null;
		state.activeDraggable = null;
		state.pendingDrag = null;
		removeGlobalListeners();
	};

	const activateDrag = (pending: PendingDrag<Payload>, event: PointerEvent) => {
		const sourceBounds = pending.element.getBoundingClientRect();

		state.activeDrag = {
			sourceId: pending.binding.id,
			payload: pending.payload,
			pointerOffset: {
				x: pending.startX - sourceBounds.left,
				y: pending.startY - sourceBounds.top,
			},
			sortable: getSortableSource(pending.binding),
		};

		state.activeDraggable = pending.element;
		pending.element.classList.add(classes.activeClassName);
		pending.element.setAttribute('aria-grabbed', 'true');

		preview.mount({
			sourceElement: pending.element,
			binding: pending.binding,
			state: state.activeDrag,
			event,
		});

		pending.binding.onDragStart?.(state.activeDrag);
		state.pendingDrag = null;
	};

	const cancelPendingDrag = () => {
		state.pendingDrag = null;
		removeGlobalListeners();
	};

	const cancelActiveDrag = () => {
		if (state.activeDrag) {
			config.onDragCancel?.(state.activeDrag);
		}
		resetDragState();
	};

	const onPointerMove = (event: PointerEvent) => {
		if (state.pendingDrag && !state.activeDrag) {
			const dx = event.clientX - state.pendingDrag.startX;
			const dy = event.clientY - state.pendingDrag.startY;
			if (dx * dx + dy * dy >= dragThreshold * dragThreshold) {
				activateDrag(state.pendingDrag, event);
			} else {
				return;
			}
		}

		if (!state.activeDrag) return;
		preview.updatePosition(event.clientX, event.clientY);
		applyHoveredDropzoneFromPoint(event);
	};

	const onPointerUp = (event: PointerEvent) => {
		if (state.pendingDrag && !state.activeDrag) {
			cancelPendingDrag();
			return;
		}

		if (state.activeDrag) {
			applyHoveredDropzoneFromPoint(event);
		}

		const dragState = state.activeDrag;
		const zoneElement = state.hoveredDropzone;
		if (!dragState || !zoneElement) {
			if (dragState) {
				config.onInvalidDrop?.({
					sourceId: dragState.sourceId,
					payload: dragState.payload,
					sortable: dragState.sortable,
				});
			}
			resetDragState(dragState);
			return;
		}

		const zoneBinding = dropzones.get(zoneElement)?.getBinding();
		if (!zoneBinding || !zoneBinding.id || zoneBinding.disabled) {
			config.onInvalidDrop?.({
				sourceId: dragState.sourceId,
				payload: dragState.payload,
				sortable: dragState.sortable,
			});
			resetDragState(dragState);
			return;
		}

		const dropState = buildDropState(
			dragState,
			zoneBinding,
			state.hoveredPlacement,
			getDropzoneCoordinates(zoneElement, zoneBinding, event.clientX, event.clientY),
		);

		if (zoneBinding.accepts && !zoneBinding.accepts(dropState)) {
			config.onInvalidDrop?.({
				sourceId: dropState.sourceId,
				payload: dropState.payload,
				sortable: dropState.sortable,
			});
			resetDragState(dropState);
			return;
		}

		state.activeDrag = dropState;
		zoneBinding.onDrop?.(dropState);
		config.onDrop?.(zoneBinding.id, dropState);
		resetDragState(dropState);
	};

	const onPointerCancel = () => {
		if (state.pendingDrag && !state.activeDrag) {
			cancelPendingDrag();
			return;
		}
		cancelActiveDrag();
	};

	const onKeyDown = (event: KeyboardEvent) => {
		if (event.key !== 'Escape') return;
		if (state.pendingDrag && !state.activeDrag) {
			cancelPendingDrag();
			return;
		}
		if (state.activeDrag) cancelActiveDrag();
	};

	return {
		removePlacementClasses,
		updatePlacementClasses,
		clearHoveredDropzone,
		addGlobalListeners,
		removeGlobalListeners,
		activateDrag,
		resetDragState,
		cancelPendingDrag,
		cancelActiveDrag,
		onPointerMove,
		onPointerUp,
		onPointerCancel,
		onKeyDown,
	};
}
