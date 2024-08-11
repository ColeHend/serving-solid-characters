import { Component, For, createSignal, useContext, createMemo } from "solid-js";
import { useStyle, Carousel, getUserSettings, Body } from "../../../../../shared/";
import styles from './items.module.scss'
import type { Tab } from "../../../../navbar/navbar";
import HomebrewSidebar from "../../sidebar";
import { SharedHookContext } from "../../../../rootApp";

const Items: Component = () => {
    const sharedHooks = useContext(SharedHookContext);
    const [userSettings, setUserSettings] = getUserSettings();
    const stylin = createMemo(()=>useStyle(userSettings().theme));
    return (
        <>
            <Body>
                <h1>Items</h1>
                <h2>Item Types</h2>
                <div>
                    <Carousel elements={[{name: "Weapon",
                    element: <div>
                        <p>damage</p>
                        <p>properties</p>
                        <p>description</p>
                        <p>cost</p>
                        <p>weight</p>
                        <p>description</p>
                    </div>}, {
                        name: "Armor",
                        element: <div>
                            <p>armor class</p>
                            <p>strength requirement</p>
                            <p>stealth disadvantage</p>
                            <p>description</p>
                            <p>cost</p>
                            <p>weight</p>
                        </div>
                    },{
                        name: "Item",
                        element: <div>
                            <p>description</p>
                            <p>cost</p>
                            <p>weight</p>
                            <p>consumable</p>
                        </div>
                    }]} />
                        
                </div>
                  

            </Body>
        </>
    );
}
export default Items;