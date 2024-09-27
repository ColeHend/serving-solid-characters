import { Component } from "solid-js";
import { Body, Tab, Tabs, useGetItems } from "../../../shared";
import styles from "./item.module.scss";
import WeaponsView from "./parts/Weapons/Weapons";
import ArmorsView from "./parts/Armors/Armors";
import AdventEquipView from "./parts/AdventuringEquip/AdventuringEquip";

interface props {

}

const ItemsViewTab:Component<props> = (props) => {
    const SrdItems = useGetItems();

    return <Body>
        <div class={`${styles.ItemsTabBar}`}>
            <Tabs>
                <Tab name="Weapons">
                    <WeaponsView />
                </Tab>
                <Tab name="Armor">
                    <ArmorsView />     
                </Tab>
                <Tab name="Adventuring equpiment">
                    <AdventEquipView />
                </Tab>
            </Tabs>
        </div>
    </Body>
}
export default ItemsViewTab;