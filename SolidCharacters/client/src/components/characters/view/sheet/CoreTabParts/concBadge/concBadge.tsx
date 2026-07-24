import { Component, JSX, splitProps } from "solid-js";
import style from "./concBadge.module.scss";

interface props extends JSX.HTMLAttributes<HTMLSpanElement> {
    theme?: "primary" | "secondary" | "tertiary";
}

export const ConcBadge:Component<props> = (props) => {
    const [local, other] = splitProps(props, ["theme"]);
    
    return <span {...other} class={`${style.concBadge}`}>C</span>
}