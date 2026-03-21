import { DndPayload, DragState, DraggableBinding } from './models';

type PreviewOffset = { x: number; y: number };

type MountContext<Payload extends DndPayload> = {
	sourceElement: HTMLElement;
	binding: DraggableBinding<Payload>;
	state: DragState<Payload>;
	event: PointerEvent;
};

/**
 * Creates a manager for the floating drag preview element.
 *
 * @param previewClassName - CSS class added to the preview element.
 * @param zIndex - CSS `z-index` for the preview (default `1000`).
 */
export function createPreviewManager(
	previewClassName: string,
	zIndex: string | number = 1000,
) {
	let activePreview: HTMLElement | null = null;
	let previewOffset: PreviewOffset | null = null;

	/** Creates a shallow clone of the source element styled as a drag ghost. */
	const createDefaultPreview = (element: HTMLElement) => {
		const preview = element.cloneNode(true) as HTMLElement;
		const sourceRect = element.getBoundingClientRect();

		preview.style.opacity = '0.7';
		preview.style.boxSizing = 'border-box';

		if (sourceRect.width > 0) {
			preview.style.width = `${sourceRect.width}px`;
		}

		if (sourceRect.height > 0) {
			preview.style.height = `${sourceRect.height}px`;
		}

		return preview;
	};

	/** Removes the active preview from the DOM and resets internal state. */
	const remove = () => {
		if (activePreview?.parentNode) {
			activePreview.parentNode.removeChild(activePreview);
		}

		activePreview = null;
		previewOffset = null;
	};

	/** Repositions the preview element to follow the pointer. */
	const updatePosition = (clientX: number, clientY: number) => {
		if (!activePreview || !previewOffset) {
			return;
		}

		activePreview.style.left = `${clientX - previewOffset.x}px`;
		activePreview.style.top = `${clientY - previewOffset.y}px`;
	};

	/**
	 * Creates (or replaces) the drag preview and appends it to `document.body`.
	 * Uses the binding's `createDragPreview` when provided, falling back to a
	 * cloned ghost of the source element.
	 */
	const mount = <Payload extends DndPayload>(context: MountContext<Payload>) => {
		remove();

		const { sourceElement, binding, state, event } = context;

		let preview =
			binding.createDragPreview?.({
				state,
				sourceElement,
			}) ?? createDefaultPreview(sourceElement);

		if (!(preview instanceof HTMLElement)) {
			preview = createDefaultPreview(sourceElement);
		}

		if (preview.isConnected) {
			preview = preview.cloneNode(true) as HTMLElement;
		}

		const sourceRect = sourceElement.getBoundingClientRect();
		previewOffset = {
			x: event.clientX - sourceRect.left,
			y: event.clientY - sourceRect.top,
		};

		preview.classList.add(previewClassName);
		preview.style.position = 'fixed';
		preview.style.pointerEvents = 'none';
		preview.style.margin = '0';
		preview.style.zIndex = String(zIndex);

		activePreview = preview;
		document.body.appendChild(preview);
		updatePosition(event.clientX, event.clientY);
	};

	return {
		mount,
		remove,
		updatePosition,
	};
}