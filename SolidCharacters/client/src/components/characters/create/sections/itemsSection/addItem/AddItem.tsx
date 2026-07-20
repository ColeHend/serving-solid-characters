import { Accessor, Component, createEffect, createMemo, createSignal, Setter } from "solid-js";
import { CharacterItemRef } from "../../../../../../models/character.model";
import { Item, ItemType } from "../../../../../../models/generated";
import { Button, Cell, Column, Header, Table } from "coles-solid-library";
import SearchBar from "../../../../../../shared/components/SearchBar/SearchBar";
import { Paginator } from "../../../../../../shared";
import { entitySelectorKey } from "../../../../../../shared/customHooks/utility/tools/entityKey";
import { InfoButton } from "../../../shell/infoButton";
import { LegacyBadge } from "../../../shell/legacyBadge";
import styles from "./AddItem.module.scss";

interface props {
    allItems: Accessor<Item[]>;
    inventory: [Accessor<CharacterItemRef[]>, Setter<CharacterItemRef[]>];
    /** Opens the item detail dialog (rendered by the parent section). */
    onView?: (item: Item) => void;
    /** Both-mode: badge legacy (2014) rows. */
    showLegacy?: boolean;
}

export const AddItem: Component<props> = (props) => {
    const [searchedItems, setSearchedItems] = createSignal<Item[]>([]);
    const [paginatedItems, setPaginatedItems] = createSignal<Item[]>([]);


    const srdItems = createMemo(()=>props.allItems());

    // The table starts showing everything (items load async) until a search/filter runs.
    let seeded = false;
    createEffect(() => {
        const all = srdItems();
        if (!seeded && all.length > 0) {
            seeded = true;
            setSearchedItems(all);
        }
    });

    const [inventory, setInventory] = props.inventory;

    // Id-keyed entries pin the exact catalog row (2014 vs 2024); name-only entries match by name.
    const matchesItem = (entry: CharacterItemRef, item: Item) =>
        entry.id ? entry.id === entitySelectorKey(item) : entry.name === item.name;

    const is_Added = (item: Item) => inventory().some((entry) => matchesItem(entry, item));

    const sortByType = (type: ItemType) => {
        setSearchedItems(srdItems())

        switch (type) {
            case 0: // Weapon
                setSearchedItems(old => old.filter(x => x.type === 0));
                break;

            case 1: // Armor
                setSearchedItems(old => old.filter(x => x.type === 1));
                break;

            case 2: // Tool
                setSearchedItems(old => old.filter(x => x.type === 2));
                break;

            case 3: // Item
                setSearchedItems(old => old.filter(olditem => olditem.type === 3));
                break;
            
            // case 4: // Accessory
            //     setSearchedItems(old => old.filter(olditem => olditem.type === 4));
        }
    }
    return <div class={`${styles.addItemWrapper}`}>

        <div class={`${styles.searchBar}`}>
            <SearchBar
                dataSource={srdItems}
                setResults={setSearchedItems}
                tooltip="Type in a item name"
            />
        </div>

        <div>Sort By</div>
        
        <div class={`${styles.sortButtons}`}>
            <Button onClick={()=>setSearchedItems(srdItems())}>All</Button>

            <Button onClick={()=>sortByType(0)}>Weapons</Button>

            <Button onClick={()=>sortByType(1)}>Armors</Button>

            <Button onClick={()=>sortByType(2)}>Tools</Button>

            {/* <Button onClick={()=>sortByType(4)}>Accessory</Button> */}
        </div>

       <div class={`${styles.tableWrapper}`}>
            <Table columns={["name", "cost", "type","options"]} data={paginatedItems}>
                <Column name="name">
                    <Header>Name</Header>
                    <Cell<Item>>
                        {(item)=><div>
                            {item.name}
                            {props.showLegacy && item.legacy === true && <LegacyBadge />}
                            {props.onView && (
                                <InfoButton label={`View ${item.name} details`} onClick={()=>props.onView?.(item)} />
                            )}
                        </div>}
                    </Cell>
                </Column>
                <Column name="type">
                    <Header>Type</Header>
                    <Cell<Item>>
                        {(item)=><div>
                            {ItemType[item.type]}
                        </div>}
                    </Cell>
                </Column>
                <Column name="cost">
                    <Header>Cost</Header>
                    <Cell<Item>>
                        {(item)=><div>
                            {item.cost}
                        </div>}
                    </Cell>
                </Column>
                <Column name="options">
                    <Header><></></Header>
                    <Cell<Item>>
                        {(item)=><div style={{display: "flex", "flex-direction":"column","align-items": 'center'}}>
                            <Button onClick={()=>{
                                if (is_Added(item)) {
                                    setInventory(old => old.filter(entry => !matchesItem(entry, item)));
                                } else {
                                    setInventory(old => [...old, { name: item.name, id: entitySelectorKey(item) }]);
                                }
                            }}>
                                {is_Added(item) ? "Delete" : "Insert"}
                            </Button>
                        </div>}
                    </Cell>
                </Column>

            </Table>
       </div>

       <div>
        <Paginator
            items={searchedItems}
            setPaginatedItems={setPaginatedItems}
            itemsPerPage={[6,10,15,25]}
            transparent
        />
       </div>
    </div>
}