import {
	DnDConfig,
	DnDInstance,
	DndPayload,
	DragState,
	DraggableBinding,
	DropzoneBinding,
	SortablePlacement,
} from './models';
import { createPreviewManager } from './createDnD.preview';

export type DraggableRecord<Payload extends DndPayload> = {
	element: HTMLElement;
	getBinding: () => DraggableBinding<Payload>;
	pointerDown: (event: PointerEvent) => void;
};

export type DropzoneRecord<Payload extends DndPayload> = {
	element: HTMLElement;
	getBinding: () => DropzoneBinding<Payload>;
	pointerEnter: (event: PointerEvent) => void;
	pointerLeave: () => void;
};

export type PendingDrag<Payload extends DndPayload> = {
	startX: number;
	startY: number;
	element: HTMLElement;
	binding: DraggableBinding<Payload>;
	payload: Payload;
};

export type DnDMutableState<Payload extends DndPayload> = {
	activeDrag: DragState<Payload> | null;
	activeDraggable: HTMLElement | null;
	hoveredDropzone: HTMLElement | null;
	hoveredPlacement: SortablePlacement | undefined;
	pendingDrag: PendingDrag<Payload> | null;
	globalListenersActive: boolean;
};

export type DnDContext<Payload extends DndPayload> = {
	config: DnDConfig<Payload>;
	classes: {
		activeClassName: string;
		overClassName: string;
		insertBeforeClassName: string;
		insertAfterClassName: string;
	};
	dragThreshold: number;
	preview: ReturnType<typeof createPreviewManager>;
	draggables: Map<HTMLElement, DraggableRecord<Payload>>;
	dropzones: Map<HTMLElement, DropzoneRecord<Payload>>;
	state: DnDMutableState<Payload>;
};

export type DndDraggableDirective<Payload extends DndPayload> =
	DnDInstance<Payload>['dndDraggable'];
export type DndDropzoneDirective<Payload extends DndPayload> =
	DnDInstance<Payload>['dndDropzone'];

export function createDnDContext<Payload extends DndPayload>(
	config: DnDConfig<Payload>,
): DnDContext<Payload> {
	const activeClassName = config.activeClassName ?? 'dnd-active';
	const overClassName = config.overClassName ?? 'dnd-over';
	const previewClassName = config.previewClassName ?? 'dnd-preview';
	const insertBeforeClassName =
		config.insertBeforeClassName ?? 'dnd-insert-before';
	const insertAfterClassName = config.insertAfterClassName ?? 'dnd-insert-after';

	return {
		config,
		classes: {
			activeClassName,
			overClassName,
			insertBeforeClassName,
			insertAfterClassName,
		},
		dragThreshold: config.dragThreshold ?? 5,
		preview: createPreviewManager(previewClassName, config.previewZIndex),
		draggables: new Map(),
		dropzones: new Map(),
		state: {
			activeDrag: null,
			activeDraggable: null,
			hoveredDropzone: null,
			hoveredPlacement: undefined,
			pendingDrag: null,
			globalListenersActive: false,
		},
	};
}
