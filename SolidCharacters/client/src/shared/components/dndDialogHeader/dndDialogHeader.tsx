import { Component, JSX } from "solid-js";
import styles from "./dndDialogHeader.module.scss";
import { DndDialogButton } from "../dndDialogButton/dndDialogButton";


interface HeaderProps {
    onClose: (e:Event) => void;
    children?: JSX.Element;
}

export const DndDialogHeader: Component<HeaderProps> = (props) => {

    return <div class={`${styles.styledHeaderWrapper}`}>
        <div class={`${styles.leftSide}`}>
            <div>
                {props.children}
            </div>
        </div>
        <DndDialogButton onclick={(e)=>props.onClose(e)} transparent class={`${styles.closeBtn}`} roundel>x</DndDialogButton>
    </div>
}