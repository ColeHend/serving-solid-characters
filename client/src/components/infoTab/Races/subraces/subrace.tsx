import { Component, For, Match, Show, Switch, createMemo, createSignal } from "solid-js";
import { Race } from "../../../../models/race.model";
import useStyle from "../../../../customHooks/utility/style/styleHook";
import style from "./subrace.module.scss";

type Props = {
    race: Race;
    styles: CSSModuleClasses;
}

const Subrace: Component<Props> = (props) => {
    const stylin = useStyle();

    let race = props.race;

    return (
        <>
 <Show when={race.subRaces.length > 0}>
                        <h2>subraces</h2>
                        
                        <div>
                          <For each={race.subRaces}>
                            {(subrace) =>
                              <div class={`${style.subrace}`} style={{display:"flex", "flex-direction":"column"}}>

                                <span>name: {subrace.name}</span>
                                
                                <br />

                                <span>Ability Score increases:</span>
                                <Show when={subrace.abilityBonuses.length > 0}>
                                    <For each={subrace.abilityBonuses}>
                                      {(bonus) =>
                                      <span>
                                        <span>{bonus.name}</span> <span>{bonus.value}</span>
                                      </span>
                                      }
                                    </For>
                                </Show>

                                <br />


                                  {/* ------------------\ Starting Profs /--------------------- */}
                                  <For each={subrace.startingProficiencies}>
                                        {(prof) =>
                                            <span>{prof.value}</span>
                                        }
                                  </For>
                               


                                <Show when={subrace.traits.length > 0}>
                                    <For each={subrace.traits}>
                                      {(trait)=>
                                        <>
                                          <span>{trait.name}: </span> <span>{trait.value}</span>
                                          <br />
                                        </>
                                      }
                                    </For>
                                </Show>
                                
                                <br />

                                
                                <Show when={subrace.languages.length > 0}>
                                  <span>languages</span>
                                  <For each={subrace.languages}>
                                      {(Lang)=>
                                        <span>{Lang}</span>
                                      }
                                  </For>
                                </Show>

                                <Show when={subrace.languageChoice.choices.length > 0}>
                                      <h3>languages to choose from</h3>
                                      <For each={subrace.languageChoice.choices}>
                                        {(choice)=>
                                          <span>{choice}</span>
                                        }
                                      </For>
                                </Show>
                              </div>
                            }
                          </For>
                        </div>

                      </Show>
        </>
    )
};

export default Subrace;