import { Component, createEffect, createMemo } from "solid-js";
import { Armor, Body, Tab, Tabs, useGetItems, Weapon } from "../../../shared";
import styles from "./item.module.scss";
import WeaponsView from "./parts/Weapons/Weapons";
import ArmorsView from "./parts/Armors/Armors";
import AdventEquipView from "./parts/AdventuringEquip/AdventuringEquip";

export enum ItemType {
    AdventuringGear,
    Weapon,
    Armor
}

const ItemsViewTab:Component = () => {
    // all off the items
    const SrdItems = useGetItems();

    // items sorted by equipment Category
    const SrdAdventEquip = createMemo(()=>SrdItems().filter(x=>x.equipmentCategory === ItemType[0]));

    const SrdWeapons = createMemo(()=>SrdItems().filter(x=>x.equipmentCategory === ItemType[1]) as Weapon[]);

    const SrdArmors = createMemo(()=>SrdItems().filter(x=>x.equipmentCategory === ItemType[2]) as Armor[]) ;


    return <Body>
        <div class={`${styles.ItemsTabBar}`}>
            <Tabs transparent>
                <Tab name="Weapons">
                    <WeaponsView weapons={SrdWeapons} />
                </Tab>
                <Tab name="Armor">
                    <ArmorsView SrdArmors={SrdArmors} />     
                </Tab>
                <Tab name="Adventuring equpiment">
                    <AdventEquipView Items={SrdAdventEquip} />
                </Tab>
            </Tabs>
        </div>
    </Body>
}
export default ItemsViewTab;