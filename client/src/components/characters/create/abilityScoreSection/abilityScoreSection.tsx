import { Accessor, Component, createMemo, createSignal, For, Match, onMount, Setter, Switch } from "solid-js";
import { FlatCard } from "../../../../shared/components/flatCard/flatCard";
import { FormField, Select, Option } from "coles-solid-library";
import styles from "./abilityScoreSection.module.scss";
import { StatBox } from "./statBox/statbox";

interface assProps {
    stats: [Accessor<Record<string, number>>, Setter<Record<string, number>>];
    modifers: [Accessor<Record<string, number>>, Setter<Record<string, number>>];
}

type GenMethod = "Standard Array"|"Custom Standard Array"|"Manual/Rolled"|"Point Buy"

export const Ass:Component<assProps> = (props) => {
    const [charStats, setCharStats] = props.stats;
    const [statMods, setStatMods] = props.modifers;

    const [genMethod, setGenMethod] = createSignal<GenMethod>("Manual/Rolled");
    const [pbPoints,setPBPoints] = createSignal<number>(27);

    const GenMethods = createMemo<string[]>(()=>[
        "Standard Array",
        "Custom Standard Array",
        "Manual/Rolled",
        "Point Buy"
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
                    <Select value={genMethod()} onChange={(value)=>setGenMethod(value)}>
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
                        a
                    </Match>
                    <Match when={genMethod() === "Custom Standard Array"}>
                        b
                    </Match>
                    <Match when={genMethod() === "Manual/Rolled"}>
                        c
                    </Match>
                    <Match when={genMethod() === "Point Buy"}>
                        d
                    </Match>
                </Switch>
            </div>

            <div class={`${styles.statsView}`}>
                <StatBox 
                statName="Stength"
                score={strength}
                modifier={strengthMod}/>

                <StatBox 
                statName="Dexterity"
                score={dexterity}
                modifier={dexterityMod}/>

                <StatBox 
                statName="Constitution"
                score={constitution}
                modifier={constitutionMod}/>

                <StatBox 
                statName="Intelligence"
                score={intelligence}
                modifier={intelligenceMod}/>

                <StatBox 
                statName="Wisdom"
                score={wisdom}
                modifier={wisdomMod}/>

                <StatBox 
                statName="Charisma"
                score={charisma}
                modifier={charismaMod}/>

            </div>
        </div>
    </FlatCard>
}