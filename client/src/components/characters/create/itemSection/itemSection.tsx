import { Accessor, Component, createMemo, Setter } from "solid-js";
import { FlatCard } from "../../../../shared/components/flatCard/flatCard";
import { Item } from "../../../../models/data";

interface sectionProps {
    inventory: [Accessor<string[]>, Setter<string[]>];
    equipped: [Accessor<string[]>, Setter<string[]>];
    attuned: [Accessor<string[]>, Setter<string[]>];
    allItems: Accessor<Item[]>;
}

export const ItemSection:Component<sectionProps> = (props) => {
    const [inventory,setInventory] = props.inventory;
    const [equipped, setEquipped] = props.equipped;
    const [attuned, setAttuned] = props.attuned;

    const allItems = createMemo(()=>props.allItems());

    return <FlatCard icon="backpack" headerName="Equipment">
        <FlatCard headerName={<strong>Starting Equipment</strong>}>

        </FlatCard>
        <FlatCard headerName={<strong>Inventory ({inventory().length})</strong>}>

        </FlatCard>
        <FlatCard headerName={<strong>Add Item</strong>}>

        </FlatCard>
    </FlatCard>
}