import { Component, For, createSignal } from "solid-js";
import useStyle from "../../../../../shared/customHooks/utility/style/styleHook";
import styles from './items.module.scss'
import type { Tab } from "../../../../navbar/navbar";
import HomebrewSidebar from "../../sidebar";
import Carousel from "../../../../../shared/components/Carosel/Carosel";

const Items: Component = () => {
    const stylin = useStyle();
    return (
        <>
            <HomebrewSidebar />
            <div class={`${stylin.accent} ${styles.body}`}>
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
                  

            </div>
        </>
    );
}
export default Items;