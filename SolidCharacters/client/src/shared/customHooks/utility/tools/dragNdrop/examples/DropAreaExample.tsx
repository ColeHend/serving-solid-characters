import { Component, createSignal, For, onCleanup } from 'solid-js';
import { createDnD } from '../tools/createDnD';

type DropAreaItem = { id: string; label: string };
type DropAreaPayload = { item: DropAreaItem; draggedAt: string };
type DropAreaRecord = {
	id: string;
	itemLabel: string;
	draggedAt: string;
	droppedX?: number;
	droppedY?: number;
};
type DroppedAreaItem = {
	id: string;
	label: string;
	droppedAt: string;
	x: number;
	y: number;
};
type DropAreaMoveState = {
	id: string;
	offsetX: number;
	offsetY: number;
	width: number;
	height: number;
};

const dropAreaItems: DropAreaItem[] = [
	{ id: 'drop-item-1', label: 'Invoice.pdf' },
	{ id: 'drop-item-2', label: 'Roadmap.md' },
	{ id: 'drop-item-3', label: 'Design.spec' },
];

export const DropAreaExample: Component = () => {
	const [dropAreaLog, setDropAreaLog] = createSignal<DropAreaRecord[]>([]);
	const [droppedAreaItems, setDroppedAreaItems] = createSignal<DroppedAreaItem[]>([]);
	const [movingDropItemId, setMovingDropItemId] = createSignal<string | null>(null);

	let dropAreaElement: HTMLDivElement | undefined;
	let activeDropMove: DropAreaMoveState | null = null;

	const { dndDraggable, dndDropzone, destroy } = createDnD<DropAreaPayload>({
		onDrop: (_, state) => {
			const { dropPosition } = state;
			if (!dropPosition) return;
			const droppedAt = new Date().toLocaleTimeString();
			const nextX = dropPosition.x - (state.pointerOffset?.x ?? 0);
			const nextY = dropPosition.y - (state.pointerOffset?.y ?? 0);

			setDroppedAreaItems((current) => {
				const nextItem: DroppedAreaItem = {
					id: `${state.payload.item.id}-${Date.now()}`,
					label: state.payload.item.label,
					droppedAt,
					x: nextX,
					y: nextY,
				};
				return [nextItem, ...current].slice(0, 8);
			});

			setDropAreaLog((current) => {
				const nextRecord: DropAreaRecord = {
					id: `${state.payload.item.id}-${Date.now()}`,
					itemLabel: state.payload.item.label,
					draggedAt: state.payload.draggedAt,
					droppedX: nextX,
					droppedY: nextY,
				};
				return [nextRecord, ...current].slice(0, 6);
			});
		},
	});

	const clamp = (value: number, min: number, max: number) =>
		max < min ? min : Math.min(Math.max(value, min), max);

	const onDropItemPointerMove = (moveEvent: PointerEvent) => {
		if (!activeDropMove || !dropAreaElement) return;

		const areaBounds = dropAreaElement.getBoundingClientRect();
		const nextX = clamp(
			moveEvent.clientX - areaBounds.left - activeDropMove.offsetX,
			0,
			areaBounds.width - activeDropMove.width,
		);
		const nextY = clamp(
			moveEvent.clientY - areaBounds.top - activeDropMove.offsetY,
			0,
			areaBounds.height - activeDropMove.height,
		);

		setDroppedAreaItems((current) =>
			current.map((item) =>
				item.id === activeDropMove?.id ? { ...item, x: nextX, y: nextY } : item,
			),
		);
	};

	const detachDropItemMoveListeners = () => {
		document.removeEventListener('pointermove', onDropItemPointerMove);
		document.removeEventListener('pointerup', stopMovingDroppedItem);
		document.removeEventListener('pointercancel', stopMovingDroppedItem);
	};

	const stopMovingDroppedItem = () => {
		activeDropMove = null;
		setMovingDropItemId(null);
		detachDropItemMoveListeners();
	};

	const startMovingDroppedItem = (id: string, downEvent: PointerEvent) => {
		if (!dropAreaElement) return;
		downEvent.preventDefault();
		downEvent.stopPropagation();

		const target = downEvent.currentTarget as HTMLElement | null;
		if (!target) return;

		const itemBounds = target.getBoundingClientRect();
		activeDropMove = {
			id,
			offsetX: downEvent.clientX - itemBounds.left,
			offsetY: downEvent.clientY - itemBounds.top,
			width: itemBounds.width,
			height: itemBounds.height,
		};

		setMovingDropItemId(id);
		detachDropItemMoveListeners();
		document.addEventListener('pointermove', onDropItemPointerMove);
		document.addEventListener('pointerup', stopMovingDroppedItem);
		document.addEventListener('pointercancel', stopMovingDroppedItem);
	};

	onCleanup(() => {
		stopMovingDroppedItem();
		destroy();
	});

	return (
		<section class="example-panel">
			<h2 class="example-title">Just drop area example</h2>
			<div class="drop-example">
				<div class="drop-source-panel">
					<h3 class="column-title">Draggable items</h3>
					<For each={dropAreaItems}>
						{(item) => (
							<div
								class="card"
								use:dndDraggable={{
									id: item.id,
									getPayload: () => ({ item, draggedAt: new Date().toLocaleTimeString() }),
								}}
							>
								{item.label}
							</div>
						)}
					</For>
				</div>

				<div class="drop-area" ref={dropAreaElement} use:dndDropzone={{ id: 'drop-area' }}>
					{droppedAreaItems().length === 0 && <div class="drop-area-empty">Drop here</div>}
					<For each={droppedAreaItems()}>
						{(item) => (
							<div
								class={`card drop-area-card${movingDropItemId() === item.id ? ' is-moving' : ''}`}
								style={{ left: `${item.x}px`, top: `${item.y}px` }}
								onPointerDown={(event) => startMovingDroppedItem(item.id, event)}
							>
								<span>{item.label}</span>
								<span>{item.droppedAt}</span>
							</div>
						)}
					</For>
				</div>

				<div class="transfer-panel drop-log-panel">
					<h3 class="column-title">Drop history</h3>
					<For each={dropAreaLog()}>
						{(entry) => (
							<div class="transfer-row drop-log-row">
								<span>{entry.itemLabel}</span>
								<span>Dropped in area</span>
								<span>
									{entry.droppedX !== undefined && entry.droppedY !== undefined
										? `${Math.round(entry.droppedX)}, ${Math.round(entry.droppedY)}`
										: 'n/a'}
								</span>
								<span>{entry.draggedAt}</span>
							</div>
						)}
					</For>
					{dropAreaLog().length === 0 && (
						<div class="transfer-empty">Drop any item in the area to log it.</div>
					)}
				</div>
			</div>
		</section>
	);
};
