import { Component } from "solid-js";
import { Button } from "coles-solid-library";
import styles from "./featuresPopup.module.scss";

interface PopupFooterProps {
    effectCount: number;
    onCancel: () => void;
    onSave: () => void;
}

export const PopupFooter: Component<PopupFooterProps> = (props) => {
    return (
        <div class={styles.footer}>
            <span class={styles.footerCount}>
                {props.effectCount} {props.effectCount === 1 ? "effect" : "effects"} · changes apply on save
            </span>
            <div class={styles.footerActions}>
                <Button onClick={() => props.onCancel()}>Cancel</Button>
                <Button class={styles.saveBtn} onClick={() => props.onSave()}>Save changes</Button>
            </div>
        </div>
    );
};
