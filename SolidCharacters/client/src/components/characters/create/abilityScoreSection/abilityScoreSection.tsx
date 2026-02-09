import { Accessor, Component, createEffect, createMemo, createSignal, For, Match, onMount, Setter, Show, Switch } from "solid-js";
import { FlatCard } from "../../../../shared/components/flatCard/flatCard";
import { FormField, Select, Option, Chipbar, ChipType, Checkbox, Chip } from "coles-solid-library";
import styles from "./abilityScoreSection.module.scss";
import { StatBox } from "./statBox/statbox";

interface assProps {
    stats: [Accessor<Record<string, number>>, Setter<Record<string, number>>];
    modifers: [Accessor<Record<string, number>>, Setter<Record<string, number>>];
    genMethod: [Accessor<GenMethod>, Setter<GenMethod>];
    pbPoints: [Accessor<number>, Setter<number>];
    selectedStat: [Accessor<number>, Setter<number>];
    selectedStats: [Accessor<number[]>, Setter<number[]>];
    modChips: [Accessor<ChipType[]>, Setter<ChipType[]>];
    modStat: [Accessor<string>, Setter<string>];
    isFocus: [Accessor<boolean>, Setter<boolean>];
}

type GenMethod = "Standard Array"|"Custom Standard Array"|"Manual/Rolled"|"Point Buy"|"Extended Point Buy";
type stat = "str"|"dex"|"con"|"int"|"wis"|"cha";

export const Ass:Component<assProps> = (props) => {
    const [charStats, setCharStats] = props.stats;
    const [statMods, setStatMods] = props.modifers;

    const [genMethod, setGenMethod] = props.genMethod;
    const [pbPoints,setPBPoints] = props.pbPoints;
    const [selectedStat, setSelectedStat] = props.selectedStat;
    const [selectedStats, setSelectedStats] = props.selectedStats;
    const [modChips, setModChips] = props.modChips;
    const [modStat, setModStat] = props.modStat;
    const [isFocus, setIsFocus] = props.isFocus;

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

    const displayStat = (stat: string) => {

        switch (stat) {
            case "str":
                return "Stength";

            case "dex":
                return "Dexterity";

            case "con": 
                return "Constitution";

            case "int":
                return "Intelligence"
            
            case "wis":
                return "Wisdom";

            case "cha":
                return "Charisma";
            
            default: 
                return "";
        }
    }


    const stats = ["str","dex","con","int","wis","cha"];

    createEffect(()=>{
        modChips().forEach((chip)=>setStatMod(chip.key,+chip.value))
    })

    return <FlatCard icon="star" headerName={<div class={`${styles.headerTextWrapper}`}>
        Stats: 
        <span class={`${styles.headerText}`}>str <div>({strength() + strengthMod()})</div></span>
        <span class={`${styles.headerText}`}>dex <div>({dexterity() + dexterityMod()})</div></span>
        <span class={`${styles.headerText}`}>con <div>({constitution() + constitutionMod()})</div></span>
        <span class={`${styles.headerText}`}>int <div>({intelligence() + intelligenceMod()})</div></span>
        <span class={`${styles.headerText}`}>wis <div>({wisdom() + wisdomMod()})</div></span>
        <span class={`${styles.headerText}`}>cha <div>({charisma() + charismaMod()})</div></span>
    </div>} transparent>
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
                            }
                        }}>
                        <For each={GenMethods()}>
                            {(method)=><Option value={method}>{method}</Option>}
                        </For>
                    </Select>
                </FormField>
            </div>

            <div class={`${styles.pushDown}`}>
                <FlatCard headerName="Modifers" class={`${styles.cardAlt}`} transparent>
                    <div>
                        <div class={`${styles.modiferText}`}>
                            Your species or background may grant ability score increases. Choose one of the following ways to apply those bonuses:
                        </div>

                        <ul>
                            <li>
                                <strong>Spread:</strong> Increase up to three different ability scores by +1 each.
                            </li>
                            <li>
                                <strong>Focus:</strong> Increase one ability score by +2 and a different ability score by +1.
                            </li>
                        </ul>

                    </div>
                    <div style={{display: "flex", "flex-direction": "row", width: "20%",gap: "2%"}}>
                        <Select
                            value={modStat()}
                            onChange={(value) => setModStat(value)}
                            onSelect={(value) => {
                                // prevent duplicates
                                if (modChips().some(c => c.key === value)) return;

                                const chips = modChips();
                                const hasFocus = chips.some(c => c.value === "2");

                                // If focus already chosen (there is a +2), second slot allowed only as +1
                                if (hasFocus) {
                                    if (chips.length >= 2) return;
                                    setModChips(old => [...old, { key: value, value: "1" }]);
                                    setModStat("");
                                    return;
                                }

                                if (chips.length === 0) {
                                    if (isFocus()) {
                                        setModChips(old => [...old, { key: value, value: "2" }]);
                                    } else {
                                        setModChips(old => [...old, { key: value, value: "1" }]);
                                    }
                                    setModStat("");
                                    return;
                                }

                                // Otherwise we're in Spread mode (existing chips are +1). Allow up to 3 distinct +1 chips.
                                if (chips.length >= 3) return;
                                setModChips(old => [...old, { key: value, value: "1" }]);
                                setModStat("");
                            }}
                        >
                            <For each={stats.filter(stat => !modChips().some(chip => chip.key === stat))}>
                                {stat => <Option value={stat}>{displayStat(stat)}</Option>}
                            </For>
                        </Select>

                        <Checkbox disabled={modChips().length > 0} label={<>{isFocus()?"Focus":"Spread"}</>} checked={isFocus()} onChange={(value)=>setIsFocus(value)} />
                    </div>
                    <div class={`${styles.modChipBar}`}>
                        <For each={modChips()}>
                            {(chip)=><Chip key={chip.key} value={chip.value} remove={()=>{
                                setModChips(old => old.filter(x => x.key !== chip.key))
                                setStatMod(chip.key, 0);
                            }} />}
                        </For>
                    </div>
                </FlatCard>
            </div>

            <div class={`${styles.pushDown}`}>
                <Switch>
                    <Match when={genMethod() === "Standard Array"}>
                        <div>
                            Select a score from the array, then click the ability (stat box) you want to assign it to.
                        </div>
                        <div class={`${styles.pushDown}`}>
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
                            Select a score from the array, then click the ability (stat box) you want to assign it to.
                        </div>
                        <div class={`${styles.pushDown}`}>
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