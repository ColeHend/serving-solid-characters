import { Component, createEffect, createSignal } from "solid-js";
import styles from "./fleuronDivider.module.scss";

interface props {
    color?: string;
}

export const FleuronDivider: Component<props> = (props) => {

    const hasColor = () => ("color" in props && props.color !== undefined);

    const [divderRef, setDivierRef] = createSignal<HTMLElement|null>(null);

    createEffect(() => {
        if (hasColor()) {
            const ref = divderRef();

            if (ref) {
                ref.style.setProperty(`--fleuroinDividerBG`, `${props.color}`)
            }
        }
    })

    return <div ref={setDivierRef} class={`${styles.fleuronDivider}`}>
    <i class={`${styles.line}`}></i>
    <i class={`${styles.middle}`}></i>
    <i class={`${styles.line}`}></i>
</div>
}