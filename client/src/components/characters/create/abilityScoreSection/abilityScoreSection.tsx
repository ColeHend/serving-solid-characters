import { Accessor, Component, createMemo, createSignal, For, Match, onMount, Setter, Show, Switch } from "solid-js";
import { FlatCard } from "../../../../shared/components/flatCard/flatCard";
import { FormField, Select, Option } from "coles-solid-library";
import styles from "./abilityScoreSection.module.scss";
import { StatBox } from "./statBox/statbox";

interface assProps {
    stats: [Accessor<Record<string, number>>, Setter<Record<string, number>>];
    modifers: [Accessor<Record<string, number>>, Setter<Record<string, number>>];
}

type GenMethod = "Standard Array"|"Custom Standard Array"|"Manual/Rolled"|"Point Buy"|"Extended Point Buy";
type stat = "str"|"dex"|"con"|"int"|"wis"|"cha";

export const Ass:Component<assProps> = (props) => {
    const [charStats, setCharStats] = props.stats;
    const [statMods, setStatMods] = props.modifers;

    const [genMethod, setGenMethod] = createSignal<GenMethod>("Standard Array");
    const [pbPoints,setPBPoints] = createSignal<number>(34);
    const [selectedStat, setSelectedStat] = createSignal<number>(0);
    const [selectedStats, setSelectedStats] = createSignal<number[]>([]);

    const GenMethods = createMemo<string[]>(()=>[
        "Standard Array",
        "Custom Standard Array",
        "Manual/Rolled",
        "Point Buy",
        "Extended Point Buy"
    ]);

    // custom dnd5e stat array
    const customStandardArray = [
        17,
        15,
        13,
        12,
        10,
        8
    ]

    // standar dnd5e stat array
    const startardArray = [
        15,
        14,
        13,
        12,
        10,
        8
    ]

    const getAbilityScore = (name: string):number => {
        return charStats()[name];
    }

    const setAbilityScore = (name: string, score: number):void => {
        setCharStats((old)=>({...old,[name]: score}))
    }

    const clearStats = ():void => {
        setCharStats({});
    }

    const getStatMod = (name: string):number => {
        return statMods()[name]
    }

    const setStatMod = (name: string, score: number):void => {
        setStatMods(old => ({...old,[name]: score}))
    }

    const clearStatMods = ():void => {
        setStatMods({});
    }

    const handleClick = (statName: stat, currentStat: number ) => {
         if (selectedStat() !== 0) {
            if (currentStat !== 0) {
                return;
            }
            setAbilityScore(statName,selectedStat());
            setSelectedStats(old => ([...old,selectedStat()]))
            setSelectedStat(0);
        }
    }


    const strength = createMemo(()=>getAbilityScore("str"));
    const dexterity = createMemo(()=>getAbilityScore("dex"));
    const constitution = createMemo(()=>getAbilityScore("con"));
    const intelligence = createMemo(()=>getAbilityScore("int"));
    const wisdom = createMemo(()=>getAbilityScore("wis"));
    const charisma = createMemo(()=>getAbilityScore("cha"));

    const strengthMod = createMemo(()=>getStatMod("str"));
    const dexterityMod = createMemo(()=>getStatMod("dex"));
    const constitutionMod = createMemo(()=>getStatMod("con"));
    const intelligenceMod = createMemo(()=>getStatMod("int"));
    const wisdomMod = createMemo(()=>getStatMod("wis"));
    const charismaMod = createMemo(()=>getStatMod("cha"));
    
    const currentPbPoints = createMemo(()=>pbPoints());

    const standardSelection = createMemo(()=>startardArray.filter(stat => !selectedStats().includes(stat)))
    const customSelection = createMemo(()=>customStandardArray.filter(stat => !selectedStats().includes(stat)))
    const currentStatArray = createMemo(()=>{
        switch (genMethod()) {
            case "Standard Array":
                return standardSelection();
            case "Custom Standard Array":
                return customSelection();
            default:
                return [];
        } 
    })


    const stats = ["str","dex","con","int","wis","cha"];
    let runOnce = true;
    onMount(()=>{
        if (runOnce) {
            runOnce = false;
            stats.forEach((stat)=>setAbilityScore(stat,0))
            stats.forEach((stat)=>setStatMod(stat,0))
        }
    })

    return <FlatCard icon="star" headerName="Abilities">
        <div>
            <div>
                <FormField name="Generation Method" formName="Gen Method">
                    <Select value={genMethod()} onChange={(value)=>{
                            setGenMethod(value)
                            if (genMethod() === "Point Buy" || genMethod() === "Extended Point Buy") {
                                setCharStats({
                                    "str": 8,
                                    "dex": 8,
                                    "con": 8,
                                    "int": 8,
                                    "wis": 8,
                                    "cha": 8
                                });
                            } else {
                                setCharStats({
                                    "str": 0,
                                    "dex": 0,
                                    "con": 0,
                                    "int": 0,
                                    "wis": 0,
                                    "cha": 0
                                });
                            }
                        }}>
                        <Option value="">-</Option>
                        <For each={GenMethods()}>
                            {(method)=><Option value={method}>{method}</Option>}
                        </For>
                    </Select>
                </FormField>
            </div>
            
            <div style={{'margin-top':"1%"}}>
                <Switch>
                    <Match when={genMethod() === "Standard Array"}>
                        <div>
                            <strong>Standard Array: </strong>
                            <For each={standardSelection()}>
                                {(stat,i)=> <>
                                    <span onClick={()=>setSelectedStat(stat)} class={selectedStat() === stat ? styles.border : "" }>
                                        {stat}
                                    </span>
                                    <Show when={i() !== startardArray.length - 1}>, </Show>
                                </> }
                            </For>
                        </div>
                    </Match>
                    <Match when={genMethod() === "Custom Standard Array"}>
                        <div>
                            <strong>Custom Standard Array: </strong>
                            <For each={customSelection()}>
                                {(stat, i)=><>
                                    <span onClick={()=>setSelectedStat(stat)} class={selectedStat() === stat ? styles.border : "" }>
                                        {stat}
                                    </span>
                                    <Show when={i() !== startardArray.length - 1}>, </Show>
                                </>}
                            </For>
                        </div>
                    </Match>
                    <Match when={genMethod() === "Manual/Rolled"}>
                        Choose your stats.
                    </Match>
                    <Match when={genMethod() === "Point Buy" || genMethod() === "Extended Point Buy"}>
                        <div>
                            <strong>Total Points: </strong>
                            {currentPbPoints()}
                        </div>
                    </Match>
                </Switch>
            </div>

            <div class={`${styles.statsView}`}>
                <StatBox 
                statName="Stength"
                score={strength}
                modifier={strengthMod}
                setCurrStats={setSelectedStats}
                setCharStat={setCharStats}
                genMethod={genMethod}
                totalPoints={[pbPoints,setPBPoints]}
                onClick={()=>handleClick("str",strength())}/>

                <StatBox 
                statName="Dexterity"
                score={dexterity}
                modifier={dexterityMod}
                setCurrStats={setSelectedStats}
                setCharStat={setCharStats}
                genMethod={genMethod}
                totalPoints={[pbPoints,setPBPoints]}
                onClick={()=>handleClick("dex",dexterity())}/>

                <StatBox 
                statName="Constitution"
                score={constitution}
                modifier={constitutionMod}
                setCurrStats={setSelectedStats}
                setCharStat={setCharStats}
                genMethod={genMethod}
                totalPoints={[pbPoints,setPBPoints]}
                onClick={()=>handleClick("con",constitution())}/>

                <StatBox 
                statName="Intelligence"
                score={intelligence}
                modifier={intelligenceMod}
                setCurrStats={setSelectedStats}
                setCharStat={setCharStats}
                genMethod={genMethod}
                totalPoints={[pbPoints,setPBPoints]}
                onClick={()=>handleClick("int",intelligence())}/>

                <StatBox 
                statName="Wisdom"
                score={wisdom}
                modifier={wisdomMod}
                setCurrStats={setSelectedStats}
                setCharStat={setCharStats}
                genMethod={genMethod}
                totalPoints={[pbPoints,setPBPoints]}
                onClick={()=>handleClick("wis",wisdom())}/>

                <StatBox 
                statName="Charisma"
                score={charisma}
                modifier={charismaMod}
                setCurrStats={setSelectedStats}
                setCharStat={setCharStats}
                genMethod={genMethod}
                totalPoints={[pbPoints,setPBPoints]}
                onClick={()=>handleClick("cha",charisma())}/>

            </div>
        </div>
    </FlatCard>
}