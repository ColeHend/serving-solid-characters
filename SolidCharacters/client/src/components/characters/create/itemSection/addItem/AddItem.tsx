import { Accessor, Component, createEffect, createMemo, createSignal, For, JSX, Setter } from "solid-js";
import { Item, ItemType } from "../../../../../models/generated";
import { Button, Cell, Column, Header, Row, Table } from "coles-solid-library";
import SearchBar from "../../../../../shared/components/SearchBar/SearchBar";
import { Paginator } from "../../../../../shared";
import styles from "./AddItem.module.scss";

interface props {
    allItems: Accessor<Item[]>;
    inventory: [Accessor<string[]>, Setter<string[]>];
}

export const AddItem: Component<props> = (props) => {
    const [searchedItems, setSearchedItems] = createSignal<Item[]>([]);
    const [paginatedItems, setPaginatedItems] = createSignal<Item[]>([]);


    const srdItems = createMemo(()=>props.allItems());

    const [inventory, setInventory] = props.inventory;

    const is_Added = (value: string) => {

        return inventory().includes(value);
    }

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
            <Button onClick={()=>sortByType(3)}>All</Button>

            <Button onClick={()=>sortByType(0)}>Weapons</Button>

            <Button onClick={()=>sortByType(1)}>Armors</Button>

            {/* <Button onClick={()=>sortByType(4)}>Accessory</Button> */}
        </div>

       <div class={`${styles.tableWrapper}`}>
            <Table columns={["name", "cost", "type","options"]} data={paginatedItems}>
                <Column name="name">
                    <Header>Name</Header>
                    <Cell<Item>>
                        {(item)=><div>
                            {item.name}
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
                                if (is_Added(item.name)) {
                                    setInventory(old => old.filter(old => old !== item.name));
                                } else {
                                    setInventory(old => [...old, item.name]);
                                }
                            }}>
                                {is_Added(item.name) ? "Delete" : "Insert"}
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