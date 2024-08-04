import { Component, For, Show, createMemo, createSignal } from "solid-js";
import useStyle from "../../../../../shared/customHooks/utility/style/styleHook";
import styles from './subclasses.module.scss'
import type { Tab } from "../../../../navbar/navbar";
import HomebrewSidebar from "../../sidebar";
import { Button, Carousel, Chip, Input, Select } from "../../../../../shared/components";
import useDnDClasses from "../../../../../shared/customHooks/dndInfo/srdinfo/useDnDClasses";
import { effect } from "solid-js/web";
import { Subclass } from "../../../../../models/class.model";
import { Option } from "../../../../../shared/components";
import useDnDSpells from "../../../../../shared/customHooks/dndInfo/srdinfo/useDnDSpells";
import { Spell } from "../../../../../models/spell.model";
import HomebrewManager from "../../../../../shared/customHooks/homebrewManager";
import { Clone, getAddNumberAccent, getNumberArray, getSpellcastingDictionary } from "../../../../../shared/customHooks/utility/Tools";

export enum SpellsKnown {
    None = 0,
    Level = 1,
    HalfLevel = 2,
    StatModPlusLevel = 3,
    StatModPlusHalfLevel = 4,
    StatModPlusThirdLevel = 5,
    Other = 6
}

const Subclasses: Component = () => {
    const stylin = useStyle();
    const allClasses = useDnDClasses();
    const allClassNames = ()=> allClasses().map((c)=> c.name);
    const [toAddFeatureLevel, setToAddFeatureLevel] = createSignal(1);
    // ------------ spellcasting ------------
    const allSpells = useDnDSpells();
    const [hasCasting, setHasCasting] = createSignal(false);
    const [halfCasterRoundUp, setHalfCasterRoundUp] = createSignal(false);
    const [spellsKnown, setSpellsKnown] = createSignal<SpellsKnown>(0);
    const [casterType, setCasterType] = createSignal("");
    const [hasRitualCasting, setHasRitualCasting] = createSignal(false);
    const [castingModifier, setCastingModifier] = createSignal("");
    const [hasCantrips, setHasCantrips] = createSignal(false);
    const [selectedSpell, setSelectedSpell] = createSignal<Spell>({} as Spell);
    const [spellsKnownPerLevel, setSpellsKnownPerLevel] = createSignal<{level:number,amount:number}[]>([]);
    const [toAddKnownLevel, setToAddKnownLevel] = createSignal(1);
    const [toAddKnownAmount, setToAddKnownAmount] = createSignal(0);
    // ---------- subclass ------
    const [currentSubclass, setCurrentSubclass] = createSignal<Subclass>({
        id: 0,
        name: "",
        subclassFlavor: "",
        desc: [],
        features: [],
        class: "",
        spells: []
    });
    // ---------- computed ----------
    const getSubclassLevels = createMemo(() => {
        const className = currentSubclass().class.toLowerCase();
        const [ currentClass ] = allClasses().filter((c)=> c.name?.toLowerCase() === className?.toLowerCase());
        
        if (!!currentClass && !!currentClass.subclassLevels && !!currentClass.subclassLevels.length) {
            return currentClass.subclassLevels.map(x=>`${x}`);
        } else {
            switch (className) {
                case 'cleric':
                    return ["1", "2", "6", "8", "17"];
                case 'druid':
                case 'wizard':
                    return ["2", "6", "10", "14"];
                case 'barbarian':
                    return ["3", "6", "10", "14"];
                case 'monk':
                    return ["3", "6", "11", "17"];
                case 'bard':
                    return ["3", "6", "14"];
                case 'sorcerer':
                case 'warlock':
                    return ["1", "6", "14", "18"];
                case 'fighter':
                    return ["3", "7", "10", "15", "18"];
                case 'paladin':
                    return ["3", "7", "15", "20"];
                case 'ranger':
                    return ["3", "7", "11", "15"];
                case 'rogue':
                    return ["3", "9", "13", "17"];
                case 'forgemaster':
                    return ["3", "7", "11", "15", "20"];
                default:
                    return [];
            }
        }
    });

    const canAddSubclass = createMemo(()=>{
        const currentSubclassCheck = allClasses().filter((c)=> c.name.toLowerCase() === currentSubclass().class.toLowerCase());
        const theSubclass = currentSubclass();
        return currentSubclassCheck.length === 1 && theSubclass.name.trim().length > 0 && theSubclass.subclassFlavor.trim().length > 0 && theSubclass.desc.length;
    });
    
    // ---------- functions ----------
    const addFeature = ()=>{
        setCurrentSubclass(old=>{
            const newFeature = {
                info: {
                    className: old.class,
                    subclassName: old.name,
                    level: toAddFeatureLevel(),
                    type: "subclass",
                    other: ""
                },
                name: "",
                value: [""] 
            };
            return {...old, features: [...old.features, newFeature]};
        });
    };

    const getLevelUpFeatures = (level: number)=>{
        return currentSubclass().features.filter((f)=> f.info.level === level);
    }
    
    const getLevelUpComponents = (level:number)=>({
        name: `Level ${level}`,
        element: <div>
            <For each={getLevelUpFeatures(level)}>{(feature, i)=>(
                <>
                    <div>
                        <Input placeholder="Enter a Feature name.." value={feature.name} onChange={(e)=>{
                            setCurrentSubclass(old=>{
                                const currentLevelFeatures = old.features.filter((f)=> f.info.level === level);
                                const otherLevelFeatures = old.features.filter((f)=> f.info.level !== level);
                                const currentFeature = currentLevelFeatures[i()];
                                currentFeature.name = e.currentTarget.value;
                                currentLevelFeatures.splice(i(), 1, currentFeature);
                                old.features = [...otherLevelFeatures, ...currentLevelFeatures];
                                return Clone(old);
                            });
                        }} />
                    </div>
                    <div>
                        <textarea class={`${styles.textArea}`} placeholder="Enter a Feature description.." value={(currentSubclass().features.filter((f)=> f.info.level === level)[i()].value as Array<string>).join('\n')} onChange={(e)=> {
                            setCurrentSubclass(old=>{
                                const currentLevelFeatures = old.features.filter((f)=> f.info.level === level);
                                const otherLevelFeatures = old.features.filter((f)=> f.info.level !== level);
                                const currentFeature = currentLevelFeatures[i()];
                                currentFeature.value = e.currentTarget.value.split('\n');
                                currentLevelFeatures.splice(i(), 1, currentFeature);
                                old.features = [...otherLevelFeatures, ...currentLevelFeatures];
                                return Clone(old);
                            });
                        }} />
                    </div>
                    <div>
                        <Button onClick={(e)=>{
                            setCurrentSubclass(old=>{
                                const currentLevelFeatures = old.features.filter((f)=> f.info.level === level);
                                const otherLevelFeatures = old.features.filter((f)=> f.info.level !== level);
                                currentLevelFeatures.splice(i(), 1);
                                old.features = [...otherLevelFeatures, ...currentLevelFeatures];
                                return Clone(old);
                            });
                        }}>Remove</Button>
                    </div>
                </>
            )}</For>
        </div>
    });

    const clearValues = ()=>{
        setCurrentSubclass({
            id: 0,
            name: "",
            subclassFlavor: "",
            desc: [],
            features: [],
            class: "",
            spells: []
        });
        setToAddFeatureLevel(1);
        setHasCasting(false);
        setHalfCasterRoundUp(false);
        setSpellsKnown(0);
        setCasterType("");
        setHasRitualCasting(false);
        setCastingModifier("");
        setSelectedSpell({} as Spell);
    }

    // ---- effects ----------
    effect(()=>{
        if (hasCasting()) {
           setCurrentSubclass(old=>{
                const newSubclass = {...old};
                newSubclass.spellcasting = {
                    info: newSubclass.spellcasting?.info || [],
                    castingLevels: [],
                    name: newSubclass.name,
                    spellcastingAbility: castingModifier(),
                    casterType: casterType(),
                    spellsKnownCalc: spellsKnown(),
                    spellsKnownRoundup: halfCasterRoundUp(),
                };
                for (let i = 1; i <= 20; i++) {
                    newSubclass.spellcasting?.castingLevels.push({
                        level: i,
                        spellcasting: getSpellcastingDictionary(i, casterType(), hasCantrips())
                    })                 
                }
                return newSubclass;
           })
        } else { 
            setCurrentSubclass(old=>{
                const newSubclass = {...old};
                delete newSubclass.spellcasting;
                return newSubclass;
            });
        }
    })

    effect(()=>{
        if (spellsKnown() === SpellsKnown.Other && casterType().length > 0) {
            setCurrentSubclass(old=>{
                const newSubclass = {...old};
                let newCastingLevels;
                if (!!newSubclass.spellcasting && !!newSubclass.spellcasting.castingLevels) {
                    const spellsKnown = spellsKnownPerLevel();
                    newCastingLevels = newSubclass.spellcasting.castingLevels.map((x)=> {
                        x.spellcasting = getSpellcastingDictionary(x.level, casterType(), hasCantrips());
                        spellsKnown.forEach((y)=>{
                            if (y.level === x.level) {
                                x.spellcasting = {...x.spellcasting, spells_known: y.amount};
                            }
                        });
                        return x;
                    });
                } else {
                    newCastingLevels = newSubclass.spellcasting?.castingLevels || [];
                }
                newSubclass.spellcasting = {
                    info: newSubclass.spellcasting?.info || [],
                    castingLevels: newCastingLevels,
                    name: newSubclass.name,
                    spellcastingAbility: castingModifier(),
                    casterType: casterType(),
                    spellsKnownCalc: spellsKnown(),
                    spellsKnownRoundup: halfCasterRoundUp(),
                };
                return newSubclass;
            });
        }
    })
    
    return (
        <>
            <div class={`${stylin.primary} ${styles.body}`}>
                <h1>subclasses</h1>
                <div>
                    <h2>Choose a class</h2>
                    <Select value={currentSubclass().class} onChange={(e)=>{
                        setCurrentSubclass(old=>({...old, class: e.currentTarget.value}));
                    }}>
                        <For each={allClassNames()}>{(className) => (
                            <Option value={`${className}`}>{className}</Option>
                        )}</For>
                    </Select>
                </div>
                <div>
                    <Input placeholder="Enter a Subclass name.." 
                        value={currentSubclass().name} 
                        onChange={(e)=> setCurrentSubclass(old=>({...old, name: e.currentTarget.value}))} />
                    <Input placeholder="Enter a Subclass flavor.." 
                        value={currentSubclass().subclassFlavor} 
                        onChange={(e)=> setCurrentSubclass(old=>({...old, subclassFlavor: e.currentTarget.value}))} />
                    <textarea 
                        class={`${styles.textArea}`} 
                        placeholder="Enter a Subclass description.." 
                        value={currentSubclass().desc.join("\n")} 
                        onChange={(e)=> setCurrentSubclass(old=>({...old, desc: e.currentTarget.value.split("\n")}))} />
                </div>
                <div>
                    <h2>Level up features</h2>
                    <Select value={toAddFeatureLevel()} onChange={(e)=>{
                        const newLevel = parseInt(e.currentTarget.value);
                        setToAddFeatureLevel(newLevel);
                    }}>
                        <For each={getSubclassLevels()}>{(level) => (
                            <Option value={`${level}`}>{level}</Option>
                        )}</For>
                    </Select>
                    <Button onClick={addFeature}>Add Feature</Button>
                    <Carousel elements={getSubclassLevels().map(x=>getLevelUpComponents(+x))} />
                </div>
                <div>
                    <h2>Spellcasting</h2>
                    <div>
                        <div>
                            <label for="hasCasting">Has Spellcasting: </label>
                            <Input class={`${styles.checkBox}`} checked={hasCasting()} onChange={(e)=>setHasCasting(e.currentTarget.checked)} type="checkbox" name="hasCasting" />
                        </div>
                        <Show when={hasCasting()}>
                            <div class={`${styles.castingRowOne}`}>
                                <span>
                                    <label for="casterType">Caster Type:</label>
                                    <Select name="casterType" value={casterType()} onChange={(e)=>setCasterType(e.currentTarget.value)}>
                                        <Option value="half">Half Caster</Option>
                                        <Option value="third">Third Caster</Option>
                                    </Select>
                                </span>
                                <span>
                                    <label for="castingStat">Casting Stat:</label>
                                    <Select name="castingStat" value={castingModifier()} onChange={(e)=>setCastingModifier(e.currentTarget.value)}>
                                        <For each={["Intelligence", "Wisdom", "Charisma"]}>
                                            {(stat) => <Option value={stat}>{stat}</Option>}
                                        </For>
                                    </Select>
                                </span>
                            </div>
                            <div>
                                <label for="spellsKnown">Spells Known: </label>
                                <Select name="spellsKnown" value={spellsKnown()} onChange={(e)=>setSpellsKnown(+e.currentTarget.value)} > 
                                    <Option value="0">None</Option>
                                    <Option value="1">Level</Option>
                                    <Option value="2">Half Level</Option>
                                    <Option value="3">Stat Modifier + Level</Option>
                                    <Option value="4">Stat Modifier + Half Level</Option>
                                    <Option value="5">Stat Modifier + Third Level</Option>
                                    <Option value="6">Other</Option>
                                </Select>
                                <span>
                                    <label for="halfCasterRoundUp">Round Up: </label>
                                    <Input class={`${styles.checkBox}`} type="checkbox" name="halfCasterRoundUp" checked={halfCasterRoundUp()} onChange={(e)=>setHalfCasterRoundUp(e.currentTarget.checked)} />
                                </span>
                            </div>
                            <Show when={spellsKnown() === SpellsKnown.Other}>
                                <div> 
                                    {/* Spells known by number and select inputs with chips */}
                                    <h3>Spells Known </h3>
                                    <div>
                                        <label for="slotLevel">Class Level: </label>
                                        <Select name="slotLevel" disableUnselected={true} onChange={(e)=>{
                                            setToAddKnownLevel(+e.currentTarget.value);
                                        }}>
                                            <For each={getNumberArray(20)}>{(spell)=>(
                                                    <Option value={spell}>Level {spell}</Option>
                                            )}</For>
                                        </Select>
                                    </div>
                                    <div>
                                        <label for="slotAmount">Slot Amount: </label>
                                        <Input name="slotAmount" type="number" min={0} onChange={(e)=>{
                                            setToAddKnownAmount(+e.currentTarget.value);
                                        }} />
                                    </div>
                                    <Button onClick={(e)=>{
                                        if (!spellsKnownPerLevel().map(x=>x.level).includes(toAddKnownLevel())) {
                                            setSpellsKnownPerLevel((old)=>[...old, {level: toAddKnownLevel(), amount: toAddKnownAmount()}].sort((a,b)=>+a.level-+b.level));
                                        }
                                    }}>Add</Button>
                                </div>
                                <div class={`${styles.chips}`}>
                                    <Chip key={`Level ${toAddKnownLevel()}`} value={`${toAddKnownAmount()}`} />
                                    <For each={spellsKnownPerLevel()}>{(level)=>(
                                        <Chip key={`Level ${level.level}`} value={`${level.amount}`} remove={()=>{
                                            setSpellsKnownPerLevel((old)=> old.filter((x)=> x.level !== level.level));
                                        }} />
                                    )}</For>
                                </div>
                            </Show>
                            <div>
                                <label for="hasCantrips">Has Cantrips: </label>
                                <Input class={`${styles.checkBox}`} type="checkbox" name="hasCantrips" checked={hasCantrips()} onChange={(e)=>setHasCantrips(e.currentTarget.checked)} />
                                <label for="ritualCasting">Ritual Casting: </label>
                                <Input class={`${styles.checkBox}`} type="checkbox" name="ritualCasting" checked={hasRitualCasting()} onChange={(e)=>setHasRitualCasting(e.currentTarget.checked)}  />
                            </div>
                            <div>
                                <h3>Spells Table</h3>
                                <div>
                                    <Select value={JSON.stringify(selectedSpell())} onChange={(e)=>setSelectedSpell(JSON.parse(e.currentTarget.value))} >
                                        <For each={allSpells()}>{(spell)=>(
                                            <Option value={JSON.stringify(spell)}>{spell.name}</Option>
                                        )}</For>
                                    </Select>
                                    <Button onClick={(e)=>setCurrentSubclass(old=>({...old, spells: [...old.spells, selectedSpell()]}))}
                                    >Add Spell</Button>
                                </div>
                                <div>
                                    <For each={currentSubclass().spells}>{(spell)=>(
                                        <Chip key={getAddNumberAccent(+spell.level)} value={spell.name} remove={()=>{
                                            setCurrentSubclass(old=>({...old, spells: old.spells.filter((x)=> x.name !== spell.name)}));
                                        }} />
                                    )}</For>
                                </div>
                            </div>
                            <div>
                                <h3>Spellcasting Info</h3>
                                <div>
                                    <Button onClick={(e)=>{
                                        setCurrentSubclass((old)=>{
                                            const newInfo = [...old.spellcasting?.info || []];
                                            newInfo.push({name: "", desc: []});
                                            return {...old, spellcasting: {...old.spellcasting, info: newInfo}} as Subclass;
                                        })
                                    }}>Add Info</Button>
                                </div>
                                <div>
                                    <For each={currentSubclass().spellcasting?.info || []}>{(info,i)=>(
                                        <div>
                                            <div>
                                                <label for={`nameInput${i()}`}>Title: </label>
                                                <Input name={`nameInput${i()}`} value={info.name} onChange={(e)=>{
                                                    setCurrentSubclass((old) => {
                                                        const newInfo = [...old.spellcasting?.info || []];
                                                        newInfo[i()] = {...newInfo[i()], name: e.currentTarget.value};
                                                        return {...old, spellcasting: {...old.spellcasting, info: newInfo}} as Subclass;
                                                    })
                                                }} />
                                            </div>
                                            <div>
                                                <label for={`descInput${i()}`}>Description: </label>
                                                <textarea class={`${styles.textArea}`} name={`descInput${i()}`} value={info.desc.join("\n")} onChange={(e)=>{
                                                    setCurrentSubclass((old) => {
                                                        const newInfo = [...old.spellcasting?.info || []];
                                                        newInfo[i()] = {...newInfo[i()], desc: e.currentTarget.value.split("\n")};
                                                        return {...old, spellcasting: {...old.spellcasting, info: newInfo}} as Subclass;
                                                    })
                                                }} />
                                            </div>
                                            <div>
                                                <Button onClick={(e)=>{
                                                    setCurrentSubclass((old)=>{
                                                        const newInfo = [...old.spellcasting?.info || []];
                                                        newInfo.splice(i(), 1);
                                                        return {...old, spellcasting: {...old.spellcasting, info: newInfo}} as Subclass;
                                                    })
                                                }}>Remove</Button>
                                            </div>
                                        </div>
                                    )}</For>
                                </div>
                            </div>
                        </Show>
                        <div>
                            <Show when={canAddSubclass()}>
                                <Button onClick={(e)=>{
                                    const updatedClass = allClasses().filter((c)=> c.name === currentSubclass().class)[0];
                                    updatedClass.subclasses = [...updatedClass.subclasses, currentSubclass()];
                                    HomebrewManager.updateClass(updatedClass);
                                    HomebrewManager.updateClassesInDB();
                                    clearValues();
                                }}>Save</Button>
                            </Show>
                        </div>
                    </div>

                </div>
            </div>
        </>
    );
}
export default Subclasses;