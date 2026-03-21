import { getDropzoneCoordinates } from './createDnD.logic';
import { getOwner, onCleanup } from 'solid-js';
import { DndPayload } from './models';
import { DnDContext, DndDropzoneDirective } from './createDnD.context';
import { EventController } from './createDnD.events';

export function createDropzoneDirective<Payload extends DndPayload>(
	context: DnDContext<Payload>,
	events: EventController<Payload>,
): DndDropzoneDirective<Payload> {
	const { state, dropzones, classes } = context;

	return (element, accessor) => {
		element.setAttribute('aria-roledescription', 'drop zone');

		const leaveCurrentZone = () => {
			if (!state.activeDrag || state.hoveredDropzone !== element) return;

			accessor().onDragLeave?.(state.activeDrag);
			events.removePlacementClasses(element);
			element.classList.remove(classes.overClassName);
			state.hoveredDropzone = null;
			state.hoveredPlacement = undefined;
		};

		const pointerEnter = (event: PointerEvent) => {
			if (!state.activeDrag) return;

			const binding = accessor();
			if (!binding || binding.disabled || !binding.id) return;

			if (state.hoveredDropzone && state.hoveredDropzone !== element) {
				const previousBinding = dropzones.get(state.hoveredDropzone)?.getBinding();
				previousBinding?.onDragLeave?.(state.activeDrag);
				events.removePlacementClasses(state.hoveredDropzone);
				state.hoveredDropzone.classList.remove(classes.overClassName);
			}

			const enteringNewZone = state.hoveredDropzone !== element;
			state.hoveredDropzone = element;
			element.classList.add(classes.overClassName);
			events.updatePlacementClasses(element, binding, event.clientY);

			state.activeDrag = {
				...state.activeDrag,
				position: getDropzoneCoordinates(
					element,
					binding,
					event.clientX,
					event.clientY,
				),
			};

			if (enteringNewZone) {
				binding.onDragEnter?.(state.activeDrag);
			}
		};

		const pointerLeave = () => leaveCurrentZone();
		element.addEventListener('pointerenter', pointerEnter);
		element.addEventListener('pointerleave', pointerLeave);

		dropzones.set(element, { element, getBinding: accessor, pointerEnter, pointerLeave });

		if (getOwner()) {
			onCleanup(() => {
				element.removeEventListener('pointerenter', pointerEnter);
				element.removeEventListener('pointerleave', pointerLeave);
				if (state.hoveredDropzone === element) {
					events.clearHoveredDropzone();
				}
				dropzones.delete(element);
			});
		}
	};
}

export function cleanupDropzoneElement(
	element: HTMLElement,
	pointerEnter: (event: PointerEvent) => void,
	pointerLeave: () => void,
	removePlacementClasses: (element: HTMLElement) => void,
	overClassName: string,
) {
	element.removeEventListener('pointerenter', pointerEnter);
	element.removeEventListener('pointerleave', pointerLeave);
	removePlacementClasses(element);
	element.classList.remove(overClassName);
	element.removeAttribute('aria-roledescription');
}
