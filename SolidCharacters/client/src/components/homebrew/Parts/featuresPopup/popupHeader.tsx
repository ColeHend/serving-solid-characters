import { Component, Show } from "solid-js";
import { Button, Icon } from "coles-solid-library";
import { Close, Science } from "coles-solid-library/icons";
import styles from "./featuresPopup.module.scss";

interface PopupHeaderProps {
    title: string;
    subtitle: string;
    onClose: () => void;
}

export const PopupHeader: Component<PopupHeaderProps> = (props) => {
    return (
        <div class={styles.header}>
            <div class={styles.headerIcon}>
                <Icon icon={Science} />
            </div>
            <div>
                <h2 class={styles.headerTitle}>{props.title}</h2>
                <Show when={props.subtitle}>
                    <div class={styles.headerSubtitle}>{props.subtitle}</div>
                </Show>
            </div>
            <Button transparent class={styles.headerClose} aria-label="Close" onClick={() => props.onClose()}>
                <Icon icon={Close} />
            </Button>
        </div>
    );
};
