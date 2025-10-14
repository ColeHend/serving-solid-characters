import { Accessor, Component, createMemo, For, Show } from "solid-js";
import { FlatCard } from "../../../../shared/components/flatCard/flatCard";
import { Background } from "../../../../models/data";
import { Markdown } from "../../../../shared";
import { useDnDFeats } from "../../../../shared/customHooks/dndInfo/info/all/feats";
import styles from "./backgroundSection.module.scss";

interface sectionProps {
    background: Accessor<Background>;
}

export const BackgroundSection:Component<sectionProps> = (props) => {
    const feats = useDnDFeats();

    const selBackground = createMemo(()=>props.background());

    const langs = createMemo(()=>selBackground().languages?.options || []);
    const features = createMemo(()=>selBackground().features || []);
    const abilityOptions = createMemo(()=>selBackground().abilityOptions || []);
    const suggestedFeat = createMemo(()=>selBackground().feat || "");
    const itemOptionKeys = createMemo(()=>selBackground().startEquipment.flatMap(item => item.optionKeys || []));
    const weaponsProfs = createMemo(()=>selBackground().proficiencies.weapons);
    const armorProfs = createMemo(()=>selBackground().proficiencies.armor);
    const toolsProfs = createMemo(()=>selBackground().proficiencies.tools);
    const skillProfs = createMemo(()=>selBackground().proficiencies.skills);

    const getFeature = (name: string) => {
        if (name.toLowerCase().includes("magic initiate")) {
            name = "Magic Initiate"
        }

        return createMemo(()=>feats().find(f => f.details.name === name));
    }

    return <FlatCard icon="home" headerName={`Background: ${selBackground().name}`}>
        <div>
            <div style={{"margin-bottom": "2%"}}>
                <Markdown 
                    text={selBackground().desc}
                />
            </div>
            
            <Show when={abilityOptions().length > 0}>
                <div style={{"margin-bottom": "1%"}}>
                    <strong>Ability Score(s): </strong>
                    {abilityOptions().join(", ")}
                </div>
            </Show>

            <Show when={weaponsProfs().length > 0} fallback={
                <div>
                    <strong>Weapons: </strong>
                    None
                </div>
            }>
                <div>
                    <strong>Weapons: </strong>
                    {weaponsProfs().join(", ")}
                </div>
            </Show>

            <Show when={armorProfs().length > 0} fallback={
                <div>
                    <strong>Armor: </strong>
                    None
                </div>
            }>
                <div>
                    <strong>Armor: </strong>
                    {armorProfs().join(", ")}
                </div>
            </Show>

            <Show when={toolsProfs().length > 0} fallback={
                <div>
                    <strong>Tools: </strong>
                    None
                </div>
            }>
                <div>
                    <strong>Tools: </strong>
                    {toolsProfs().join(", ")}
                </div>
            </Show>

            <Show when={skillProfs().length > 0} fallback={
                <div>
                    <strong>Skills: </strong>
                    None
                </div>
            }>
                <div>
                    <strong>Skills: </strong>
                    {skillProfs().join(", ")}
                </div>
            </Show>

            <Show when={suggestedFeat() !== "" && suggestedFeat()}>
                <div>
                    <h3>Suggested Feat: </h3>
                    <FlatCard headerName={suggestedFeat()} class={`${styles.cardAlt}`}>
                        <div>
                            <Markdown
                                text={getFeature(suggestedFeat())()?.details.description || ""}
                            />
                        </div>
                    </FlatCard>
                </div>
            </Show>

            <Show when={features().length > 0}>
                <div>
                    <h3>Feature(s): </h3>
                    <For each={features()}>
                        {(feature)=><FlatCard headerName={`Feature: ${feature.name}`} class={`${styles.cardAlt}`}>
                            {feature.description}
                        </FlatCard>}
                    </For>
                </div>
            </Show>

            
        </div>
    </FlatCard>
}