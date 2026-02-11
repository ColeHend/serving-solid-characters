import { Button, Container, Icon, Input, Select,Option } from "coles-solid-library";
import { Accessor, Component, createEffect, createMemo, createSignal, For, JSX, Match, Setter, Show, splitProps, Switch } from "solid-js";
import { AbilityScores, StatBonus } from "../../../../../models/data";
import styles from "./statBox.module.scss";

type GenMethod = "Standard Array"|"Custom Standard Array"|"Manual/Rolled"|"Point Buy" |"Extended Point Buy";
type stat = "str"|"dex"|"con"|"int"|"wis"|"cha";

interface boxProps extends JSX.HTMLAttributes<HTMLDivElement> {
    statName: string;
    score: Accessor<number>;
    modifier: Accessor<number>;
    setCurrStats: Setter<number[]>;
    setCharStat: Setter<Record<string, number>>;
    genMethod: Accessor<GenMethod>;
    totalPoints: [Accessor<number>, Setter<number>];
}

export const StatBox:Component<boxProps> = (props) => {
    const [local, other] = splitProps(props,["modifier","score","statName","setCharStat","setCharStat","genMethod","totalPoints"])

    const [pbStats,setPBStats] = createSignal([
        8,
        9,
        10,
        11,
        12,
        13,
        14,
        15,
        16
    ])

    const pointBuyCost = createMemo<Record<string, number>>(()=>({
        "8": 0,
        "9": 1,
        "10": 2,
        "11": 3,
        "12": 4,
        "13": 5,
        "14": 7,
        "15": 9,
        "16": 12,
    }))
    
    const statName = createMemo(()=>local.statName);
    
    const currentScore = createMemo(()=>local.score());
    const getModifer = createMemo(()=>local.modifier());
    const genMethod = createMemo(()=>local.genMethod());
    const [totalPoints, setTotalPoints] = local.totalPoints; 
    
    const filterdStatOptions = createMemo(()=>pbStats().filter(targetStat =>{
        const currentCost = pointBuyCost()[currentScore()];
        const targetCost = pointBuyCost()[targetStat];
        const diff = currentCost - targetCost;
        
        return diff > 0 || Math.abs(diff) <= totalPoints()
    }));

    const setAbilityScore = (name: string, score: number):void => {
        local.setCharStat((old)=>({...old,[name]: score}))
    }

    const getStatName = () => {
        switch(local.statName) {
            case "Stength":
                return "str";

            case "Dexterity":
                return "dex";

            case "Constitution":
                return "con"

            case "Intelligence":
                return "int"
            
            case "Wisdom":
                return "wis"

            case "Charisma":
                return "cha";

            default:
                return "";
        }
    }

    const addOne = (targetStat: number) => {
        const currentStat = pointBuyCost()[currentScore()];
        const nextStat = pointBuyCost()[targetStat];
        const diff = nextStat - currentStat;
        console.log("current", currentStat);
        console.log("next", nextStat);
        console.log("diff", diff);
        
        if (diff <= totalPoints()) {
            setTotalPoints(old => old - diff)
            setAbilityScore(getStatName(), targetStat)
        }
    }

    const removeOne = (targetStat: number) => {
        const currentStat = pointBuyCost()[currentScore()];
        const nextStat = pointBuyCost()[targetStat];
        const diff = Math.abs(nextStat - currentStat);
        
        setTotalPoints(old => old + diff)
        setAbilityScore(getStatName(), targetStat)
    }

    const StatBonus = createMemo(()=>Math.floor(((currentScore() + getModifer()) - 10)/2));

    createEffect(()=>{
        if (genMethod() === "Point Buy") {
            setPBStats([
                8,
                9,
                10,
                11,
                12,
                13,
                14,
                15,
            ])
            setTotalPoints(27)
        } else if (genMethod() === "Extended Point Buy") {
            setPBStats([
                8,
                9,
                10,
                11,
                12,
                13,
                14,
                15,
                16
            ])
            setTotalPoints(34)
        }
    })

    return <div {...other} class={`${styles.StatBox}`}>
        <div class={`${styles.statHeader}`}>
            <h3>{statName()} - {currentScore() + getModifer()}</h3>
            <Show when={currentScore() !== 0 && genMethod() !== "Extended Point Buy" && genMethod() !== "Point Buy"}>
                <Button onClick={()=>{
                    props.setCurrStats(old => old.filter(stat => stat !== currentScore()))
                    setAbilityScore(getStatName(),0)
                }}>
                    <Icon name="delete" size={"medium"} color="red"/>
                </Button>
            </Show>
        </div>
        <div class={styles.divider} />
        <div class={`${styles.statView}`}>
            <strong>Base Score </strong>
            <Switch>
                <Match when={genMethod() === "Standard Array" || genMethod() === "Custom Standard Array"}>
                    <span>{currentScore() === 0 ? "_" : currentScore()}</span>
                </Match>
                <Match when={genMethod() === "Manual/Rolled"}>
                    <div class={`${styles.scoreInput}`}>
                        <Input type="number" min={1} max={20} value={currentScore()} onInput={(e)=>{
                            if (+e.currentTarget.value <= 20) {
                                setAbilityScore(getStatName(), +e.currentTarget.value)
                            }
                        }} transparent/>
                    </div>
                </Match>
                <Match when={genMethod() === "Point Buy" || genMethod() === "Extended Point Buy"}>
                    <div class={`${styles.pbSelect}`}>
                        <Select value={currentScore()} onSelect={(value)=>{
                            if (+value > currentScore()) {
                                addOne(value)
                            } else if (value < currentScore()) {
                                removeOne(value)
                            }
                        }}>
                            <For each={filterdStatOptions()}>
                                {(stat)=><Option value={stat}>{stat} ({pointBuyCost()[stat] !== 0 ? "-": ""}{pointBuyCost()[stat]}) </Option>}
                            </For>
                        </Select>
                    </div>
                </Match>
            </Switch>
        </div>
        <div class={`${styles.statView}`}>
            <strong>Modifier </strong>
            <span>+{getModifer() === 0 ? "_" : getModifer()}</span>
        </div>

    </div>
    
    
    // <Container  theme="container" >
    //     <div class={`${styles.statHeader}`}>
    //         <h3>{statName()} - {currentScore() + getModifer()}</h3>
    //         <Show when={currentScore() !== 0 && genMethod() !== "Extended Point Buy" && genMethod() !== "Point Buy"}>
    //             <Button onClick={()=>{
    //                 props.setCurrStats(old => old.filter(stat => stat !== currentScore()))
    //                 setAbilityScore(getStatName(),0)
    //             }}>
    //                 <Icon name="delete" size={"medium"} color="red"/>
    //             </Button>
    //         </Show>
    //     </div>
    //     <div class={styles.divider} />
    //     <div class={`${styles.statView}`}>
    //         <strong>Base Score </strong>
    //         <Switch>
    //             <Match when={genMethod() === "Standard Array" || genMethod() === "Custom Standard Array"}>
    //                 <span>{currentScore() === 0 ? "_" : currentScore()}</span>
    //             </Match>
    //             <Match when={genMethod() === "Manual/Rolled"}>
    //                 <div class={`${styles.scoreInput}`}>
    //                     <Input type="number" min={1} max={20} value={currentScore()} onInput={(e)=>{
    //                         if (+e.currentTarget.value <= 20) {
    //                             setAbilityScore(getStatName(), +e.currentTarget.value)
    //                         }
    //                     }} transparent/>
    //                 </div>
    //             </Match>
    //             <Match when={genMethod() === "Point Buy" || genMethod() === "Extended Point Buy"}>
    //                 <div class={`${styles.pbSelect}`}>
    //                     <Select value={currentScore()} onSelect={(value)=>{
    //                         if (+value > currentScore()) {
    //                             addOne(value)
    //                         } else if (value < currentScore()) {
    //                             removeOne(value)
    //                         }
    //                     }}>
    //                         <For each={filterdStatOptions()}>
    //                             {(stat)=><Option value={stat}>{stat} ({pointBuyCost()[stat] !== 0 ? "-": ""}{pointBuyCost()[stat]}) </Option>}
    //                         </For>
    //                     </Select>
    //                 </div>
    //             </Match>
    //         </Switch>
    //     </div>
    //     <div class={`${styles.statView}`}>
    //         <strong>Modifier </strong>
    //         <span>+{getModifer() === 0 ? "_" : getModifer()}</span>
    //     </div>
    // </Container>
}
