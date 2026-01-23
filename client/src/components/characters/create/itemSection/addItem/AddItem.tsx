import { Accessor, Component, createMemo, createSignal, For, JSX, Setter } from "solid-js";
import { Item, ItemType } from "../../../../../models/data";
import { Button, Cell, Column, Header, Table } from "coles-solid-library";
import SearchBar from "../../../../../shared/components/SearchBar/SearchBar";

interface props {
    allItems: Accessor<Item[]>;
    inventory: [Accessor<string[]>, Setter<string[]>];
}

export const AddItem: Component<props> = (props) => {
    const [searchedItems, setSearchedItems] = createSignal<Item[]>([]);

    const srdItems = createMemo(()=>props.allItems());

    const [inventory, setInventory] = props.inventory;

    const is_Added = (value: string) => {

        return inventory().includes(value);
    }

    return <div style={{height: "100%"}}>

        <div style={{width: "25%"}}>
            <SearchBar
                dataSource={srdItems}
                setResults={setSearchedItems}
            />
        </div>

       <div style={{height: "30vh","overflow-y":"scroll"}}>
            <Table columns={["name", "cost", "type","options"]} data={searchedItems}>
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
    </div>
}