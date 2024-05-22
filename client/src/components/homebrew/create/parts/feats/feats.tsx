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
import HomebrewManager from "../../homebrewManager";
import MultiSelect from "../../../../shared/multiSelect/MultiSelect";
import { Feat } from "../../../../../models/feat.model";

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
    const homebrewManager = new HomebrewManager();
    const [preReqs, setPreReqs] = createSignal<Feature<string, string>[]>([])
    const [selectedType, setSelectedType] = createSignal<number>(0);
    const [featName, setFeatName] = createSignal<string>('');
    const [multipleClasses, setMultipleClasses] = createSignal<string[]>([]);

    const addPreReq = (e: Event) => {
        switch (selectedType()) {
            case 0:
                setPreReqs(old=>[...old, {
                    info: {
                        className: '',
                        subclassName: '',
                        level: 0,
                        type: PreReqType[0],
                        other: ''
                    },
                    name: 'STR', 
                    value: '0'}])
                break;
            case 1:
                setPreReqs(old=>[...old, {
                    info: {
                        className: '',
                        subclassName: '',
                        level: 0,
                        type: PreReqType[1],
                        other: ''
                    },
                    name: '', 
                    value: classes()[0].name}])
                break;
            case 2:
                setPreReqs(old=>[...old, {
                    info: {
                        className: '',
                        subclassName: '',
                        level: 0,
                        type: PreReqType[2],
                        other: ''
                    },
                    name: classes()[0].name, 
                    value: '0'}])
                break;
            case 3:
                setPreReqs(old=>[...old, {
                    info: {
                        className: '',
                        subclassName: '',
                        level: 0,
                        type: PreReqType[3],
                        other: ''
                    },
                    name: '', 
                    value: ''}])
                break;
        
            default:
                break;
        }
        
    }
    const updateASPreReq = (stats: {stat?: string, value?: number}, index: number) => {
        setPreReqs(old=>{
            if (!!stats.stat) old[index].name = stats.stat;
            if (!!stats.value) old[index].value = stats.value.toString();
            return old;
        })
    }
    const updateClassPreReq = (className: string, index: number) => {
        setPreReqs(old=>{
            old[index].value = className;
            return JSON.parse(JSON.stringify(old));
        })
    }
    const updateClassLevelPreReq = (values: {className?: string, level?: number}, index: number) => {
        setPreReqs(old=>{
            if (!!values.className) old[index].name = values.className;
            if (!!values.level) old[index].value = values.level.toString();
            return JSON.parse(JSON.stringify(old));
        })
    }
    const updateClassesPreReq = (classes: string[], index: number) => {
        setPreReqs(old=>{
            old[index].name = classes.join(',');
            return JSON.parse(JSON.stringify(old));
        })
    }

    effect(()=>{
        console.log("preReqs: ", preReqs())
    })
    effect(()=>{
        const newFeat: Feat = {} as Feat;
        newFeat.name = featName();
        newFeat.preReqs = preReqs();
        console.log("newFeat: ", newFeat)
    })
    return (
        <>
            <HomebrewSidebar />
            <div class={`${stylin.accent} ${styles.body}`}>
                <h1>Feats</h1>
                <div>
                    <div class={`${styles.name}`}>
                        <h2 >Add Name</h2>
                        <input type="text" id="featName" onChange={(e)=>setFeatName(e.currentTarget.value)} />
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
                                            <Match when={preReq.info.type === PreReqType[0]}>
                                                <div>
                                                    <select onChange={(e)=>updateASPreReq({stat:e.currentTarget.value}, i())}>
                                                        <option value={"STR"}>Strength</option>
                                                        <option value={"DEX"}>Dexterity</option>
                                                        <option value={"CON"}>Constitution</option>
                                                        <option value={"INT"}>Intelligence</option>
                                                        <option value={"WIS"}>Wisdom</option>
                                                        <option value={"CHA"}>Charisma</option>
                                                    </select>
                                                    <input type="number" onChange={(e)=>updateASPreReq({value:+e.currentTarget.value},i())} />
                                                </div>
                                            </Match>
                                            <Match when={preReq.info.type === PreReqType[1]}>
                                                <div>
                                                    <select onChange={(e)=>updateClassPreReq(e.currentTarget.value, i())}>
                                                        <For each={classes()}>
                                                            {(classObj) => (
                                                                <option value={classObj.name}>{classObj.name}</option>
                                                            )}
                                                        </For>
                                                    </select>
                                                </div>
                                            </Match>
                                            <Match when={preReq.info.type === PreReqType[2]}>
                                                <div>
                                                    <select onChange={(e)=>updateClassLevelPreReq({className: e.currentTarget.value},i())} >
                                                        <For each={classes()}>
                                                            {(classObj) => (
                                                                <option value={classObj.name}>{classObj.name}</option>
                                                            )}
                                                        </For>
                                                    </select>
                                                    <input type="number" onChange={(e)=>updateClassLevelPreReq({level:+e.currentTarget.value},i())} />
                                                </div>
                                            </Match>
                                            <Match when={preReq.info.type === PreReqType[3]}>
                                                <div>
                                                    <MultiSelect runOnChange={()=>updateClassesPreReq(multipleClasses(), i())} options={()=>classes().map(x => x.name)} selectedOptions={setMultipleClasses} />
                                                    <span>{multipleClasses().join(',')}</span>
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