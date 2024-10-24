import { Component, For, createSignal, useContext, createMemo, createEffect, } from "solid-js";
import { useStyle, Carousel, getUserSettings, Body, Item, Weapon, Armor, FormField, Input } from "../../../../../shared/";
import styles from './items.module.scss'
import type { Tab } from "../../../../navbar/navbar";
import HomebrewSidebar from "../../sidebar";
import { SharedHookContext } from "../../../../rootApp";
import { useSearchParams } from "@solidjs/router";
import { ItemType } from "../../../../../shared/customHooks/utility/itemType";
import { createStore } from "solid-js/store";
import CreateWeapon from "./parts/Weapon/weapon";
import CreateArmor from "./parts/Armor/armor";
import CreateItem from "./parts/Item/item";

const Items: Component = () => {
    // state part 1
    const sharedHooks = useContext(SharedHookContext);
    const [userSettings, setUserSettings] = getUserSettings();
    const stylin = createMemo(()=>useStyle(userSettings().theme));
    const [searchParams,setSearchParams] = useSearchParams()
    
    const [itemName,setItemName] = createSignal<string>("");
    // stores 
    const [currentItem,setCurrentItem] = createStore<Item>({
        name: "",
        equipmentCategory: "",
        cost: {
            quantity: 0,
            unit: ""
        },
        weight: 0,
        tags: [],
        desc: [],
        item: "",
        features: []
    })

    const [currentWeapon,setCurrentWeapon] = createStore<Weapon>({
        name: "",
        equipmentCategory: "",
        cost: {
            quantity: 0,
            unit: ""
        },
        weight: 0,
        tags: [],
        desc: [],
        item: "",
        features: [],
        weaponCategory: "",
        weaponRange: "",
        categoryRange: "",
        damage: [],
        range: {
            normal: 0,
            long: 0
        }
    })

    const [currentArmor,setCurrentArmor] = createStore<Armor>({
        name: "",
        equipmentCategory: "",
        cost: {
            quantity: 0,
            unit: ""
        },
        weight: 0,
        tags: [],
        desc: [],
        item: "",
        features: [],
        armorCategory: "",
        armorClass: {
            base: 0,
            dexBonus: false,
            maxBonus: 0
        },
        strMin: 0,
        stealthDisadvantage: false
    })


    // state part 2
    const elementMemo = createMemo(()=>[
        {
            name: "Weapon",
            element: <CreateWeapon newWeapon={currentWeapon} setNewWeapon={setCurrentWeapon} />
        },
        {
            name: "Armor",
            element: <CreateArmor newArmor={currentArmor} setNewArmor={setCurrentArmor} />
        },
        {
            name: "Item",
            element: <CreateItem newItem={currentItem} setNewItem={setCurrentItem} />
        }
    ])

    if (!!!searchParams.ItemType) setSearchParams({ItemType: elementMemo()[0].name});

    if (!!!searchParams.Name) setSearchParams({Name: itemName()})

    const startingIndex = createMemo(()=>elementMemo().findIndex((x)=>x.name.toLowerCase() === searchParams.ItemType?.toLowerCase()) ?? 0)

    const [itemIndex,setItemIndex] = createSignal<number>(startingIndex())

    // ▼ when things change ▼
    createEffect(()=>{
        setSearchParams({ItemType: elementMemo()[itemIndex()]?.name ?? "Armor",Name:itemName()})
    })

    return (
        <>
            <Body>
                <h1>Items</h1>
                <FormField name="Item name">
                    <Input 
                        type="text" 
                        transparent
                        value={itemName()}
                        onInput={(e)=>setItemName(e.currentTarget.value)}
                    />
                </FormField>
                <h2>Item Types</h2>
                <div>
                    <Carousel startingIndex={startingIndex()} currentIndex={[itemIndex,setItemIndex]} elements={elementMemo()} />
                </div>
            </Body>
        </>
    );
}
export default Items;