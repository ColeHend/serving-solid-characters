import { Component, For, Show } from "solid-js";
import { Race } from "../../../../models/race.model";
import useStyle from "../../../../shared/customHooks/utility/style/styleHook";
import style from "./subrace.module.scss";
import ExpansionPanel from "../../../../shared/components/expansion/expansion";

type Props = {
  race: Race;
  styles: CSSModuleClasses;
};

const Subrace: Component<Props> = (props) => {
  const stylin = useStyle();

  let race = props.race;

  return (
    <>
      <Show when={race?.subRaces?.length > 0}>
        <ExpansionPanel>
          <div>
            <h3>
              Sub Races
            </h3>
          </div>
          <div>
            <Show when={race?.subRaces.length > 0}>
              <br />

              <div>
                <For each={race?.subRaces}>
                  {(subrace) => (
                    <>
                      <div id={`${subrace.name}`} class={`${style.subrace}`}>
                        <span>name: {subrace.name}</span>

                        <br />
                        <br />

                        <span>Ability Score increases:</span>
                        <Show when={subrace.abilityBonuses.length > 0}>
                          <For each={subrace.abilityBonuses}>
                            {(bonus) => (
                              <span>
                                <br />
                                <span>{bonus.name}</span> <span>{bonus.value}</span>
                                <br />
                              </span>
                            )}
                          </For>
                        </Show>


                        {/* ------------------\ Starting Profs /--------------------- */}
                        {/*                
                        <For each={subrace.startingProficiencies}>
                          {(prof) => <>
                            <span>{prof.value}</span>
                            <br />
                          </>}
                        </For> */}

                        <Show when={subrace.traits.length > 0}>
                          <For each={subrace.traits}>
                            {(trait) => (
                              <>  
                                <br />
                                <span>{trait.name}: </span> 
                                <br />
                                <span>{trait.value}</span>
                                <br />
                              </>
                            )}
                          </For>
                        </Show>

                        <br />

                        <Show when={subrace.languages.length > 0}>
                          <span>languages:</span>
                          <br />
                          <span>
                            {subrace.languages.join(", ")}
                          </span>
                        </Show>
                        
                          <Show when={subrace.languageChoice.choices.length > 0}>
                            <h3>languages to choose from</h3>
                            <For each={subrace.languageChoice.choices}>
                              {(choice) => <>
                                <span>{choice}</span>
                                <br />
                              </>}
                            </For>
                          </Show>
                        
                        
                      </div>
                      
                      
                      <br />
                    </>


                  )}
                </For>
              </div>
            </Show>
          </div>
        </ExpansionPanel>
      </Show>
    </>
  );
};

export default Subrace;