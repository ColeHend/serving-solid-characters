import { Modal } from "coles-solid-library";
import { Component,Accessor, Setter, createMemo, For, Show, createSignal } from "solid-js";
import { srdItem } from "../../../../models/data/generated";
import styles from "./itemsModal.module.scss";
import { DndDialogHeader } from "../../dndDialogHeader/dndDialogHeader";
import { sourceLabel } from "../modals.shared";
import { ItemType } from "../../../../models/generated";
import Markdown from "../../MarkDown/MarkDown";


interface modalProps {
    item: Accessor<srdItem>;
    show: [Accessor<boolean>, Setter<boolean>];
}

export const ItemPopup:Component<modalProps> = (props) => {
    const currentItem = props.item();
    
    const [menuRef, setMenuRef] = createSignal<HTMLElement | null>(null);
    const [,setShow] = props.show;

    const propertieKeys = createMemo(()=> {
        return Object.keys(props.item().properties);
    })

    const prettyTypeName = (type: string) => {
        switch (type) {
            case "Item":
                return "Adventuring Gear";
            default:
                return type;
        }
    }
    
    createMemo(() => {
        const menu = menuRef();

        const first = menu?.parentElement ?? null;

        const second = first?.parentElement ?? null;

        if (second) {
            second.style.paddingBottom = "0";
        }
    })

    return <Modal title={`${currentItem?.name}`} noHeader show={props.show}>
        <div class={`${styles.itemWrapper}`} ref={setMenuRef}>
            <DndDialogHeader onClose={()=>setShow(false)}>
                <div class={`${styles.headerTitle}`}> 
                    {prettyTypeName(ItemType?.[currentItem?.type])}<Show when={currentItem.legacy ?? false}><span class={`${styles.dot}`}>·</span>Legacy</Show><span class={`${styles.dot}`}>·</span>{sourceLabel(currentItem, 'item')}

                    <h1>{currentItem?.name}</h1>
                </div>
            </DndDialogHeader>

            <div class={`${styles.divider}`} />

            <div class={`${styles.info} ${styles.desc}`}>
                <Markdown text={currentItem?.desc} />
            </div>
            
            <div class={`${styles.stats}`}>
                <h2 class={`${styles.header}`}>
                    Cost: 
                </h2>
                <span class={`${styles.info}`}>
                    {currentItem?.cost}
                </span>

                <h2 class={`${styles.header}`}>
                    Weight: 
                </h2>
                <span class={`${styles.info}`}>
                    {currentItem?.weight} lbs
                </span>

            </div>

            <Show when={propertieKeys()?.length > 0}>
                <h3 class={` ${styles.flankedHeader}`}>Properties</h3>
                <div>
                    <For each={propertieKeys()}>
                        {(key) => <div class={`${styles.properties}`}>
                            <h3 class={`${styles.header}`}>{key}:</h3>
                            <span class={`${styles.info}`}>
                                <Show 
                                when={
                                    Array.isArray(props?.item()?.properties?.[key]) 
                                }
                                fallback={props?.item()?.properties?.[key]}>
                                    {Array.from(props?.item()?.properties?.[key])?.join(" ")}
                                </Show>
                            </span>
                        </div>}
                    </For>
                </div>
            </Show>


        </div>
    </Modal>
}