import { Accessor, Component, For, Show, createMemo, createSignal } from "solid-js";
import { Icon, Input } from "coles-solid-library";
import { Search } from "coles-solid-library/icons";
import { srdItem } from "../../../../../../models/data/generated";
import { ItemType } from "../../../../../../shared";
import styles from "./itemPickerPanel.module.scss";

interface ItemPickerPanelProps {
    allItems: Accessor<srdItem[]>;
    /** Adds the clicked item's id to the parent's selection. */
    onAdd: (id: string) => void;
    /** Ids to hide from the list (already picked). */
    excludeIds?: Accessor<string[]>;
}

const TYPE_FILTERS: { label: string; type: ItemType }[] = [
    { label: "Weapons", type: ItemType.Weapon },
    { label: "Armor", type: ItemType.Armor },
    { label: "Tools", type: ItemType.Tool },
    { label: "Gear", type: ItemType.Item },
];

// Searchable picker over the SRD/homebrew item list: name search + single-select type
// filter, each row with a compact stat line and a "+" that pushes the item id up to the
// parent. Visible list is capped at 50 matches for perf (same as the equipment compendium).
export const ItemPickerPanel: Component<ItemPickerPanelProps> = (props) => {
    const [search, setSearch] = createSignal("");
    const [filter, setFilter] = createSignal<ItemType | null>(null);

    const filtered = createMemo<srdItem[]>(() => {
        const q = search().trim().toLowerCase();
        const excluded = new Set(props.excludeIds?.() ?? []);
        return props.allItems()
            .filter((item) =>
                !excluded.has(item.id) &&
                (filter() === null || item.type === filter()) &&
                (!q || (item.name ?? "").toLowerCase().includes(q)))
            .slice(0, 50);
    });

    const statLine = (item: srdItem): string => {
        const parts: string[] = [];
        if (item.cost) parts.push(item.cost);
        const p = item.properties ?? {};
        if (p["AC"]) parts.push(`AC ${p["AC"]}`);
        else if (p["Damage"]) parts.push(p["Damage"]);
        return parts.join(" · ");
    };

    const toggleFilter = (type: ItemType) => setFilter((prev) => (prev === type ? null : type));

    return (
        <div class={styles.panel}>
            <div class={styles.searchField}>
                <Icon icon={Search} size="small" />
                <Input
                    value={search()}
                    placeholder="Search items"
                    onInput={(e) => setSearch(e.currentTarget.value)}
                />
            </div>

            <div class={styles.filterRow}>
                <For each={TYPE_FILTERS}>{(f) => (
                    <button
                        type="button"
                        class={styles.filterChip}
                        classList={{ [styles.filterChipActive]: filter() === f.type }}
                        onClick={() => toggleFilter(f.type)}
                    >
                        {f.label}
                    </button>
                )}</For>
            </div>

            <div class={styles.itemList}>
                <Show when={filtered().length} fallback={<div class={styles.emptyList}>No matching items.</div>}>
                    <For each={filtered()}>{(item) => (
                        <div class={styles.itemRow}>
                            <div class={styles.itemInfo}>
                                <span class={styles.itemName}>{item.name}</span>
                                <Show when={statLine(item)}>
                                    <span class={styles.itemStats}>{statLine(item)}</span>
                                </Show>
                            </div>
                            <span class={styles.itemTag}>{ItemType[item.type] ?? "Item"}</span>
                            <button
                                type="button"
                                class={styles.itemAdd}
                                aria-label={`Add ${item.name}`}
                                onClick={() => props.onAdd(item.id)}
                            >
                                +
                            </button>
                        </div>
                    )}</For>
                </Show>
            </div>
        </div>
    );
};
