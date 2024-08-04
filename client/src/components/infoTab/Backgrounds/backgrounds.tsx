import { Component, createMemo, createSignal, For  } from "solid-js";
import useStyle from "../../../shared/customHooks/utility/style/styleHook";
import useGetBackgrounds from "../../../shared/customHooks/data/useGetBackgrounds";
import ExpansionPanel from "../../../shared/components/expansion/expansion";
import styles from "./backgrounds.module.scss";
import { effect } from "solid-js/web";
import SearchBar from "../../../shared/components/SearchBar/SearchBar";
import { useSearchParams } from "@solidjs/router";
import { Background } from "../../../models";

const Viewbackgrounds: Component = () => {

    const stylin = useStyle();
    const backgrounds = useGetBackgrounds();
    const [searchResult, setSearchResult] = createSignal(backgrounds() || []);
    const displayResults = createMemo(()=>{
        if (searchResult().length === 0) return backgrounds();
        return searchResult();
    })

    const [searchParam, setSearchParam] = useSearchParams();
    if (!!!searchParam.name) setSearchParam({name: backgrounds()[0]?.name})
    const selectedBackground = backgrounds().filter(x=>x.name.toLowerCase() === (searchParam.name || backgrounds()[0].name).toLowerCase())[0]
    const [currentBackground,setCurrentBackground] = createSignal<Background>(selectedBackground); 

    effect(()=>{    
        setSearchParam({name: currentBackground()?.name})
    });

    const setTheCurrentBackG = (item?: object )=> {
        setCurrentBackground(item as Background);
    }

    return (
        <div class={`${stylin.primary} ${styles.allBackgrounds}`}>
            <h1>Backgrounds</h1>
            <div style={{width: "35%", height: "5vh", margin: "0 auto"}}>
                <SearchBar placeholder="Search Backgrounds..." dataSource={backgrounds} setResults={setSearchResult} />
            </div>
            <div class={`${styles.backgrounds}`} >
                <For each={displayResults()}>
                    {(background) =>
                        
                            <ExpansionPanel extraSetter={setTheCurrentBackG(background)} styles={styles}>
                                <div>
                                    {currentBackground().name}
                                </div>
                                <div class={`${styles.body}`}>
                                    <h2>
                                        {currentBackground().name}
                                    </h2>

                                    <div>
                                        <For each={currentBackground().feature}>
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

                                    <h3>{currentBackground().languageChoice.type}</h3>

                                    <h3>choose: {currentBackground().languageChoice.choose}</h3>

                                    <div>
                                        <For each={currentBackground().languageChoice.choices}>
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
                                        <For each={currentBackground().startingEquipment}>
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
                                        <For each={currentBackground().startingEquipmentChoices}>
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
                                        <For each={currentBackground().startingProficiencies}>
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