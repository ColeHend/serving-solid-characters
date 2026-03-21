import { resolvePlacement } from './createDnD.logic';
import { DndPayload, DropzoneBinding } from './models';
import { DnDContext } from './createDnD.context';

export function createHoverHelpers<Payload extends DndPayload>(
	context: DnDContext<Payload>,
) {
	const { state, classes } = context;

	const removePlacementClasses = (element: HTMLElement) => {
		element.classList.remove(classes.insertBeforeClassName);
		element.classList.remove(classes.insertAfterClassName);
	};

	const updatePlacementClasses = (
		element: HTMLElement,
		binding: DropzoneBinding<Payload>,
		clientY?: number,
	) => {
		const previousPlacement = state.hoveredPlacement;
		removePlacementClasses(element);
		state.hoveredPlacement = undefined;
		if (clientY === undefined) return;

		const placement = resolvePlacement(element, binding, clientY, previousPlacement);
		if (!placement) return;

		state.hoveredPlacement = placement;
		element.classList.add(
			placement === 'before'
				? classes.insertBeforeClassName
				: classes.insertAfterClassName,
		);
	};

	const clearHoveredDropzone = () => {
		if (state.hoveredDropzone) {
			removePlacementClasses(state.hoveredDropzone);
			state.hoveredDropzone.classList.remove(classes.overClassName);
			state.hoveredDropzone = null;
		}

		if (state.activeDrag?.position) {
			state.activeDrag = { ...state.activeDrag, position: undefined };
		}

		state.hoveredPlacement = undefined;
	};

	return {
		removePlacementClasses,
		updatePlacementClasses,
		clearHoveredDropzone,
	};
}
