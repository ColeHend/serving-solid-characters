import { FlatCard } from "coles-solid-library";
import { Component, createMemo, For, Show } from "solid-js";
import { createDroppable } from "../../../../../shared/dnd";
import styles from "../../Exporting.module.scss";
import { Zone, Category, ExportDrop } from "../../Exporting";
import { ItemCard } from "../ItemCard/ItemCard";
import { Trade } from "../../../../../models/trade.model";
import { activeItems, availableItems} from "../../tools/tools";

interface props {
    zone: Zone;
    title: string;
    categories: Category[];
    exportObject: Trade;
}

// One list panel, itself a drop target. Categories with no items collapse away;
// an empty panel shows a hint instead.
export const Panel: Component<props> = (props) => {

    const CATEGORIES = createMemo(() => props.categories);
    const exportObject = createMemo(() => props.exportObject);

    const drop = createDroppable(() => ({
        id: props.zone,
        type: "panel",
        data: { zone: props.zone } as ExportDrop,
    }));

    const itemsFor = (cat: Category) => props.zone === "available" ? availableItems(cat, exportObject()) : activeItems(cat, exportObject());
    const isEmpty = () => CATEGORIES().every((cat) => itemsFor(cat).length === 0);

    return <div
        ref={drop.ref}
        class={styles.panel}
        classList={{ [styles.panelOver]: drop.isOver() }}
    >
        <h2 class={styles.panelHeader}>{props.title}</h2>
        <div class={styles.list}>
        <Show
            when={!isEmpty()}
            fallback={
            <div class={styles.emptyHint}>
                {props.zone === "available"
                ? "Nothing left to add"
                : "Drag items here to export"}
            </div>
            }
        >
            <For each={CATEGORIES()}>
            {(cat) => (
                <Show when={itemsFor(cat).length > 0}>
                <FlatCard header={cat.label} defaultOpen transparent>
                    <div class={styles.categoryItems}>
                    <For each={itemsFor(cat)}>
                        {(item) => (
                            <ItemCard cat={cat} item={item} from={props.zone} />
                        )}
                    </For>
                    </div>
                </FlatCard>
                </Show>
            )}
            </For>
        </Show>
        </div>
    </div>
};
