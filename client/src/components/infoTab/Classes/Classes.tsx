import { Component, For, Show, Switch, Match } from "solid-js";
import useStyle from "../../../customHooks/utility/style/styleHook";
import useGetClasses from "../../../customHooks/data/useGetClasses";
import { it } from "node:test";
import { effect } from "solid-js/web";
import ExpansionPanel from "../../shared/expansion/expansion";
import FeatureTable from "./FeatureTable";

const Viewclasses: Component = () => {

    const stylin = useStyle();
    const dndSrdClasses = useGetClasses();

    effect(()=>{
        console.log(dndSrdClasses());
        
    })


    return (
        <>

            <div class={`${stylin.accent}`}>

                <For each={dndSrdClasses()}>
                    {(Class) =>
                        <div >
                            <h1>{Class.name}</h1>


                            {/* the feature table */}

                            <FeatureTable Class={Class} />

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
                            <ExpansionPanel style={{width:"50%"}}>
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
                            <ExpansionPanel style={{width:"50%"}}>
                                <div>
                                    <h2>
                                        Starting Equipment
                                    </h2>
                                </div>
                                <div>
                                    <br />

                                    <span>
                                        Choose: {Class.startingEquipment.choice1[0].choose}
                                    </span>

                                    <Show when={Class.startingEquipment.choice1.length >= 1}>
                                        <For each={Class.startingEquipment.choice1}>
                                            {(choice, i) =>
                                                <div>   
                                                    <Show when={i() >= 1}>
                                                        <br />
                                                        <span>
                                                            Choose: {choice.choose}
                                                        </span>
                                                        <br />
                                                    </Show>

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
                                                </div>
                                            }
                                        </For>
                                    </Show>
                                    
                                    <br />

                                    <Show when={Class.startingEquipment.choice2}>
                                        <For each={Class.startingEquipment.choice2}>
                                            {(choice)=>
                                                <div>
                                                    <br />
                                                    <span>Choose: {choice.choose}</span>

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
                                                </div>
                                            }
                                        </For>
                                    </Show>

                                    <br />
                                    
                                    <Show when={Class.startingEquipment.choice3}>
                                        <For each={Class.startingEquipment.choice3}>
                                            {(choice)=>
                                                <div>
                                                    <br />
                                                    <span>Choose: {choice.choose}</span>

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
                                                </div>
                                            }
                                        </For>
                                    </Show>

                                    <br />

                                    <Show when={Class.startingEquipment.choice4}>
                                        <For each={Class.startingEquipment.choice4}>
                                            {(choice)=>
                                                <div>
                                                    <br />
                                                    <span>Choose: {choice.choose}</span>

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
        </>
    )
};
export default Viewclasses