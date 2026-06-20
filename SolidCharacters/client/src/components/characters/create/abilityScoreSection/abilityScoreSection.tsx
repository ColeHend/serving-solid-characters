import { Accessor, Component, createEffect, createMemo, For, Match, Setter, Show, Switch } from "solid-js";
import { FlatCard } from "../../../../shared/components/flatCard/flatCard";
import { FormField, Select, Option, ChipType, Checkbox, Chip } from "coles-solid-library";
import { Star } from "coles-solid-library/icons";
import { DragDropProvider, DragOverlay, createDraggable, createDroppable, pointerWithin, type DragEndEvent, type DefaultDataMap } from "../../../../shared/dnd";
import styles from "./abilityScoreSection.module.scss";
import { StatBox } from "./statBox/statbox";

interface assProps {
    stats: [Accessor<Record<string, number>>, Setter<Record<string, number>>];
    modifers: [Accessor<Record<string, number>>, Setter<Record<string, number>>];
    genMethod: [Accessor<GenMethod>, Setter<GenMethod>];
    pbPoints: [Accessor<number>, Setter<number>];
    modChips: [Accessor<ChipType[]>, Setter<ChipType[]>];
    modStat: [Accessor<string>, Setter<string>];
    isFocus: [Accessor<boolean>, Setter<boolean>];
    exist: Accessor<boolean>;
}

type GenMethod = "Standard Array"|"Custom Standard Array"|"Manual/Rolled"|"Point Buy"|"Extended Point Buy";
type stat = "str"|"dex"|"con"|"int"|"wis"|"cha";

// Drag payloads: a pool number, or an already-assigned box value. Drop targets:
// a stat box, or the pool (drag back to clear).
type ScoreDrag = { kind: "pool"; value: number } | { kind: "box"; statKey: string; value: number };
type ScoreDrop = { kind: "pool" } | { kind: "box"; statKey: string };

