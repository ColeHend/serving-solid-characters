import { Component } from "solid-js";
import { Button } from "coles-solid-library";
import styles from './bestiary.module.scss';
import { Monster } from "../../../../shared";

interface MonsterRowProps {
    monster: Monster;
}

export const MonsterRow: Component<MonsterRowProps> = (props) => {
    return <div class={styles.row}>
        <span class={styles.info}>
            <span class={styles.name}>{props.monster.name}</span>
            <span class={styles.statLine}>
                CR {props.monster.challengeRating} · {props.monster.health.max} HP · AC {props.monster.armorClass}
            </span>
        </span>
        <Button transparent class={styles.dropBtn}>⊕</Button>
    </div>;
};
