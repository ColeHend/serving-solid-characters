import { DnDConfig, DnDInstance, DndPayload } from './models';
import { createDnDContext } from './createDnD.context';
import { createEventController } from './createDnD.events';
import { createDraggableDirective } from './createDnD.draggable';
import { createDropzoneDirective } from './createDnD.dropzone';
import { createDestroy } from './createDnD.destroy';

export function createDnD<Payload extends DndPayload>(
	config: DnDConfig<Payload> = {},
): DnDInstance<Payload> {
	const context = createDnDContext(config);
	const events = createEventController(context);

	return {
		dndDraggable: createDraggableDirective(context, events),
		dndDropzone: createDropzoneDirective(context, events),
		getActiveDrag: () => context.state.activeDrag,
		destroy: createDestroy(context, events),
	};
}