export const Ass:Component<assProps> = (props) => {
    const [charStats, setCharStats] = props.stats;
    const [statMods, setStatMods] = props.modifers;

    const [genMethod, setGenMethod] = props.genMethod;
    const [pbPoints,setPBPoints] = props.pbPoints;
    const [modChips, setModChips] = props.modChips;
    const [modStat, setModStat] = props.modStat;
    const [isFocus, setIsFocus] = props.isFocus;

    const is_exist = createMemo(() => props.exist());

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

    const getStatMod = (name: string):number => {
        return statMods()[name]
    }

    const setStatMod = (name: string, score: number):void => {
        setStatMods(old => ({...old,[name]: score}))
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

    const isArrayMethod = createMemo(()=> (genMethod() === "Standard Array" || genMethod() === "Custom Standard Array") && !is_exist());
    const activeArray = ()=> genMethod() === "Custom Standard Array" ? customStandardArray : startardArray;
    // The available pool is derived from charStats (values are unique within each
    // array, empty boxes hold 0), so swap/clear are automatic: a value reappears
    // here the moment no box holds it.
    const pool = createMemo(()=> activeArray().filter(v => !Object.values(charStats()).includes(v)));

    const boxConfig: { key: stat; name: string; score: Accessor<number>; mod: Accessor<number> }[] = [
        { key: "str", name: "Stength", score: strength, mod: strengthMod },
        { key: "dex", name: "Dexterity", score: dexterity, mod: dexterityMod },
        { key: "con", name: "Constitution", score: constitution, mod: constitutionMod },
        { key: "int", name: "Intelligence", score: intelligence, mod: intelligenceMod },
        { key: "wis", name: "Wisdom", score: wisdom, mod: wisdomMod },
        { key: "cha", name: "Charisma", score: charisma, mod: charismaMod },
    ];

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

    const isDisabled = () => {
        const chips = modChips();
        const hasFocus = chips.some(c => c.value === "2");
        
        if (chips.length === 2 && hasFocus) return chips.length >= 2;

        if (chips.length === 3) return chips.length >= 3;
        
    }

    const stats = ["str","dex","con","int","wis","cha"];

    createEffect(()=>{
        modChips().forEach((chip)=>setStatMod(chip.key,+chip.value))
    })

    const onDragEnd = (e: DragEndEvent<DefaultDataMap>) => {
        const over = e.over?.data as ScoreDrop | undefined;
        if (!over) return; // dropped on empty space (pointerWithin) → no-op
        const data = e.active.data as ScoreDrag;
        // charStats is the single source of truth; the pool derives from it, so a
        // displaced value returns to the pool on its own (no extra bookkeeping).
        if (over.kind === "box") {
            if (data.kind === "pool") {
                setCharStats(o => ({ ...o, [over.statKey]: data.value }));        // assign / swap-out
            } else if (data.statKey !== over.statKey) {
                setCharStats(o => ({ ...o, [data.statKey]: o[over.statKey], [over.statKey]: o[data.statKey] })); // swap / move
            }
        } else if (over.kind === "pool" && data.kind === "box") {
            setCharStats(o => ({ ...o, [data.statKey]: 0 }));                      // clear
        }
    };

    // A draggable pool number. Rendered inside the provider, so createDraggable
    // resolves the drag context.
    const PoolChip: Component<{ value: number }> = (p) => {
        const drag = createDraggable(()=>({
            id: `pool:${p.value}`,
            type: "score",
            data: { kind: "pool", value: p.value },
            disabled: !isArrayMethod(),
        }));
        return <span ref={drag.ref} class={styles.poolChip} classList={{ [styles.poolChipDragging]: drag.isActive() }}>{p.value}</span>;
    };

    // The pool row is itself a drop target (drag an assigned value back here to
    // clear it). Must be a child of the provider, hence its own component.
    const PoolZone: Component = () => {
        const drop = createDroppable(()=>({ id: "pool", type: "pool", data: { kind: "pool" }, disabled: !isArrayMethod() }));
        return <div ref={drop.ref} class={styles.poolRow} classList={{ [styles.poolOver]: drop.isOver() }}>
            <For each={pool()} fallback={<span class={styles.poolEmpty}>All scores assigned</span>}>
                {(v) => <PoolChip value={v} />}
            </For>
        </div>;
    };

    return <FlatCard icon={Star} headerName={<div class={`${styles.headerTextWrapper}`}>
        <span>Stats: </span>
        <span class={`${styles.headerText}`}>str<div>({strength() + strengthMod()})</div></span>
        <span class={`${styles.headerText}`}>dex<div>({dexterity() + dexterityMod()})</div></span>
        <span class={`${styles.headerText}`}>con<div>({constitution() + constitutionMod()})</div></span>
        <span class={`${styles.headerText}`}>int<div>({intelligence() + intelligenceMod()})</div></span>
        <span class={`${styles.headerText}`}>wis<div>({wisdom() + wisdomMod()})</div></span>
        <span class={`${styles.headerText}`}>cha<div>({charisma() + charismaMod()})</div></span>
    </div>} transparent>
        <DragDropProvider
            collisionDetection={pointerWithin}
            onDragEnd={onDragEnd}
            announcements={{
                onDragStart: (e) => { const d = e.active.data as ScoreDrag | undefined; return d ? `Picked up score ${d.value}.` : "Picked up score."; },
                onDragOver: (e) => { const o = e.over?.data as ScoreDrop | undefined; if (!o) return "Not over a target."; return o.kind === "box" ? `Over the ${o.statKey} box.` : "Over the score pool."; },
                onDragEnd: (e) => { const d = e.active.data as ScoreDrag | undefined; const o = e.over?.data as ScoreDrop | undefined; if (!d || !o) return "Dropped."; if (o.kind === "box") return `Assigned ${d.value} to the ${o.statKey} box.`; return `Returned ${d.value} to the pool.`; },
                onDragCancel: () => "Cancelled drag.",
            }}
        >
        <div>
            <Show when={!is_exist()}>
                <div>
                    <FormField name="Generation Method" formName="Gen Method">
                        <Select value={genMethod()} onChange={(value)=>{
                                setGenMethod(value)
                                if (value === "Point Buy" || value === "Extended Point Buy") {
                                    setCharStats({ "str": 8, "dex": 8, "con": 8, "int": 8, "wis": 8, "cha": 8 });
                                } else if (value === "Standard Array" || value === "Custom Standard Array") {
                                    // Fresh pool/boxes on switch — old values may not exist in the new array.
                                    setCharStats({ "str": 0, "dex": 0, "con": 0, "int": 0, "wis": 0, "cha": 0 });
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
                        <div class={`${styles.selectBox}`}>
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
                                class={`${styles.transparent}`}
                                disabled={isDisabled() ? isDisabled() : false}
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
            </Show>


            <div class={`${styles.pushDown}`}>
                <Switch>
                    <Match when={genMethod() === "Standard Array"}>
                        <div>
                            Drag a score onto an ability, or drag it back here to clear it.
                        </div>
                        <div class={`${styles.pushDown}`}>
                            <strong>Standard Array: </strong>
                            <PoolZone />
                        </div>
                    </Match>
                    <Match when={genMethod() === "Custom Standard Array"}>
                        <div>
                            Drag a score onto an ability, or drag it back here to clear it.
                        </div>
                        <div class={`${styles.pushDown}`}>
                            <strong>Custom Standard Array: </strong>
                            <PoolZone />
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
                <For each={boxConfig}>
                    {(c) => <StatBox
                        statName={c.name}
                        score={c.score}
                        modifier={c.mod}
                        setCharStat={setCharStats}
                        genMethod={genMethod}
                        totalPoints={[pbPoints,setPBPoints]}
                        exist={is_exist}/>}
                </For>
            </div>
        </div>
        <DragOverlay>{(active) => { const d = active?.data as ScoreDrag | undefined; return d ? <span class={styles.dragOverlayChip}>{d.value}</span> : null; }}</DragOverlay>
        </DragDropProvider>
    </FlatCard>
}