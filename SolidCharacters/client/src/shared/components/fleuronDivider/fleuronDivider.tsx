import { Component } from "solid-js";
import styles from "./fleuronDivider.module.scss";

export const FleuronDivider: Component = () => {

    return <div class={`${styles.fleuronDivider}`}>
    <i class={`${styles.line}`}></i>
    <i class={`${styles.middle}`}></i>
    <i class={`${styles.line}`}></i>
</div>
}