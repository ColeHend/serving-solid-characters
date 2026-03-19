import { Button, Chip } from "coles-solid-library";
import { Accessor, Component, createMemo, For, Setter, Show } from "solid-js";
import { FlatCard } from "../../../../../../shared/components/flatCard/flatCard";
import styles from "../../Background.module.scss";

interface SectionProps {
    weaponProfs: Accessor<string[]>;
    armorProfs: Accessor<string[]>;
    skillProfs: Accessor<string[]>;
    toolProfs: Accessor<string[]>;
    setShowPopup: Setter<boolean>;
}

export const Proficiencies: Component<SectionProps> = (props) => {
    const weaponProfs = createMemo(() => props.weaponProfs());
    const armorProfs = createMemo(() => props.armorProfs());
    const skillProfs = createMemo(() => props.skillProfs());
    const toolProfs = createMemo(() => props.toolProfs());

    return <FlatCard headerName="Proficiencies" extraHeaderJsx={<Button onClick={()=>props.setShowPopup(old => !old)}>Edit</Button>} icon='shield' transparent>
        <div class={`${styles.ProficiencyBar}`}>
            <span>Weapons: </span>
            <Show when={weaponProfs().length > 0} fallback={<Chip value="None" />}>
                <For each={weaponProfs()}>
                    {(prof) => <Chip value={prof} />}
                </For>
            </Show>
        </div>
        <div class={`${styles.ProficiencyBar}`}>
            <span>Armor: </span>
            <Show when={armorProfs().length > 0} fallback={<Chip value="None" />}>
                <For each={armorProfs()}>
                    {(prof) => <Chip value={prof} />}
                </For>
            </Show> 
        </div>
        <div class={`${styles.ProficiencyBar}`}>
            <span>skills: </span>
            <Show when={skillProfs().length > 0} fallback={<Chip value="None" />}>
                <For each={skillProfs()}>
                    {(prof) => <Chip value={prof} />}
                </For>
            </Show>
        </div>
        <div class={`${styles.ProficiencyBar}`}>
            <span>Tools: </span>
            <Show when={toolProfs().length > 0} fallback={<Chip value="None"/>}>
                <For each={toolProfs()}>
                    {(prof) => <Chip value={prof} />}
                </For>
            </Show>
        </div>
    </FlatCard>
}