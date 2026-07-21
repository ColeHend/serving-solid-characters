import { Favorite } from "coles-solid-library/icons";
import { PipRow } from "../PipRow/PipRow";
import styles from "../../sheet.module.scss";
import { Accessor, Component } from "solid-js";
import { Character } from "../../../../../../models/character.model";
import { SectionCard } from "../SectionCard/SectionCard";

interface props {
    currentCharacter: Accessor<Character | undefined>;
    onSetDeathSaves: (kind: "successes" | "failures", value: number) => void;
}

export const DeathSavesCard:Component<props> = (props) => {
    const ds = () => props.currentCharacter()?.deathSaves ?? { successes: 0, failures: 0 };
    
    return <SectionCard icon={Favorite} title="Death Saves">
        <div class={styles.deathRow}>
            <span class={styles.deathRowLabel}>Successes</span>
            <PipRow total={3} filled={ds().successes} shape="circle" tone="success" onToggle={(value) => props.onSetDeathSaves("successes", value)} />
        </div>
        <div class={styles.deathRow}>
            <span class={styles.deathRowLabel}>Failures</span>
            <PipRow total={3} filled={ds().failures} shape="circle" tone="fail" onToggle={(value) => props.onSetDeathSaves("failures", value)} />
        </div>
    </SectionCard>
};