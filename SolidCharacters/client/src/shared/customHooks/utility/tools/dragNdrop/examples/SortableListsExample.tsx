import { Component, createSignal, For, onCleanup } from 'solid-js';
import { createDnD } from '../tools/createDnD';

type Card = {
	id: string;
	label: string;
	points: number;
};

type DragPayload = {
	card: Card;
	draggedAt: string;
};

type ListId = 'zone-1' | 'zone-2';
type ListsState = Record<ListId, Card[]>;

type TransferRecord = {
	id: string;
	cardLabel: string;
	from: string;
	to: string;
	points: number;
	draggedAt: string;
};

const listIds: ListId[] = ['zone-1', 'zone-2'];

export const SortableListsExample: Component = () => {
	const [lists, setLists] = createSignal<ListsState>({
		'zone-1': [
			{ id: 'card-1', label: 'Alpha', points: 10 },
			{ id: 'card-2', label: 'Bravo', points: 20 },
		],
		'zone-2': [
			{ id: 'card-3', label: 'Charlie', points: 30 },
			{ id: 'card-4', label: 'Delta', points: 40 },
		],
	});

	const [transferLog, setTransferLog] = createSignal<TransferRecord[]>([]);

	const { dndDraggable, dndDropzone, destroy } = createDnD<DragPayload>({
		onDrop: (_, state) => {
			const sortable = state.sortable;

			if (!sortable?.targetListId || sortable.targetIndex === undefined) {
				return;
			}

			setLists((current) => {
				const sourceListId = sortable.sourceListId as ListId;
				const targetListId = sortable.targetListId as ListId;
				const next: ListsState = {
					'zone-1': [...current['zone-1']],
					'zone-2': [...current['zone-2']],
				};

				const sourceCards = next[sourceListId];
				const targetCards = next[targetListId];

				if (!sourceCards || !targetCards) {
					return current;
				}

				const sourceIndex = sourceCards.findIndex(
					(card) => card.id === state.payload.card.id,
				);

				if (sourceIndex === -1) {
					return current;
				}

				const [movedCard] = sourceCards.splice(sourceIndex, 1);
				const insertionIndex = Math.max(
					0,
					Math.min(sortable.targetIndex, targetCards.length),
				);
				targetCards.splice(insertionIndex, 0, movedCard);

				return next;
			});

			setTransferLog((current) => {
				const nextRecord: TransferRecord = {
					id: `${state.payload.card.id}-${Date.now()}`,
					cardLabel: state.payload.card.label,
					from: sortable.sourceListId,
					to: sortable.targetListId,
					points: state.payload.card.points,
					draggedAt: state.payload.draggedAt,
				};

				return [nextRecord, ...current].slice(0, 6);
			});
		},
	});

	onCleanup(() => destroy());

	const createCustomPreview = (label: string) => {
		const preview = document.createElement('div');
		preview.className = 'card';
		preview.textContent = `${label} (custom preview)`;
		return preview;
	};

	return (
		<section class="example-panel">
			<h2 class="example-title">Sortable lists example</h2>

			<div class="body">
				<For each={listIds}>
					{(listId) => (
						<div class={`column ${listId}`}>
							<h3 class="column-title">{listId}</h3>
							<div
								class="list-start"
								use:dndDropzone={{
									id: `${listId}-start`,
									sortable: { listId, index: 0 },
								}}
							>
								Drop to start
							</div>
							<For each={lists()[listId]}>
								{(item, index) => (
									<div
										class="card"
										use:dndDropzone={{
											id: `${listId}-${item.id}`,
											sortable: { listId, index: index() },
										}}
										use:dndDraggable={{
											id: item.id,
											getPayload: () => ({
												card: item,
												draggedAt: new Date().toLocaleTimeString(),
											}),
											sortable: { listId, index: index() },
											createDragPreview: () => createCustomPreview(item.label),
										}}
									>
										{item.label} • {item.points} pts
									</div>
								)}
							</For>

							<div
								class="list-end"
								use:dndDropzone={{
									id: `${listId}-end`,
									sortable: { listId, index: lists()[listId].length },
								}}
							>
								Drop to end
							</div>
						</div>
					)}
				</For>
			</div>

			<div class="transfer-panel">
				<h3 class="column-title">Payload transfer log</h3>
				<For each={transferLog()}>
					{(entry) => (
						<div class="transfer-row">
							<span>{entry.cardLabel}</span>
							<span>
								{entry.from} → {entry.to}
							</span>
							<span>{entry.points} pts</span>
							<span>{entry.draggedAt}</span>
						</div>
					)}
				</For>
				{transferLog().length === 0 && (
					<div class="transfer-empty">Drop a card to capture payload details.</div>
				)}
			</div>
		</section>
	);
};
