import { Accessor, Component, createMemo } from "solid-js";
import { srdItem } from "../../../../../../models/data/generated";
import { ItemType } from "../../../../../../shared";
import { Button, Cell, Column, Header, Table } from "coles-solid-library";
import styles from './itemFeature.module.scss';

interface ItemFeatureProps {
    allItems: Accessor<srdItem[]>;
    getValue: Accessor<Record<string, string> | undefined>;
    toggleItem: (id: string) => void;
}

export const ItemFeature: Component<ItemFeatureProps> = (props) => {
    const columns = ["Item Name", "Type", "Actions"];
    const allItems = createMemo(() => props.allItems());

    const learnedItem = createMemo(() => props.getValue()?.['ID'] ?? "");

    const isLearned = (id: string) => learnedItem() === id;

    const getItemByID = (id: string) => allItems().find(item => item.id === id);

    const currItemName = createMemo(() => getItemByID(learnedItem())?.name ?? null);
    const currItemType = createMemo(() => {
        const item = getItemByID(learnedItem());
        return item?.type ?? null;
    });
    const currItemDesc = createMemo(() => getItemByID(learnedItem())?.desc ?? null);
    const currItemProperties = createMemo(() => getItemByID(learnedItem())?.properties ?? null);
    const currItemPropertiesKeys = createMemo(() => {
        const properties = getItemByID(learnedItem())?.properties;
        return properties ? Object.keys(properties) : null;
    });
    const currItemWeight = createMemo(() => getItemByID(learnedItem())?.weight ?? null);
    const currItemCost = createMemo(() => getItemByID(learnedItem())?.cost ?? null);

    return <div style={{ display: "flex", "flex-direction": "row" }}>

        <div class={`${styles.itemTable}`}>
            <Table data={allItems} columns={columns}>
                <Column name="Item Name">
                    <Header>Name</Header>
                    <Cell<srdItem>>
                        {item => <span>
                            {item.name}
                        </span>}
                    </Cell>
                </Column>
                <Column name="Type">
                    <Header>Type</Header>
                    <Cell<srdItem>>
                        {item => <span>
                            {ItemType[item.type]}
                        </span>}
                    </Cell>
                </Column>
                <Column name="Actions">
                    <Header><></></Header>
                    <Cell<srdItem>>
                        {item => <Button onClick={()=>props.toggleItem(item.id)}>
                            {!isLearned(item.id) ? "learn" : "unlearn"}
                        </Button>}
                    </Cell>
                </Column>
            </Table>
        </div>

        <div>
            <h3>Selected Item: {currItemName()}</h3>
            <p><strong>Type:</strong> {ItemType[currItemType() ?? 0]}</p>
            <strong>Properties:</strong>
            <ul class={`${styles.propertiesList}`}>{
                currItemPropertiesKeys()?.map(key => <li>{key}: {currItemProperties()?.[key]}</li>)
            }</ul>
            <p><strong>Weight:</strong> {currItemWeight()}</p>
            <p><strong>Cost:</strong> {currItemCost()}</p>
            <p>{currItemDesc()}</p>
        </div>

    </div>
}