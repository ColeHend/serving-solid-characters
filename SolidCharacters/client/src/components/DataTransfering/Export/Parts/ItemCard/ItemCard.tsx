/* eslint-disable @typescript-eslint/no-explicit-any */
import { Icon } from "coles-solid-library";
import { DragIndicator } from "coles-solid-library/icons";
import { Component } from "solid-js";
import { createDraggable } from "../../../../../shared/dnd";
import { Category, ExportDrag, Zone } from "../../Exporting";
import styles from "../../Exporting.module.scss";
import { itemName } from "../../tools/tools";

interface props {
    cat: Category; 
    item: any; 
    from: Zone;
}

// A draggable item row. Rendered inside the provider so createDraggable resolves
// the drag context. Dragging is restricted to the handle (`handleRef`).
export const ItemCard: Component<props> = (props) => {
    const drag = createDraggable(() => ({
        id: `${props.from}:${String(props.cat.key)}:${itemName(props.cat.key, props.item)}`,
        typropse: "exportItem",
        data: { key: props.cat.key, item: props.item, from: props.from } as ExportDrag,
    }));
    return <div ref={drag.ref} class={styles.itemCard} classList={{ [styles.dragging]: drag.isActive() }}>
        <span ref={drag.handleRef} class={styles.itemHandle} aria-label="Drag item">
            <Icon icon={DragIndicator} />
        </span>
        <span class={styles.itemLabel}>{itemName(props.cat.key, props.item)}</span>
    </div>
}