import { Modal } from "coles-solid-library";
import { Component,Accessor, Setter, createMemo, For, Show } from "solid-js";
import { srdItem } from "../../../../models/data/generated";
import { ItemProperties } from "../../../../models/data";
import styles from "./itemsModal.module.scss";


interface modalProps {
    item: Accessor<srdItem>;
    show: [Accessor<boolean>, Setter<boolean>];
}

export const ItemPopup:Component<modalProps> = (props) => {
    const currentItem = props.item();
    const propertieKeys = createMemo(()=> {
        return Object.keys(props.item().properties);
    })
    
    return <Modal title={`${currentItem.name}`} show={props.show}>
        <div class={`${styles.itemWrapper}`}>
            <span class={`${styles.info} ${styles.push}`}>
                {currentItem.desc}
            </span>

            <h2 class={`${styles.header}`}>Cost: 
                <span class={`${styles.info}`}>
                    {currentItem.cost}
                </span>
            </h2>

            <h2 class={`${styles.header}`}>Weight: 
                <span class={`${styles.info}`}>
                    {currentItem.weight} lbs
                </span>
            </h2>

            <Show when={propertieKeys().length > 0}>
                <h2 class={`${styles.header}`}>Properties</h2>
                <div>
                    <For each={propertieKeys()}>
                        {(key) => <div class={`${styles.properties}`}>
                            <h3 class={`${styles.header}`}>{key}</h3>
                            <span class={`${styles.info}`}>
                                <Show 
                                when={
                                    Array.isArray(props.item().properties[key]) 
                                }
                                fallback={props.item().properties[key]}>
                                    {Array.from(props.item().properties[key]).join(" ")}
                                </Show>
                            </span>
                        </div>}
                    </For>
                </div>
            </Show>


        </div>
    </Modal>
}