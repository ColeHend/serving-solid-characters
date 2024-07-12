import { Component, For, Show, Switch, Match, createSignal, createMemo } from "solid-js";
import ExpansionPanel from "../../shared/expansion/expansion";
import FeatureTable from "./featureTable";
import useGetClasses from "../../../customHooks/data/useGetClasses";
import useStyle from "../../../customHooks/utility/style/styleHook";
import styles from "./viewClasses.module.scss"
import { useSearchParams,useParams } from "@solidjs/router";
import { effect } from "solid-js/web";
import { DnDClass } from "../../../models";
import { LevelEntity, Subclass } from "../../../models/class.model";
import { Feature } from "../../../models/core.model";

const viewClasses: Component = () => {
    const stylin = useStyle();
    const dndSrdClasses = useGetClasses();
    const [searchParam, setSearchParam] = useSearchParams();
    const selectedClass = dndSrdClasses().findIndex((val)=>val.name.toLowerCase() === searchParam.name?.toLowerCase());
    const [currentClassIndex, setCurrentCharacterIndex] = createSignal<number>(selectedClass >= 0 ? selectedClass : 0)
    
    if (!!!searchParam.name) setSearchParam({name: dndSrdClasses().length > 0 ? dndSrdClasses()[currentClassIndex()].name : "barbarian"})
        
    const currentClass = createMemo(()=>dndSrdClasses().length > 0 && currentClassIndex() >= 0 && currentClassIndex() < dndSrdClasses().length ? dndSrdClasses()[currentClassIndex()] : ({} as DnDClass))

    effect(()=>{
        setSearchParam({name: dndSrdClasses().length > 0 ? currentClass().name : "barbarian"})
    })
 
    return (
        <div class={`${stylin.accent} ${styles.CenterPage}`}> 
            {/* Current Class Selector */}
            <div>
                <button onClick={()=>currentClassIndex() === 0 ? setCurrentCharacterIndex(old=> (dndSrdClasses().length - 1)) : setCurrentCharacterIndex(old=>old - 1)}>←</button>
                <span>{currentClass().name}</span>
                <button onClick={()=>currentClassIndex() === (dndSrdClasses().length - 1) ? setCurrentCharacterIndex(old=> 0) : setCurrentCharacterIndex(old=>old + 1)}>→</button>
            </div> 
            <hr style={{width:"100%"}} />
                    <div class={`${styles.eachPage}`}>
                        
                        <h1>{currentClass().name}</h1>

                        {/* the feature table */}
                        <div class={`${styles.CenterTable}`}>
                            <FeatureTable Class={()=>currentClass()} />

                        </div>
                        
                        <h2>Proficiencies</h2>
                        <span>Armor: {currentClass().proficiencies.filter(x => x.includes("armor")).join(", ")} </span> <span><Show when={currentClass().proficiencies.filter(x =>x === "Shields")}>& Shields</Show></span>
                        
                        <br />

                        <span>Weapons: {currentClass().proficiencies.filter(x => x.includes("weapons")).join(", ")} </span>

                        <br />

                        <span>
                            Tools:
                            {/* I give up! heres my fix ↓ */}
                            {/* if you want a tool to show up without the None */}
                            <Show when={!currentClass().proficiencies.includes("Thieves' Tools") && !currentClass().proficiencies.includes("Herbalism Kit")}>
                                None
                            </Show>
                            <Show when={!currentClass().proficiencies.includes("Kit")}>
                                {currentClass().proficiencies.filter(x => x.includes("Kit"))}
                            </Show>
                            <Show when={!currentClass().proficiencies.includes("Tools" || "tools")}>
                                {currentClass().proficiencies.filter(x => x.includes("Tools" || "tools")).join(", ")}
                            </Show>
                        </span>

                        <br />

                        <br />

                        <span>
                            Saving Throws: {currentClass().savingThrows.join(", ")}
                        </span>

                        <br />
                        <br />
                        
                        {/* Skills */}
                        <ExpansionPanel class={`${styles.Center}`} style={{width:"50%"}}>
                            <div>
                                <h2>
                                    Skills
                                </h2>
                            </div>
                            <div>
                                <Show when={currentClass().proficiencyChoices.length > 0}>
                                    <For each={currentClass().proficiencyChoices}>
                                        {(Choice)=>
                                            <>  
                                                <br />

                                                <span>Choose: {Choice.choose}</span>

                                                <br />

                                                <For each={Choice.choices}>
                                                    {(choice)=>
                                                        <>
                                                            <span>{choice}</span>
                                                            <br />
                                                        </>
                                                    }
                                                </For>
                                            </>
                                        }
                                    </For>
                                </Show>
                                
                                <br />
                            </div>
                        </ExpansionPanel>

                        <br />
                        
                        {/* Starting Equipment */}
                        <ExpansionPanel class={`${styles.Center}`} style={{width:"50%"}}>
                            <div>
                                <h2>
                                    Starting Equipment
                                </h2>
                            </div>
                            <div>
                                <br />

                                <Show when={currentClass().startingEquipment.choice1.length >= 1}>
                                    <For each={currentClass().startingEquipment.choice1}>
                                        {(choice, i) =>
                                            <div>   
                                                <Show when={i() < 1}>
                                                    <h3>choice 1</h3>
                                                </Show>

                                                <br />
                                                 
                                                <Show when={i() < 1}>
                                                    <span>choose:  {choice.choose}</span>
                                                </Show>

                                                <br />

                                                <span>
                                                    <For each={choice.choices}>
                                                        {(item,i)=>
                                                            <>
                                                                <br />
                                                                <span>{item.item}</span>
                                                                <br />
                                                            </>
                                                        }
                                                    </For>
                                                </span>

                                                <Show when={i() <= 0}>
                                                    <br />
                                                    <span>or</span>
                                                </Show>
                                            </div>
                                        }
                                    </For>
                                </Show>
                            
                                <Show when={currentClass().startingEquipment.choice2}>
                                    <For each={currentClass().startingEquipment.choice2}>
                                        {(choice, i)=>
                                            <div>
                                                <Show when={i() < 1}>
                                                    <h3>choice 2</h3>
                                                </Show>

                                                <br />

                                                <Show when={i() < 1}>
                                                    <span>choose:  {choice.choose}</span>
                                                </Show>

                                                <br />

                                                <span>
                                                    <For each={choice.choices}>
                                                        {(item)=>
                                                            <>
                                                               <br />
                                                                <span>{item.item}</span>

                                                                <br />
                                                            </>
                                                        }
                                                    </For>
                                                </span>
                                                
                                                <Show when={i() <= 0}>
                                                    <br />
                                                    <span>or</span>
                                                </Show>
                                            </div>
                                        }
                                    </For>
                                </Show>
                                
                                <Show when={currentClass().startingEquipment.choice3}>
                                    <For each={currentClass().startingEquipment.choice3}>
                                        {(choice, i)=>
                                            <div>
                                                <Show when={i() < 1}>
                                                    <h3>choice 3</h3>
                                                </Show>

                                                <br />

                                                <Show when={i() < 1}>
                                                    <span>choose:  {choice.choose}</span>
                                                </Show>

                                                <br />

                                                <span>
                                                    <For each={choice.choices}>
                                                        {(item)=>
                                                            <>
                                                                <br />
                                                                <span>{item.item}</span>

                                                                <br />
                                                            </>
                                                        }
                                                    </For>
                                                </span>

                                                <Show when={i() <= 0}>
                                                    <br />
                                                    <span>or</span>
                                                </Show>
                                            </div>
                                        }
                                    </For>
                                </Show>

                                <Show when={currentClass().startingEquipment.choice4}>
                                    <For each={currentClass().startingEquipment.choice4}>
                                        {(choice, i)=>
                                            <div>
                                                <Show when={i() < 1}>
                                                    <h3>choice 4</h3>
                                                </Show>
                                                
                                                <br />

                                                <Show when={i() < 1}>
                                                    <span>choose:  {choice.choose}</span>
                                                </Show>

                                                <span>
                                                    <For each={choice.choices}>
                                                        {(item)=>
                                                            <>
                                                                <br />
                                                                <span>{item.item}</span>

                                                                <br />
                                                            </>
                                                        }
                                                    </For>
                                                </span>

                                                <Show when={i() <= 0}>
                                                    <br />
                                                    <span>or</span>
                                                </Show>
                                            </div>
                                        }
                                    </For>
                                </Show>
                            </div>
                        </ExpansionPanel>

                        
                        {/* add feature and Subclass carousell */}

                    </div>
                
        </div>
    )
};
export default viewClasses