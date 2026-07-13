import { Component } from "solid-js";
import { Input } from "coles-solid-library";
import styles from './social.module.scss';

export interface Npc {
    name: string;
    disposition: 'Friendly' | 'Neutral' | 'Hostile';
    goal: string;
    personality: string;
}

interface NpcCardProps {
    npc: Npc;
}

export const NpcCard: Component<NpcCardProps> = (props) => {
    return <div class={styles.npcCard}>
        <div class={styles.npcHead}>
            <span class={styles.npcAvatar}>{props.npc.name.slice(0, 1).toUpperCase()}</span>
            <span class={styles.npcName}>{props.npc.name}</span>
            <span class={styles.npcSpacer} />
            <span class={`${styles.dispositionTag} ${styles[`disposition${props.npc.disposition}`]}`}>
                {props.npc.disposition}
            </span>
        </div>
        <Input value={props.npc.goal} placeholder="Goal" tooltip="What this NPC wants" />
        <Input value={props.npc.personality} placeholder="Personality" tooltip="How they act" />
    </div>;
};
