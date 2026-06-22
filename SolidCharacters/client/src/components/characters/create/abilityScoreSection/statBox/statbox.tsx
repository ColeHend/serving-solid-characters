import { Button, Icon, Input, Select,Option } from "coles-solid-library";
import { Delete } from "coles-solid-library/icons";
import { Accessor, Component, createEffect, createMemo, createSignal, For, JSX, Match, Setter, Show, splitProps, Switch } from "solid-js";
import { createDraggable, createDroppable } from "../../../../../shared/dnd";
import styles from "./statBox.module.scss";

type GenMethod = "Standard Array"|"Custom Standard Array"|"Manual/Rolled"|"Point Buy" |"Extended Point Buy";

interface boxProps extends JSX.HTMLAttributes<HTMLDivElement> {
    statName: string;
    score: Accessor<number>;
    modifier: Accessor<number>;
    setCharStat: Setter<Record<string, number>>;
    genMethod: Accessor<GenMethod>;
    totalPoints: [Accessor<number>, Setter<number>];
    exist: Accessor<boolean>;
}

export const StatBox:Component<boxProps> = (props) => {
    const [local, other] = splitProps(props,["modifier","score","statName","setCharStat","genMethod","totalPoints","exist","onClick","ref"])

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
    const is_exist = createMemo(()=>local.exist());
    const isArrayMethod = createMemo(()=> (genMethod() === "Standard Array" || genMethod() === "Custom Standard Array") && !is_exist());
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

    const statKey = createMemo(()=>getStatName());

    // Each box is a drop target; its assigned score (when present) is itself
    // draggable so values can be swapped box→box or dragged back to the pool.
    // Both are gated by `disabled` rather than conditional creation (genMethod
    // is reactive, and the primitives must be created exactly once).
    const drop = createDroppable(()=>({
        id: `box:${statKey()}`,
        type: "box",
        data: { kind: "box", statKey: statKey() },
        disabled: !isArrayMethod(),
    }));
    const drag = createDraggable(()=>({
        id: `boxval:${statKey()}`,
        type: "score",
        data: { kind: "box", statKey: statKey(), value: currentScore() },
        disabled: !isArrayMethod() || currentScore() === 0,
    }));

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

    const getScoreBonus = (stat: number, mod: number ): number => {
        return Math.floor(((stat + mod) - 10)/2);
    }

    return <div {...other} ref={drop.ref} class={`${styles.StatBox}`} classList={{ [styles.dropOver]: drop.isOver() }}>
        <div class={`${styles.statHeader}`}>
            <h3>{statName()} - {currentScore() + getModifer()}</h3>
            <Show when={currentScore() !== 0 && genMethod() !== "Extended Point Buy" && genMethod() !== "Point Buy"}>
                <Button onClick={()=>{
                    // The available pool is derived from charStats, so resetting the
                    // stat to 0 is enough — the value reappears in the pool on its own.
                    setAbilityScore(getStatName(),0)
                }}>
                    <Icon icon={Delete} size={"medium"} color="red"/>
                </Button>
            </Show>
        </div>
        <div class={styles.divider} />
        <div class={`${styles.statView}`}>
            <strong>Base Score </strong>
            <Switch>
                <Match when={genMethod() === "Standard Array" || genMethod() === "Custom Standard Array"}>
                    <span ref={drag.ref} classList={{ [styles.scoreValue]: currentScore() !== 0, [styles.scoreDragging]: drag.isActive() }}>{currentScore() === 0 ? "_" : currentScore()}</span>
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
        <Show when={!is_exist()}>
            <div class={`${styles.statView}`}>
                <strong>Modifier </strong>
                <span>+{getModifer() === 0 ? "_" : getModifer()}</span>
            </div>
        </Show>
        <div class={`${styles.statView}`}>
            <strong>Bonus </strong>
            <span><Show when={Math.sign(getScoreBonus(currentScore(), getModifer())) === 1}>+</Show>{getScoreBonus(currentScore(), getModifer())}</span>
        </div>

    </div>
}
