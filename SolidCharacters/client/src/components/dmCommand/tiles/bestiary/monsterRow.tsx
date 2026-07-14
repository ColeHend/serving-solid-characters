import { Component } from "solid-js";
import { Button } from "coles-solid-library";
import { BestiaryMonster } from "./bestiary.shared";
import styles from './bestiary.module.scss';

interface MonsterRowProps {
    monster: BestiaryMonster;
}

export const MonsterRow: Component<MonsterRowProps> = (props) => {
    return <div class={styles.row}>
        <span class={styles.info}>
            <span class={styles.name}>{props.monster.name}</span>
            <span class={styles.statLine}>
                CR {props.monster.cr} · {props.monster.hp} HP · AC {props.monster.ac}
            </span>
        </span>
        <Button transparent class={styles.dropBtn}>⊕</Button>
    </div>;
};
