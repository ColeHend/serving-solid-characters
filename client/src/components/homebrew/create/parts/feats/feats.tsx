import { Component, For, Match, Switch, createSignal, untrack, } from "solid-js";
import useStyle from "../../../../../customHooks/utility/style/styleHook";
import styles from './feats.module.scss'
import type { Tab } from "../../../../navbar/navbar";
import HomebrewSidebar from "../../sidebar";
import useGetClasses from "../../../../../customHooks/data/useGetClasses";
import useGetFeats from "../../../../../customHooks/data/useGetFeats";
import { Feature } from "../../../../../models/core.model";
import ExpansionPanel from "../../../../shared/expansion/expansion";
import { effect} from "solid-js/web";

export enum PreReqType {
    AbilityScore,
    Class,
    CharacterLevel,
    ClassArray
}

const Feats: Component = () => {
    const stylin = useStyle();
    const classes = useGetClasses();
    const feats = useGetFeats();
    const [preReqs, setPreReqs] = createSignal<Feature<string, string>[]>([])
    const [selectedType, setSelectedType] = createSignal<number>(0);
    const [featName, setFeatName] = createSignal<string>('');


    const addPreReq = (e: Event) => {
        setPreReqs(old=>[...old, {
            info: {
                className: '',
                subclassName: '',
                level: 0,
                type: PreReqType[selectedType()],
                other: ''
            },
            name: '', 
            value: ''}])
    }

    effect(()=>{
        console.log("preReqs: ", preReqs())
    })

    return (
        <>
            <HomebrewSidebar />
            <div class={`${stylin.accent} ${styles.body}`}>
                <h1>Feats</h1>
                <div>
                    <div class={`${styles.name}`}>
                        <h2 >Add Name</h2>
                        <input type="text" id="featName"  />
                    </div>
                    <div class={`${styles.preRequisites}`}>
                        <h2>Add Pre-Requisites</h2>
                        <div>
                            <select onChange={(e)=>setSelectedType(()=>+e.currentTarget.value)} >
                                <option value={PreReqType.AbilityScore}>Ability Score</option>
                                <option value={PreReqType.Class}>Class</option>
                                <option value={PreReqType.CharacterLevel}>Class Level</option>
                                <option value={PreReqType.ClassArray}>Classes</option>
                            </select>
                            <button onClick={addPreReq}>Add</button> 
                        </div>
                        <div >
                            <For each={preReqs()}>
                                {(preReq, i) => (
                                    <div>
                                        <Switch>
                                            <Match when={true}>
                                                <div>

                                                </div>
                                            </Match>
                                        </Switch>
                                    </div>
                                )}
                            </For>
                        </div>
                    </div>
                    <div class={`${styles.Description}`}>
                        <h2>Description</h2>
                        <textarea id="featDescription" name="featDescription" />
                    </div>
                </div>
            </div>
        </>
    );
}
export default Feats;