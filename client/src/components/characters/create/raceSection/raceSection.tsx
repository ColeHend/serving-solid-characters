import { Accessor, Component, createMemo, For, Show } from "solid-js";
import { FlatCard } from "../../../../shared/components/flatCard/flatCard";
import { Race, Subrace } from "../../../../models/data";
import styles from "./raceSection.module.scss";
import { FormField, Select, Option } from "coles-solid-library";

interface sectionProps {
    selectedRace: Accessor<Race>;
    subraces: Accessor<Subrace[]>;
}

export const RaceSection:Component<sectionProps> = (props) => {
    const race = createMemo(()=>props.selectedRace());
    const subraces = createMemo(()=>props.subraces());
    const currentSubraces = createMemo<Subrace[]>(()=>subraces().filter(sr=>sr.parentRace === race().name));

    const desc = createMemo(()=>race().descriptions ?? {});
    const descKeys = createMemo(()=>Object.keys(desc()));

    return <FlatCard headerName={`Race: ${[race().name]}`} icon="person">
        <div class={`${styles.raceSection}`}>
            <p>
                <For each={descKeys()}>
                    {(key, i)=> <span>{desc()?.[key]} {i() > 1 ? "," : ""}</span>}
                </For>
            </p>    

            <div>
                <strong>Traits: </strong>
                {race().traits.flatMap(t => t.details.name).join(", ")}
            </div>

            <div class={`${styles.traitList}`}>  
                <For each={race().traits}>
                    {(trait)=><FlatCard headerName={`${trait.details.name}`} class={`${styles.cardAlt}`}>
                        <div>
                            <p>
                                {trait.details.description}
                            </p>
                        
                            {trait.details.choiceKey}
                        </div>
                    </FlatCard>}
                </For>
                <Show when={currentSubraces().length > 0}>
                    <FlatCard headerName="subrace">
                        
                    </FlatCard>
                </Show>
            </div>

        </div>
    </FlatCard>
}