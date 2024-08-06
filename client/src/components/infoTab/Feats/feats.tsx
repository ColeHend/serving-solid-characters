import { Component, For, Match, Show ,Switch,createMemo,createSignal, useContext } from "solid-js";
import useDnDFeats from "../../../shared/customHooks/dndInfo/srdinfo/useDnDFeats";
import useStyle from "../../../shared/customHooks/utility/style/styleHook";
import styles from "./feats.module.scss";
import { Feat } from "../../../models/feat.model";
import Paginator from "../../../shared/components/paginator/paginator";
import FeatsSearch from "./searchBar/searchBar";
import { effect } from "solid-js/web";
import useGetFeats from "../../../shared/customHooks/data/useGetFeats";
import { PreReqType } from "../../homebrew/create/parts/feats/feats";
import SearchBar from "../../../shared/components/SearchBar/SearchBar";
import { useSearchParams } from "@solidjs/router";
import { SharedHookContext } from "../../rootApp";
import useStyles from "../../../shared/customHooks/utility/style/styleHook";
import getUserSettings from "../../../shared/customHooks/userSettings";

const featsList: Component = () => {
    const [paginatedFeats, setPaginatedFeats] = createSignal<Feat[]>([]);
    const [searchResult, setSearchResult] = createSignal<Feat[]>([]);
    const displayResults = createMemo(()=>{
        if (searchResult().length === 0) return paginatedFeats();
        return searchResult();
    })
    const [RowShown, SetRowShown] = createSignal<number[]>([]);
    const hasIndex = (index: number) => RowShown().includes(index);
    const toggleRow = (index: number) => !hasIndex(index) ? SetRowShown([...RowShown(), index]) : SetRowShown(RowShown().filter(i => i !== index));
    
    const sharedHooks = useContext(SharedHookContext);
    const [userSettings, setUserSettings] = getUserSettings();
    const stylin = createMemo(()=>useStyles(userSettings().theme));
    
    const srdFeats = useGetFeats(); 

    const [searchParam, setSearchParam] = useSearchParams();
    if (!!!searchParam.name) setSearchParam({name: srdFeats()[0]?.name });
    const selectedFeat = srdFeats().filter(feat=>feat.name?.toLowerCase() === (searchParam.name || srdFeats()[0]?.name).toLowerCase())[0];
    const [currentFeat, setCurrentFeat] = createSignal<Feat>(selectedFeat);

    effect(()=>{
        setSearchParam({name:currentFeat()?.name })
    })

    return (
        <div class={`${stylin()?.primary} ${styles.featsList}`}>
            <div class={`${styles.body}`}>
                <h1>Feats</h1>
                <div style={{height: "5vh", width: "45%"}}>
                    <SearchBar placeholder="Search Feats..." dataSource={srdFeats} setResults={setSearchResult} />
                </div>
                <ol>
                    <For each={displayResults()}>
                        {(feat, i)=>
                            <>
                                <li> 
                                    {feat.name} <button 
                                        onClick={()=> {
                                            toggleRow(i());
                                            setCurrentFeat(feat);
                                            
                                        }}>{hasIndex(i()) ? "↑" : "↓"}</button> 
                                </li>
                                <Show when={hasIndex(i())}>
                                    <>
                                    <div class={`${styles.PreReqsBar}`}>
                                        <For each={currentFeat().preReqs}>{(preReq)=>
                                            <div>
                                                <Switch>
                                                    <Match when={preReq.info.type === PreReqType[0]}>
                                                        <div>
                                                            Ability Score Requirement: 
                                                        </div>
                                                        <span>
                                                            {/* this might change  */}

                                                            {preReq.name} of {preReq.value}
                                                        </span>
                                                    </Match>
                                                    <Match when={preReq.info.type === PreReqType[1]}>
                                                        <div>
                                                            Class Requirement:
                                                        </div>
                                                        <span>
                                                            {/* this might change  */}


                                                            {preReq.value}
                                                        </span>
                                                    </Match>
                                                    <Match when={preReq.info.type === PreReqType[2]}>
                                                        <div>
                                                            class level Requirement:
                                                        </div>
                                                        <span>
                                                            {/* this might change  */}

                                                            {preReq.name} {preReq.value}
                                                        </span>
                                                    </Match>
                                                    <Match when={preReq.info.type === PreReqType[3]}>
                                                        <div>
                                                            classes Requirement:
                                                        </div>
                                                        <span>
                                                            {/* this might change  */}

                                                            {preReq.name}
                                                        </span>
                                                    </Match>

                                                </Switch>
                                            </div>
                                        }</For>
                                    </div>
                                    <br />
                                    <div>
                                        Description:
                                    </div>
                                    <span>
                                        <For each={currentFeat().desc}>
                                            {(desc, i)=>
                                                <>
                                                    {desc}
                                                    <br />
                                                </>
                                            }
                                        </For>
                                    </span>
                                    </>
                                </Show>
                            </>
                        }
                    </For>
                </ol>

                <Paginator items={srdFeats} setPaginatedItems={setPaginatedFeats} />
            </div>
        </div>
    )
};
export default featsList;