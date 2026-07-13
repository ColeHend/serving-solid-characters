import { Component } from "solid-js";
import { Button } from "coles-solid-library";
import { PartyMember } from "../../hooks/party";
import { HpStepper } from "../../shared/hpStepper/hpStepper";
import styles from './party.module.scss';

interface PartyMemberRowProps {
    member: PartyMember;
    onHpChange: (hp: number) => void;
    onRemove: () => void;
}

export const PartyMemberRow: Component<PartyMemberRowProps> = (props) => {
    return <div class={styles.row}>
        <div class={styles.topLine}>
            <span class={styles.name}>{props.member.name}</span>
            <span class={styles.stats}>
                <span class={styles.stat}>AC {props.member.ac}</span>
                <span class={styles.stat}>PP {props.member.pp}</span>
            </span>
            <Button transparent class={styles.removeBtn} onClick={props.onRemove}>✕</Button>
        </div>
        <HpStepper
            current={props.member.hp}
            max={props.member.maxHp}
            onChange={props.onHpChange} />
    </div>;
};
