import { getOwner, onCleanup } from 'solid-js';
import { DndPayload } from './models';
import { DnDContext, DndDraggableDirective } from './createDnD.context';
import { EventController } from './createDnD.events';

export function createDraggableDirective<Payload extends DndPayload>(
	context: DnDContext<Payload>,
	events: EventController<Payload>,
): DndDraggableDirective<Payload> {
	const { state, draggables, classes, dragThreshold } = context;

	return (element, accessor) => {
		element.style.touchAction = 'none';
		element.setAttribute('aria-roledescription', 'draggable');
		element.setAttribute('aria-grabbed', 'false');

		const pointerDown = (event: PointerEvent) => {
			event.preventDefault();
			const binding = accessor();

			if (!binding || !binding.id || binding.disabled) return;
			const payload = binding.getPayload?.();
			if (!payload) return;

			state.pendingDrag = {
				startX: event.clientX,
				startY: event.clientY,
				element,
				binding,
				payload,
			};

			events.addGlobalListeners();
			if (dragThreshold <= 0) {
				events.activateDrag(state.pendingDrag, event);
			}
		};

		element.addEventListener('pointerdown', pointerDown);
		draggables.set(element, { element, getBinding: accessor, pointerDown });

		if (getOwner()) {
			onCleanup(() => {
				element.removeEventListener('pointerdown', pointerDown);
				if (state.activeDraggable === element) {
					events.resetDragState();
				}
				draggables.delete(element);
			});
		}
	};
}

export function cleanupDraggableElement(
	element: HTMLElement,
	pointerDown: (event: PointerEvent) => void,
	activeClassName: string,
) {
	element.removeEventListener('pointerdown', pointerDown);
	element.classList.remove(activeClassName);
	element.removeAttribute('aria-grabbed');
	element.removeAttribute('aria-roledescription');
	element.style.touchAction = '';
}
