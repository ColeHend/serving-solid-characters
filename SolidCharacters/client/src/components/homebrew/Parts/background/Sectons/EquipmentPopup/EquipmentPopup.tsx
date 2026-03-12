import { Column, FormField, Header, Input, Modal, Table, Cell, Chip, FormGroup, Button, addSnackbar } from "coles-solid-library";
import { Accessor, Component, createMemo, createSignal, For, Setter, Show } from "solid-js";
import { srdItem } from "../../../../../../models/data/generated";
import { ItemType, Paginator } from "../../../../../../shared";
import { BackgroundForm } from "../../../../../../models/data/formModels";

interface PopupProps {
    show: [Accessor<boolean>, Setter<boolean>];
    startItemKeys: Accessor<string[]>;
    startingEquipment: [Accessor<Record<string, string>>,Setter<Record<string, string>>];
    allItems: Accessor<srdItem[]>;
    formGroup: FormGroup<BackgroundForm>;
}

type event = MouseEvent & {
    currentTarget: HTMLButtonElement;
    target: Element;
}

export const EquipmentPopup: Component<PopupProps> = (props) => {
    const [show, setShow] = props.show;
    const allItems = createMemo(() => props.allItems());

    const [startingEquipment, setStartingEquipment] = props.startingEquipment;

    const startItemKeys = createMemo(() => props.startItemKeys());

    const group = props.formGroup;

    const [pagiantedItems,setPagiantedItems] = createSignal<srdItem[]>([]);

    // const currentOptionKey = createMemo(()=> );

    const [newItems, setNewItems] = createSignal<string[]>([]);

    const addItem = (item:string) => {
        
        if (added(item)) {
            // if item already exists remove it upon second click.
            setNewItems(old => old.filter(i => i !== item));
        } else {
            // add them the item on first click
            setNewItems(old => [...old, item]);
        }

    }

    const added = (item: string) => {
        return newItems().some(i => i === item);
    }

    const handleSubmit = (e:event) => {
        if (startItemKeys().some(k => k === group.get().optionKey)) {
            addSnackbar({
                severity: "error",
                message: "That key already exists!"
            })
            return;
        }

        setStartingEquipment(old=>({...old,[group.get().optionKey]: newItems().join(",")}))
        group.set("optionKey", "");
        setNewItems([]);
    }

    const remove = (key: string) => {
        setStartingEquipment(old => {
            const updated = {...old};
            delete updated[key];
            return updated;
        })
    }

    return <Modal show={[show, setShow]} title="Add A Choice!">
        <div>
            <FormField name="Opiton key" formName="optionKey">
                <Input value={group.get().optionKey} onInput={(e)=>group.set("optionKey",e.currentTarget.value)}/>
            </FormField>
            
            <div>
                <div>

                </div>
                <div>
                    <Table data={pagiantedItems} columns={['name','type','action']}>
                        <Column name="name">
                            <Header>
                                name
                            </Header>

                            <Cell<srdItem>>
                                {item => <span>{item.name}</span>}
                            </Cell>
                        </Column>

                        <Column name="type">
                            <Header>
                                type
                            </Header>

                            <Cell<srdItem>>
                                {item => <span>{ItemType?.[item.type]}</span>}
                            </Cell>
                        </Column>

                        <Column name="action">
                            <Header><></></Header>
                            <Cell<srdItem>>
                                {item => <Button onClick={()=>addItem(item.name)}>{added(item.name) ? "remove" : "Add"}</Button>}
                            </Cell>
                        </Column>
                    </Table>
                </div>
                <div>
                    <Paginator 
                        items={allItems}
                        setPaginatedItems={setPagiantedItems}
                    />
                </div>
            </div>
           
           <div>
                <Chip key={group.get().optionKey} value={newItems().join(",")}  /> <span>:</span>

                <Show when={startItemKeys().length > 0}>
                    <For each={startItemKeys()}>
                        {key => <Chip key={key} value={startingEquipment()[key]} onClick={()=>{
                            const confirm = window.confirm("Are you sure you want to load this item group?");

                            if (!confirm) return;
                            
                            group.set("optionKey", key);
                            setNewItems(startingEquipment()[key].split(","))
                            remove(key);
                        }} remove={()=>remove(key)} />}
                    </For>
                </Show>
           </div>

            <Button onClick={handleSubmit}>Add</Button>


        </div>
    </Modal>
}