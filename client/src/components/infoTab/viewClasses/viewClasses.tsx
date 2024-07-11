import { Component, For, Show, Switch, Match } from "solid-js";
import ExpansionPanel from "../../shared/expansion/expansion";
import FeatureTable from "./featureTable";
import useGetClasses from "../../../customHooks/data/useGetClasses";
import useStyle from "../../../customHooks/utility/style/styleHook";
import styles from "./viewClasses.module.scss"
import { effect } from "solid-js/web";

const viewClasses: Component = () => {
    const stylin = useStyle();
    const dndSrdClasses = useGetClasses();

    effect(()=>{
        console.log(dndSrdClasses());
        
    })

    

    return (
        <div class={`${styles.CenterPage} ${stylin.accent}`}> 

                <For each={dndSrdClasses()}>
                    {(Class) =>
                        <div class={`${styles.eachPage}`}>
                            <h1>{Class.name}</h1>


                            {/* the feature table */}
                            <div class={`${styles.CenterTable}`}>
                                <FeatureTable Class={Class} />

                            </div>
                            
                            <h2>Proficiencies</h2>
                            <span>Armor: {Class.proficiencies.filter(x => x.includes("armor")).join(", ")} </span> <span><Show when={Class.proficiencies.filter(x =>x === "Shields")}>& Shields</Show></span>
                            
                            <br />

                            <span>Weapons: {Class.proficiencies.filter(x => x.includes("weapons")).join(", ")} </span>

                            <br />

                            <span>
                                Tools:
                                {/* I give up! heres my fix ↓ */}
                                {/* if you want a tool to show up without the None */}
                                <Show when={!Class.proficiencies.includes("Thieves' Tools") && !Class.proficiencies.includes("Herbalism Kit")}>
                                    None
                                </Show>
                                <Show when={!Class.proficiencies.includes("Kit")}>
                                    {Class.proficiencies.filter(x => x.includes("Kit"))}
                                </Show>
                                <Show when={!Class.proficiencies.includes("Tools" || "tools")}>
                                    {Class.proficiencies.filter(x => x.includes("Tools" || "tools")).join(", ")}
                                </Show>
                            </span>

                            <br />
                            

                            <br />


                            <span>
                                Saving Throws: {Class.savingThrows.join(", ")}
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
                                    <Show when={Class.proficiencyChoices.length > 0}>
                                        <For each={Class.proficiencyChoices}>
                                            {(Choice)=>
                                                <>  
                                                    <br />

                                                    <span>Choose: {Choice.choose}</span>

                                                    <br />
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

                                    <Show when={Class.startingEquipment.choice1.length >= 1}>
                                        <For each={Class.startingEquipment.choice1}>
                                            {(choice, i) =>
                                                <div>   
                                                    <Show when={i() < 1}>
                                                        <h3>choice 1</h3>
                                                    </Show>

                                                    <br />
                                                     
                                                    <Show when={i() < 1}>
                                                        <span>choose:  {choice.choose}</span>
                                                    </Show>

                                                    <span>
                                                        <For each={choice.choices}>
                                                            {(item,i)=>
                                                                <>
                                                                    <br />
                                                                    <span>{item.item}</span>



                                                                    <br />
                                                                    <br />
                                                                </>
                                                            }
                                                        </For>
                                                    </span>
                                                </div>
                                            }
                                        </For>
                                    </Show>
                                    
                                    <br />
                                    <br />

                                    <Show when={Class.startingEquipment.choice2}>
                                        <For each={Class.startingEquipment.choice2}>
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
                                                                    <br />
                                                                </>
                                                            }
                                                        </For>
                                                    </span>
                                                </div>
                                            }
                                        </For>
                                    </Show>

                                    <br />
                                    
                                    <Show when={Class.startingEquipment.choice3}>
                                        <For each={Class.startingEquipment.choice3}>
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
                                                                    <br />
                                                                </>
                                                            }
                                                        </For>
                                                    </span>
                                                </div>
                                            }
                                        </For>
                                    </Show>

                                    <br />

                                    <Show when={Class.startingEquipment.choice4}>
                                        <For each={Class.startingEquipment.choice4}>
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
                                                                    <br />
                                                                </>
                                                            }
                                                        </For>
                                                    </span>
                                                </div>
                                            }
                                        </For>
                                    </Show>
                                </div>
                            </ExpansionPanel>


                            <hr style={{width:"100%"}} />                           
                        </div>
                    }
                </For>
        </div>
    )
};
export default viewClasses
