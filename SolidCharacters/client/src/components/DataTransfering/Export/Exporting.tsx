/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component,Show, createSignal } from "solid-js";
import styles from "./Exporting.module.scss";
import { characterManager, homebrewManager, isNullish } from "../../../shared";
import { Button, Input, Modal} from "coles-solid-library";
import { Trade } from "../../../models/trade.model";
import { createStore } from "solid-js/store";
import { downloadObjectAsJson } from "../../../shared/customHooks/utility/tools/downloadObjectAsJson";
import {
  DragDropProvider,
  DragOverlay,
  pointerWithin,
  type DragEndEvent,
  type DefaultDataMap,
} from "../../../shared/dnd";
import { itemName } from "./tools/tools";
import { Panel } from "./Parts/panel/panel";

// Each export category, driven from one config instead of 7 duplicated blocks.
export type Category = { key: keyof Trade; label: string; source: () => any[] };
// Drag payload: the item, which category it belongs to, and which list it came
// from. Drop payload: which list it was dropped on.
export type ExportDrag = { key: keyof Trade; item: any; from: Zone };
export type ExportDrop = { zone: Zone };
export type Zone = "available" | "active";

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
    { key: "subraces", label: "Subraces", source: () => homebrewManager.subraces()},
    { key: "characters", label: "Characters", source: () => characterManager.characters() },
  ];


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
          <Panel zone="available" title="Available Options" categories={CATEGORIES} exportObject={exportObject} />
          <Panel zone="active" title="Active Options" categories={CATEGORIES} exportObject={exportObject} />
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
