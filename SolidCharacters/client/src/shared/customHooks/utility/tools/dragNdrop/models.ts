/** Base constraint for drag payloads — must be an object. */
export type DndPayload = object;

/** Coordinates relative to a dropzone's top-left corner. */
export interface DropzoneCoordinates {
	zoneId: string;
	x: number;
	y: number;
}

/** Where a sortable item should be inserted relative to a dropzone element. */
export type SortablePlacement = 'before' | 'after';

/** Sortable metadata carried on a {@link DragState} during a drag operation. */
export interface SortableDragMeta {
	sourceListId: string;
	sourceIndex: number;
	targetListId?: string;
	targetIndex?: number;
	placement?: SortablePlacement;
}

/** Sortable metadata attached to a draggable binding to identify its list position. */
export interface SortableDraggableBinding {
	listId: string;
	index: number;
}

/** Sortable metadata attached to a dropzone binding to identify its list position. */
export interface SortableDropzoneBinding {
	listId: string;
	index: number;
}

/** Snapshot of the current drag operation, passed to all drag/drop callbacks. */
export interface DragState<Payload extends DndPayload> {
	sourceId: string;
	payload: Payload;
	pointerOffset?: {
		x: number;
		y: number;
	};
	sortable?: SortableDragMeta;
	position?: DropzoneCoordinates;
	dropPosition?: DropzoneCoordinates;
}

/** Context provided to a custom drag preview factory. */
export interface DragPreviewContext<Payload extends DndPayload> {
	state: DragState<Payload>;
	sourceElement: HTMLElement;
}

/** Per-element binding for a draggable directive. */
export interface DraggableBinding<Payload extends DndPayload> {
	id: string;
	getPayload: () => Payload;
	disabled?: boolean;
	sortable?: SortableDraggableBinding;
	createDragPreview?: (
		context: DragPreviewContext<Payload>,
	) => HTMLElement;
	onDragStart?: (state: DragState<Payload>) => void;
	onDragEnd?: (state: DragState<Payload>) => void;
}

/** Per-element binding for a dropzone directive. */
export interface DropzoneBinding<Payload extends DndPayload> {
	id: string;
	disabled?: boolean;
	sortable?: SortableDropzoneBinding;
	accepts?: (state: DragState<Payload>) => boolean;
	onDrop?: (state: DragState<Payload>) => void;
	onDragEnter?: (state: DragState<Payload>) => void;
	onDragLeave?: (state: DragState<Payload>) => void;
}

/**
 * Configuration for a {@link createDnD} instance.
 *
 * All class-name options default to their `dnd-*` counterparts in CSS.
 */
export interface DnDConfig<Payload extends DndPayload> {
	/** Class added to the active draggable element (default `'dnd-active'`). */
	activeClassName?: string;
	/** Class added to the hovered dropzone element (default `'dnd-over'`). */
	overClassName?: string;
	/** Class added to the drag preview element (default `'dnd-preview'`). */
	previewClassName?: string;
	/** Class for "insert before" sortable indicator (default `'dnd-insert-before'`). */
	insertBeforeClassName?: string;
	/** Class for "insert after" sortable indicator (default `'dnd-insert-after'`). */
	insertAfterClassName?: string;
	/**
	 * Minimum pointer movement in pixels before a drag activates (default `5`).
	 * Set to `0` to activate immediately on pointerdown.
	 */
	dragThreshold?: number;
	/**
	 * CSS `z-index` applied to the drag preview element (default `1000`).
	 * Pass a number or string (e.g. `'9999'`).
	 */
	previewZIndex?: number | string;
	/** Called when a drop is accepted by a zone. */
	onDrop?: (targetId: string, state: DragState<Payload>) => void;
	/** Called when a drop is rejected or lands outside any zone. */
	onInvalidDrop?: (state: DragState<Payload>) => void;
	/** Called when a drag is cancelled via Escape or pointercancel. */
	onDragCancel?: (state: DragState<Payload>) => void;
}

/** Public API returned by {@link createDnD}. */
export interface DnDInstance<Payload extends DndPayload> {
	dndDraggable: (
		element: HTMLElement,
		accessor: () => DraggableBinding<Payload>,
	) => void;
	dndDropzone: (
		element: HTMLElement,
		accessor: () => DropzoneBinding<Payload>,
	) => void;
	getActiveDrag: () => DragState<Payload> | null;
	destroy: () => void;
}

/*
 * Note: The module augmentation below uses the base `DndPayload` type for
 * `JSX.Directives`. This is a known Solid limitation — the generic narrowing
 * from `createDnD<MyType>()` does NOT flow through to `use:dndDraggable` in
 * JSX, so TypeScript won't flag payload type mismatches at the call site.
 * Runtime behavior is still correct; this only affects static type checking.
 */
declare module 'solid-js' {
	namespace JSX {
		interface Directives {
			dndDraggable: DraggableBinding<DndPayload>;
			dndDropzone: DropzoneBinding<DndPayload>;
		}
	}
}