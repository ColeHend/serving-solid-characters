/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, For, Show, createSignal } from "solid-js";
import styles from "./Exporting.module.scss";
import { characterManager, homebrewManager, isNullish } from "../../../shared";
import { Button, Input, Modal, Icon } from "coles-solid-library";
import { DragIndicator } from "coles-solid-library/icons";
import { Trade } from "../../../models/trade.model";
import { createStore } from "solid-js/store";
import { downloadObjectAsJson } from "../../../shared/customHooks/utility/tools/downloadObjectAsJson";
import { FlatCard } from "../../../shared/components/flatCard/flatCard";
import {
  DragDropProvider,
  DragOverlay,
  createDraggable,
  createDroppable,
  pointerWithin,
  type DragEndEvent,
  type DefaultDataMap,
} from "../../../shared/dnd";

// Each export category, driven from one config instead of 7 duplicated blocks.
type Category = { key: keyof Trade; label: string; source: () => any[] };
// Drag payload: the item, which category it belongs to, and which list it came
// from. Drop payload: which list it was dropped on.
type ExportDrag = { key: keyof Trade; item: any; from: Zone };
type ExportDrop = { zone: Zone };
type Zone = "available" | "active";

const Exporting: Component = () => {
  // Single source of truth. The "available" list is derived (source minus this),
  // so adding/removing here moves items between both panels automatically.
  const [exportObject, setExportObject] = createStore<Trade>({
    spells: [],
    feats: [],
    srdclasses: [],
    srdSubclasses: [],
    backgrounds: [],
    items: [],
    races: [],
    subraces: [],
    characters: [],
  });

  const CATEGORIES: Category[] = [
    { key: "spells", label: "Spells", source: () => homebrewManager.spells() },
    { key: "feats", label: "Feats", source: () => homebrewManager.feats() },
    { key: "srdclasses", label: "Classes", source: () => homebrewManager.classes() },
    { key: "srdSubclasses", label: "Subclasses", source: () => homebrewManager.subclasses() },
    { key: "backgrounds", label: "Backgrounds", source: () => homebrewManager.backgrounds() },
    { key: "items", label: "Items", source: () => homebrewManager.items() },
    { key: "races", label: "Races", source: () => homebrewManager.races() },
    { key: "subraces", label: "subraces", source: () => homebrewManager.subraces()},
    { key: "characters", label: "Characters", source: () => characterManager.characters() },
  ];

  // Feats carry their name under `details.name`; everything else uses `name`.
  // One accessor for both the label and the dedupe comparator keeps them in sync.
  const itemName = (key: keyof Trade, item: any): string =>
    key === "feats" ? item?.details?.name ?? "" : item?.name ?? "";

  const isInExport = (key: keyof Trade, item: any): boolean =>
    (exportObject[key] as any[]).some((x) => itemName(key, x) === itemName(key, item));

  const availableItems = (cat: Category) =>
    cat.source().filter((i) => !isInExport(cat.key, i));
  const activeItems = (cat: Category) => exportObject[cat.key] as any[];

  const addToExport = (key: keyof Trade, item: any) =>
    (setExportObject as any)(key, (arr: any[]) => [...arr, item]);
  const removeFromExport = (key: keyof Trade, item: any) =>
    (setExportObject as any)(key, (arr: any[]) =>
      arr.filter((x) => itemName(key, x) !== itemName(key, item)),
    );

  const onDragEnd = (e: DragEndEvent<DefaultDataMap>) => {
    const over = e.over?.data as ExportDrop | undefined;
    if (!over) return; // dropped outside a list → no-op
    const data = e.active.data as ExportDrag;
    if (over.zone === "active" && data.from === "available") addToExport(data.key, data.item);
    else if (over.zone === "available" && data.from === "active") removeFromExport(data.key, data.item);
  };

  const exportToObject = () => {
    const userInput = document.getElementById("confirm-name") as HTMLInputElement;
    if (!isNullish(userInput)) {
      downloadObjectAsJson(exportObject, userInput.value);
    }
  };

  const [showConfirm, setShowConfirm] = createSignal<boolean>(false);

  // A draggable item row. Rendered inside the provider so createDraggable resolves
  // the drag context. Dragging is restricted to the handle (`handleRef`).
  const ItemCard: Component<{ cat: Category; item: any; from: Zone }> = (p) => {
    const drag = createDraggable(() => ({
      id: `${p.from}:${String(p.cat.key)}:${itemName(p.cat.key, p.item)}`,
      type: "exportItem",
      data: { key: p.cat.key, item: p.item, from: p.from } as ExportDrag,
    }));
    return (
      <div ref={drag.ref} class={styles.itemCard} classList={{ [styles.dragging]: drag.isActive() }}>
        <span ref={drag.handleRef} class={styles.itemHandle} aria-label="Drag item">
          <Icon icon={DragIndicator} />
        </span>
        <span class={styles.itemLabel}>{itemName(p.cat.key, p.item)}</span>
      </div>
    );
  };

  // One list panel, itself a drop target. Categories with no items collapse away;
  // an empty panel shows a hint instead.
  const Panel: Component<{ zone: Zone; title: string }> = (p) => {
    const drop = createDroppable(() => ({
      id: p.zone,
      type: "panel",
      data: { zone: p.zone } as ExportDrop,
    }));
    const itemsFor = (cat: Category) =>
      p.zone === "available" ? availableItems(cat) : activeItems(cat);
    const isEmpty = () => CATEGORIES.every((cat) => itemsFor(cat).length === 0);
    return (
      <div ref={drop.ref} class={styles.panel} classList={{ [styles.panelOver]: drop.isOver() }}>
        <h2 class={styles.panelHeader}>{p.title}</h2>
        <div class={styles.list}>
          <Show
            when={!isEmpty()}
            fallback={
              <div class={styles.emptyHint}>
                {p.zone === "available" ? "Nothing left to add" : "Drag items here to export"}
              </div>
            }
          >
            <For each={CATEGORIES}>
              {(cat) => (
                <Show when={itemsFor(cat).length > 0}>
                  <FlatCard headerName={cat.label} startOpen transparent>
                    <div class={styles.categoryItems}>
                      <For each={itemsFor(cat)}>
                        {(item) => <ItemCard cat={cat} item={item} from={p.zone} />}
                      </For>
                    </div>
                  </FlatCard>
                </Show>
              )}
            </For>
          </Show>
        </div>
      </div>
    );
  };

  return (
    <DragDropProvider
      collisionDetection={pointerWithin}
      onDragEnd={onDragEnd}
      announcements={{
        onDragStart: (e) => {
          const d = e.active.data as ExportDrag | undefined;
          return d ? `Picked up ${itemName(d.key, d.item)}.` : "Picked up item.";
        },
        onDragOver: (e) => {
          const o = e.over?.data as ExportDrop | undefined;
          if (!o) return "Not over a list.";
          return o.zone === "active" ? "Over the export list." : "Over the available list.";
        },
        onDragEnd: (e) => {
          const d = e.active.data as ExportDrag | undefined;
          const o = e.over?.data as ExportDrop | undefined;
          if (!d || !o) return "Dropped.";
          return o.zone === "active"
            ? `Added ${itemName(d.key, d.item)} to export.`
            : `Removed ${itemName(d.key, d.item)} from export.`;
        },
        onDragCancel: () => "Cancelled drag.",
      }}
    >
      <div class={styles.body}>
        <div class={styles.panels}>
          <Panel zone="available" title="Available Options" />
          <Panel zone="active" title="Active Options" />
        </div>

        <div class={styles.footer}>
          <Button class={styles.exportBtn} onClick={() => setShowConfirm(!showConfirm())}>
            Export!
          </Button>
        </div>
      </div>

      <DragOverlay>
        {(active) => {
          const d = active?.data as ExportDrag | undefined;
          return d ? <span class={styles.dragOverlayChip}>{itemName(d.key, d.item)}</span> : null;
        }}
      </DragOverlay>

      <Show when={showConfirm()}>
        <Modal title="Confirm & Name" show={[showConfirm, setShowConfirm]} height="15%" width="25%">
          <div class={styles.confirmContent}>
            <Input id="confirm-name" type="text" />
            <Button onClick={exportToObject} type="submit">
              Confirm
            </Button>
          </div>
        </Modal>
      </Show>
    </DragDropProvider>
  );
};

export default Exporting;
