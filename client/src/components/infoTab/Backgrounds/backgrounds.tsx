import { Component, For  } from "solid-js";
import useStyle from "../../../customHooks/utility/style/styleHook";
import useGetBackgrounds from "../../../customHooks/data/useGetBackgrounds";
import ExpansionPanel from "../../shared/expansion/expansion";
import styles from "./backgrounds.module.scss";
import { effect } from "solid-js/web";

const Viewbackgrounds: Component = () => {

    const stylin = useStyle();
    const backgrounds = useGetBackgrounds();

    return (
        <div class={`${stylin.accent} ${styles.allBackgrounds}`}>
            <h1>Backgrounds</h1>

            

            <div class={`${styles.backgrounds}`} style={{width:"50%"}}>
                <For each={backgrounds()}>
                    {(background) =>
                        
                            <ExpansionPanel styles={styles}>
                                <div>
                                    {background.name}
                                </div>
                                <div class={`${styles.body}`}>
                                    <h2>
                                        {background.name}
                                    </h2>

                                    <div>
                                        <For each={background.feature}>
                                            {(feature) =>
                                                <>
                                                    <span>
                                                        <h3>
                                                            {feature.name}
                                                        </h3>
                                                        <br />
                                                        <span class={`${styles.feature}`}>
                                                            {feature.value}
                                                        </span>
                                                    </span>
                                                    <br />
                                                </>
                                            }
                                        </For>
                                    </div>

                                    <h3>{background.languageChoice.type}</h3>

                                    <h3>choose: {background.languageChoice.choose}</h3>

                                    <div>
                                        <For each={background.languageChoice.choices}>
                                            {(choice)=>
                                                <>
                                                    <span>{choice}</span>
                                                    <br />
                                                </>
                                            }
                                        </For>
                                    </div>

                                    <br />
                                    
                                    <h3>Starting Equipment</h3>
                                    <div>
                                        <For each={background.startingEquipment}>
                                            {(item)=>
                                                <>
                                                    <span>{item.item}</span>
                                                    <br />
                                                </>
                                            }
                                        </For>
                                    </div>

                                    <br />

                                    <div>
                                        <For each={background.startingEquipmentChoices}>
                                            {(choice)=>
                                                <>
                                                    <h3>Choose: {choice.choose}</h3>
                                                    <For each={choice.choices}>
                                                        {(item)=>
                                                            <>
                                                                <span>{item.quantity}  {item.item}</span>
                                                                <br />
                                                            </>
                                                        }
                                                    </For>
                                                </>
                                            }
                                        </For>
                                    </div>
                                    
                                    <h3>Skill Proficiencies</h3>
                                    <div>
                                        <For each={background.startingProficiencies}>
                                            {(prof)=>
                                                <>
                                                    <span>{prof.value}</span>
                                                    <br />
                                                </>
                                            }
                                        </For>
                                    </div>

                                </div>
                            </ExpansionPanel>
                        
                    }
                </For>
            </div>            
        </div>
    )
};
export default Viewbackgrounds;