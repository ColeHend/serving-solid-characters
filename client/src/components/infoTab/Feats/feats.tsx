import { Component, For, Match, Show ,Switch,createSignal } from "solid-js";
import useDnDFeats from "../../../customHooks/dndInfo/srdinfo/useDnDFeats";
import useStyle from "../../../customHooks/utility/style/styleHook";
import styles from "./feats.module.scss";
import { Feat } from "../../../models/feat.model";
import Paginator from "../../shared/paginator/paginator";
import FeatsSearch from "./searchBar/searchBar";
import { effect } from "solid-js/web";
import useGetFeats from "../../../customHooks/data/useGetFeats";
import { PreReqType } from "../../homebrew/create/parts/feats/feats";

const featsList: Component = () => {
    const [paginatedFeats, setPaginatedFeats] = createSignal<Feat[]>([]);
    const [searchResult, setSearchResult] = createSignal<Feat[]>([]);
    const [RowShown, SetRowShown] = createSignal<number[]>([]);
    const hasIndex = (index: number) => RowShown().includes(index);
    const toggleRow = (index: number) => !hasIndex(index) ? SetRowShown([...RowShown(), index]) : SetRowShown(RowShown().filter(i => i !== index));
    
    const stylin = useStyle();
    
    const srdFeats = useGetFeats(); 
    // const srdFeats = useDnDFeats();
    
    return (
        <div class={`${stylin.accent} ${styles.featsList}`}>
            <div class={`${styles.body}`}>
                <h1>Feats</h1>

                <FeatsSearch items={srdFeats} setSearchRes={setSearchResult} />

                <ol>
                    <For each={searchResult()}>
                        {(feat, i)=>
                            <>
                                <li> 
                                    {feat.name} <button onClick={()=>toggleRow(i())}>{hasIndex(i()) ? "↑" : "↓"}</button> 
                                </li>
                                <Show when={hasIndex(i())}>
                                    <>
                                    <div class={`${styles.PreReqsBar}`}>
                                        <For each={feat.preReqs}>{(preReq)=>
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
                                            <For each={feat.desc}>
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