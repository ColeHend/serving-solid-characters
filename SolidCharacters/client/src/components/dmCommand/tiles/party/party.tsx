import { Component, For, createSignal } from "solid-js";
import { Button, Input, NumberInput } from "coles-solid-library";
import { useParty } from "../../hooks/party";
import { SectionLabel } from "../../shared/sectionLabel/sectionLabel";
import { PartyMemberRow } from "./partyRow";
import styles from './party.module.scss';

export const PartyTile: Component = () => {
    const { getParty, setMemberHp, addMember, removeMember } = useParty();
    const [name, setName] = createSignal('');
    const [hp, setHp] = createSignal(10);
    const [ac, setAc] = createSignal(10);

    const add = () => {
        if (!name().trim()) return;
        addMember(name(), hp(), ac());
        setName('');
    };

    return <div class={styles.tile}>
        <SectionLabel label="Party" />
        <div class={styles.rows}>
            <For each={getParty()}>{(member) =>
                <PartyMemberRow
                    member={member}
                    onHpChange={(newHp) => setMemberHp(member.id, newHp)}
                    onRemove={() => removeMember(member.id)} />
            }</For>
        </div>
        <div class={styles.addRow}>
            <Input placeholder="Name" value={name()}
                onChange={(e) => setName(e.currentTarget.value)} />
            <span class={styles.addNum}>
                <NumberInput hideSteppers placeholder="HP" tooltip="Max hit points" value={hp()}
                    onChange={(e) => setHp(Number(e.currentTarget.value) || 0)} />
            </span>
            <span class={styles.addNum}>
                <NumberInput hideSteppers placeholder="AC" tooltip="Armor class" value={ac()}
                    onChange={(e) => setAc(Number(e.currentTarget.value) || 0)} />
            </span>
            <Button transparent class={styles.addBtn} onClick={add}>Add</Button>
        </div>
    </div>;
};
