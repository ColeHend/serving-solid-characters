import { Component, createMemo, createSignal, Show, Accessor, Setter, For } from "solid-js";
import style from "./snackbar.module.scss"; // .snack{Error/Success/Info/Warning}
import { Portal } from "solid-js/web";
import { Button, getUserSettings, useStyle } from "../..";
import { S } from "@vite-pwa/assets-generator/shared/assets-generator.5e51fd40";
export interface Snackbar {
    message: string;
    severity?: "error" | "warning" | "info" | "success";
    closeTimeout?: number;
}

const [snackbars, setSnackbars] = createSignal<Snackbar[]>([]);
const addSnackbar = (snack: Snackbar) => {
    setSnackbars(old => [...old, snack]);
};
const removeSnackbar = (index: number) => {
    setSnackbars(old => old.filter((_, i) => i !== index));
};

const SnackbarController: Component = () => {
    const [userSettings, setUserSettings] = getUserSettings();
    const stylin = createMemo(() => useStyle(userSettings().theme));
    return (
        <Show when={snackbars().length > 0}>
            <div class={style.snackContainer}>
                    <For each={snackbars()}>{(snack, index) => (
                        <Snackbar {...snack} index={index()} onClose={() => removeSnackbar(index())} />
                    )}</For>
            </div>
        </Show>
    );
}
interface SnackbarProps extends Snackbar {
    onClose: () => void;
    index: number;
}
const Snackbar:Component<SnackbarProps> = (props) => {
    const [userSettings, setUserSettings] = getUserSettings();
    const [isOpen, setIsOpen] = createSignal(true);
    const stylin = createMemo(()=>useStyle(userSettings().theme));
    if (!!props.closeTimeout) setTimeout(()=>props.onClose(), props.closeTimeout);
    if (!!!props.closeTimeout) setTimeout(()=>props.onClose(), 5000);
    const messageLength = Math.floor(props.message.length / 17);
    return (
        <Portal mount={document.body}>
            <Show when={isOpen()}>
                <div style={{bottom: `${10 + (props.index * (50 + (messageLength * 8)))}px`}} class={`${stylin().primary} ${style.snack} ${style[props.severity ?? "info"]}`}>
                    <span>{props.message}</span>
                    <Button onClick={props.onClose} >X</Button>
                </div>
            </Show>
        </Portal>
    );
};
export { addSnackbar, SnackbarController };
export default addSnackbar;