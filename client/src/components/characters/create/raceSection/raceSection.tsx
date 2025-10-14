import { Accessor, Component, createMemo, For, onMount, Setter, Show } from "solid-js";
import { FlatCard } from "../../../../shared/components/flatCard/flatCard";
import { AbilityScores, Race, Subrace } from "../../../../models/data";
import styles from "./raceSection.module.scss";
import { FormField, Select, Option, ExpansionPanel } from "coles-solid-library";
import { useDnDSubraces } from "../../../../shared/customHooks/dndInfo/info/all/subraces";

interface sectionProps {
    selectedRace: Accessor<Race>;
    subraces: Accessor<Subrace[]>;
    charSubrace: [Accessor<string>,Setter<string>];
}

export const RaceSection:Component<sectionProps> = (props) => {
    const [charSubrace, setCharSubrace] = props.charSubrace;

    const race = createMemo(()=>props.selectedRace());
    // const subraces = createMemo(()=>props.subraces());
    const subraces = useDnDSubraces();
    
    const currentSubraces = createMemo<Subrace[]>(()=>subraces().filter(sr=>sr.parentRace === race().id));
    const desc = createMemo(()=>race().descriptions ?? {});
    const descKeys = createMemo(()=>Object.keys(desc()));
    const currentSubrace = createMemo(()=>subraces().find(sr=> sr.name === charSubrace()));
    const subraceDescKeys = createMemo(()=>Object.keys(currentSubrace()?.descriptions ?? {}))

    onMount(()=>{
        console.log("subraces: ", subraces());
        
    })

    return <FlatCard headerName={`Species: ${[race().name]}`} icon="person">
        <div class={`${styles.raceSection}`}>
            <p>
                <For each={descKeys()}>
                    {(key, i)=> <span>{desc()?.[key]} {i() > 1 ? "," : ""}</span>}
                </For>
            </p>    
            
            <Show when={race().abilityBonuses.length > 0}>
                <div>
                    <strong>Ability Score(s): </strong>
                    <For each={race().abilityBonuses}>
                        {(score)=><span>
                            {AbilityScores[score.stat]}: {score.value}
                        </span>}
                    </For>
                </div>
            </Show>

            <div>
                <strong>Size: </strong>
                {race().size}
            </div>

            <div>
                <strong>Speed: </strong>
                {race().speed}ft
            </div>

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
                <Show when={currentSubraces().length >= 1}>
                    <FlatCard headerName="Lineage" class={`${styles.cardAlt}`}>
                        <div>
                            The bloodlines of your chosen species branch into many distinct heritages. 
                            Each lineage carries its own legacy—some noble, some forgotten, some whispered of only in ancient tales. 
                            <div>
                                Choose the lineage that shapes your destiny:
                            </div>
                        </div>
                        <div class={`${styles.pushDown}`}>
                            <FormField name="Lineage" formName="Lineage">
                                <Select value={charSubrace()} onChange={(value)=>setCharSubrace(value)}>
                                    <Option value={"-"}>---</Option>
                                    <For each={currentSubraces()}>
                                        {(subrace)=><Option value={subrace.name}>{subrace.name}</Option>}
                                    </For>
                                </Select>
                            </FormField>
                        </div>
                        <Show when={currentSubrace()}>
                            <div class={`${styles.subraceInfo}`}>
                                <div>
                                    <For each={subraceDescKeys()}>
                                        {(descKey)=><span>
                                            {currentSubrace()?.descriptions?.[descKey]}
                                        </span>} 
                                    </For>
                                </div>
                                
                                <Show when={(currentSubrace()?.abilityBonuses ?? []).length > 0}>
                                    <div class={`${styles.pushDown}`}>
                                        <strong>Ability Score(s): </strong>
                                        <For each={currentSubrace()?.abilityBonuses ?? []}>
                                            {(abs)=><span>
                                                {AbilityScores[abs.stat]}: {abs.value} 
                                            </span>}
                                        </For>
                                    </div>
                                </Show>

                                <div class={`${styles.pushDown}`}>
                                    <strong>Size: </strong>
                                    {currentSubrace()?.size}
                                </div>

                                <div class={`${styles.pushDown}`}>
                                    <strong>Speed: </strong>
                                    {currentSubrace()?.speed}
                                </div>

                                <Show when={(currentSubrace()?.traits ?? []).length > 0}>
                                    <div>
                                        <h3>Feature(s): </h3>
                                        <For each={currentSubrace()?.traits ?? []}>
                                            {(trait)=><FlatCard headerName={`Feature: ${trait.details.name}`} class={`${styles.pushDown} ${styles.cardTrsiary}`}>
                                                <div>
                                                    <div>
                                                        {trait.details.description}
                                                    </div>
                                                </div>
                                            </FlatCard>}
                                        </For>
                                    </div>
                                </Show>




                            </div>
                        </Show>
                    </FlatCard>
                </Show>
            </div>

        </div>
    </FlatCard>
}