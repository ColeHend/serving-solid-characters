import { Accessor, Component, createMemo, For, onMount, Setter, Show } from "solid-js";
import { FlatCard } from "../../../../shared/components/flatCard/flatCard";
import { AbilityScores, Race, Subrace } from "../../../../models/data";
import styles from "./raceSection.module.scss";
import { FormField, Select, Option, ExpansionPanel, FormGroup } from "coles-solid-library";
import { useDnDSubraces } from "../../../../shared/customHooks/dndInfo/info/all/subraces";
import { CharacterForm } from "../../../../models/character.model";

interface sectionProps {
    subraces: Accessor<Subrace[]>;
    races: Accessor<Race[]>;
    formGroup: FormGroup<CharacterForm>;
}

export const RaceSection:Component<sectionProps> = (props) => {

    const form = createMemo(()=>props.formGroup);

    const raceName = createMemo(()=>form().get().race);

    const srdRaces = createMemo(()=>props.races());

    const charRace = createMemo(()=>srdRaces().find((race,i)=>race.name === raceName()) ?? {} as Race);
    const subraces = createMemo(()=>props.subraces());
    
    const charSubrace = createMemo(()=>form().get().lineage);

    const currentSubraces = createMemo<Subrace[]>(()=>subraces().filter(sr=>sr.parentRace === charRace()?.id));
    const desc = createMemo(()=>charRace()?.descriptions ?? {});
    const descKeys = createMemo(()=>Object.keys(desc()));
    const currentSubrace = createMemo(()=>subraces().find(sr=> sr.name === charSubrace()));
    const subraceDescKeys = createMemo(()=>Object.keys(currentSubrace()?.descriptions ?? {}))

    return <FlatCard headerName={`Species: ${[charRace().name]}`} icon="person" transparent>
        <div class={`${styles.raceSection}`}>
            <p>
                <For each={descKeys()}>
                    {(key, i)=> <span>{desc()?.[key]} {i() > 1 ? "," : ""}</span>}
                </For>
            </p>    
            
            <Show when={charRace().abilityBonuses.length > 0}>
                <div>
                    <strong>Ability Score(s): </strong>
                    <For each={charRace().abilityBonuses}>
                        {(score)=><span>
                            {AbilityScores[score.stat]}: {score.value}
                        </span>}
                    </For>
                </div>
            </Show>
            <div>
                <strong>Size: </strong>
                {charRace().size}
            </div>

            <div>
                <strong>Speed: </strong>
                {charRace().speed}ft
            </div>

            <div>
                <strong>Traits: </strong>
                {charRace().traits.flatMap(t => t.details.name).join(", ")}
            </div>

            <div class={`${styles.traitList}`}>  
                <For each={charRace().traits}>
                    {(trait)=><FlatCard headerName={`${trait.details.name}`} class={`${styles.cardAlt}`} transparent>
                        <div>
                            <p>
                                {trait.details.description}
                            </p>
                        
                            {trait.details.choiceKey}
                        </div>
                    </FlatCard>}
                </For>
                <Show when={currentSubraces().length >= 1}>
                    <FlatCard headerName="Lineage" class={`${styles.cardAlt}`} transparent>
                        <div>
                            The bloodlines of your chosen species branch into many distinct heritages. 
                            Each lineage carries its own legacy—some noble, some forgotten, some whispered of only in ancient tales. 
                            <div>
                                Choose the lineage that shapes your destiny:
                            </div>
                        </div>
                        <div class={`${styles.pushDown}`}>
                            <FormField name="Lineage" formName="lineage">
                                <Select>
                                    <Option value={""}>---</Option>
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
                                            {(trait)=><FlatCard headerName={`Feature: ${trait.details.name}`} class={`${styles.pushDown} ${styles.cardTrsiary}`} transparent>
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