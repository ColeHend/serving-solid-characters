import { Container, Icon } from "coles-solid-library";
import { Component, JSX, Show } from "solid-js";
import styles from "../../sheet.module.scss";

interface props {
  value: JSX.Element;
  label: string;
  sub?: string;
  icon?: string;
}

export const MiniStat: Component<props> = (props) => {


    return <Container theme="surface" class={styles.miniCard}>
        <div class={styles.miniValue}>{props.value}</div>
        <div class={styles.miniLabel}>
        <Show when={props.icon}>
            <Icon icon={props.icon} size="small" color="var(--primary-color)" />
        </Show>
        {props.label}
        </div>
        <Show when={props.sub}>
        <div class={styles.miniSub}>{props.sub}</div>
        </Show>
    </Container>
}