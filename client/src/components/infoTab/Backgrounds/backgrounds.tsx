import { Component, createMemo, createSignal, For  } from "solid-js";
import useStyle from "../../../shared/customHooks/utility/style/styleHook";
import useGetBackgrounds from "../../../shared/customHooks/data/useGetBackgrounds";
import ExpansionPanel from "../../../shared/components/expansion/expansion";
import styles from "./backgrounds.module.scss";
import { effect } from "solid-js/web";
import SearchBar from "../../../shared/components/SearchBar/SearchBar";

const Viewbackgrounds: Component = () => {

    const stylin = useStyle();
    const backgrounds = useGetBackgrounds();
    const [searchResult, setSearchResult] = createSignal(backgrounds() || []);
    const displayResults = createMemo(()=>{
        if (searchResult().length === 0) return backgrounds();
        return searchResult();
    })
    effect(()=>{    
        console.log("backgrounds: ", backgrounds());
    });

    return (
        <div class={`${stylin.accent} ${styles.allBackgrounds}`}>
            <h1>Backgrounds</h1>
            <div style={{width: "35%", height: "5vh", margin: "0 auto"}}>
                <SearchBar placeholder="Search Backgrounds..." dataSource={backgrounds} setResults={setSearchResult} />
            </div>
            <div class={`${styles.backgrounds}`} style={{width:"50%"}}>
                <For each={displayResults()}>
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