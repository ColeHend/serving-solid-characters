import { DndPayload } from './models';
import { DnDContext } from './createDnD.context';
import { EventController } from './createDnD.events';
import { cleanupDraggableElement } from './createDnD.draggable';
import { cleanupDropzoneElement } from './createDnD.dropzone';

export function createDestroy<Payload extends DndPayload>(
	context: DnDContext<Payload>,
	events: EventController<Payload>,
) {
	const { draggables, dropzones, classes } = context;

	return () => {
		events.resetDragState();

		for (const record of draggables.values()) {
			cleanupDraggableElement(
				record.element,
				record.pointerDown,
				classes.activeClassName,
			);
		}

		for (const record of dropzones.values()) {
			cleanupDropzoneElement(
				record.element,
				record.pointerEnter,
				record.pointerLeave,
				events.removePlacementClasses,
				classes.overClassName,
			);
		}

		draggables.clear();
		dropzones.clear();
	};
}
