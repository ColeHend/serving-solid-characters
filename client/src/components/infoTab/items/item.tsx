import { Component, createEffect, createMemo, createSignal } from "solid-js";
import { Armor, Body, Carousel, Tab, Tabs, useGetItems, Weapon } from "../../../shared";
import styles from "./item.module.scss";
import WeaponsView from "./parts/Weapons/Weapons";
import ArmorsView from "./parts/Armors/Armors";
import AdventEquipView from "./parts/AdventuringEquip/AdventuringEquip";
import { useSearchParams } from "@solidjs/router";
import { effect } from "solid-js/web";
import { ItemType } from "../../../shared/customHooks/utility/itemType";


const ItemsViewTab:Component = () => {
    // all off the items
    const SrdItems = useGetItems();

    // items sorted by equipment Category
    const SrdAdventEquip = createMemo(()=>SrdItems().filter(x=>x.equipmentCategory === ItemType[0]));
    const SrdWeapons = createMemo(()=>SrdItems().filter(x=>x.equipmentCategory === ItemType[1]) as Weapon[]);
    const SrdArmors = createMemo(()=>SrdItems().filter(x=>x.equipmentCategory === ItemType[2]) as Armor[]) ;

    const elementMemo = createMemo(()=>[
        {name: "Weapons", element: () =>  <WeaponsView weapons={SrdWeapons} />  },
        {name: "Armors", element: () => <ArmorsView SrdArmors={SrdArmors} /> },
        {name: "AdventuringEquipment", element: () =>  <AdventEquipView Items={SrdAdventEquip} /> }
    ]);  

    const [searchParam,setSearchParam] = useSearchParams();

    if (!!!searchParam.itemType) setSearchParam({itemType: elementMemo()[0].name })
    
    const startingIndex = createMemo(()=>elementMemo().findIndex((x)=>x.name.toLowerCase() === searchParam.itemType?.toLowerCase()) ?? 0);

    const [itemIndex,setItemIndex] = createSignal<number>(startingIndex());

    createEffect(()=>{
        setSearchParam({itemType: elementMemo()[itemIndex()]?.name ?? "Weapons"})
    })

    function cantFind(number:number) {
        if (startingIndex() === -1) {

            return 0
        }

        return number
    }

    return <Body>
        {/* @ts-ignore */}
        <Carousel startingIndex={cantFind(startingIndex())} currentIndex={[itemIndex,setItemIndex]} elements={elementMemo()} />
    </Body>
}
export default ItemsViewTab;

