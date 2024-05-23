import { Component, For, Show, Switch, Match } from "solid-js";
import useStyle from "../../../customHooks/utility/style/styleHook";
import useGetClasses from "../../../customHooks/data/useGetClasses";
import { it } from "node:test";
import { effect } from "solid-js/web";

const Viewclasses: Component = () => {

    const stylin = useStyle();
    const dndSrdClasses = useGetClasses();

    effect(()=>{
        console.log(dndSrdClasses());
        
    })

    const sortProfs = (Profs: string[])=> {
        let toReturn = []
    
    
    
    
    }

    return (
        <>

            <div class={`${stylin.accent}`}>

                <For each={dndSrdClasses()}>
                    {(Class) =>
                        <div >
                            <h1>{Class.name}</h1>


                            {/* here will go the feature table */}


                            {/* other class features ↓ */}

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

                            <h2>
                                Skills
                            </h2>

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
                    }
                </For>
            </div>
        </>
    )
};
export default Viewclasses