import { Component, For, Show, Switch, Match } from "solid-js";
import useStyle from "../../../customHooks/utility/style/styleHook";
import useGetClasses from "../../../customHooks/data/useGetClasses";

const Viewclasses: Component = () => {

    const stylin = useStyle();
    const dndSrdClasses = useGetClasses();

    return (
        <>

            <div class={`${stylin.accent}`}>

                <For each={dndSrdClasses()}>
                    {(Class) =>
                        <div>
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
                                <Switch fallback={<div>None</div>}>
                                    <Match when={Class.proficiencies.includes("Kit")}>
                                        {Class.proficiencies.filter(x => x.includes("Kit"))}
                                    </Match>
                                    <Match when={!Class.proficiencies.includes("Tools" || "tools")}>
                                        {Class.proficiencies.filter(x => x.includes("Tools" || "tools")).join(", ")}
                                    </Match>
                                </Switch>
                            </span>
                        </div>
                    }
                </For>
            </div>
        </>
    )
};
export default Viewclasses