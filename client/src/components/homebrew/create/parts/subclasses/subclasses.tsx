import { Component, For, Show, createMemo, createSignal, onMount, batch } from "solid-js";
import { homebrewManager, getAddNumberAccent, getNumberArray, getSpellcastingDictionary, useDnDClasses} from "../../../../../shared";
import styles from './subclasses.module.scss';
import { Subclass } from "../../../../../models/old/class.model";
import { useSearchParams } from "@solidjs/router";
import { Feature } from "../../../../../models/old/core.model";
import { Body, Select, Option, FormField, Checkbox, Input, TextArea, Button, Chip } from "coles-solid-library";
import { useDnDSpells } from "../../../../../shared/customHooks/dndInfo/info/all/spells";
import { Spell } from "../../../../../models";
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
  // URL params
  const [searchParam, setSearchParam] = useSearchParams();

  // Source data hooks
  const allClasses = useDnDClasses();
  const allClassNames = () => allClasses().map(c => c.name);
  const allSpells = useDnDSpells();

  // Core subclass granular state
  const [subclassClass, setSubclassClass] = createSignal("");
  const [subclassName, setSubclassName] = createSignal("");
  const [subclassDesc, setSubclassDesc] = createSignal<string[]>([]);
  const [subclassFeatures, setSubclassFeatures] = createSignal<Feature<string,string>[]>([]);
  const [subclassSpells, setSubclassSpells] = createSignal<Spell[]>([]);

  // Feature editing
  const [toAddFeatureLevel, setToAddFeatureLevel] = createSignal(0);
  const getLevelUpFeatures = (level:number) => subclassFeatures().filter(f => f.info.level === level);
  const [showFeatureModal, setShowFeatureModal] = createSignal(false); // placeholder for future modal logic
  const [editIndex, setEditIndex] = createSignal(-1);

  // Spellcasting config
  const [hasCasting, setHasCasting] = createSignal(false);
  const [casterType, setCasterType] = createSignal(""); // "half" | "third"
  const [castingModifier, setCastingModifier] = createSignal(""); // stat string
  const [spellsKnown, setSpellsKnown] = createSignal<SpellsKnown>(SpellsKnown.None);
  const [halfCasterRoundUp, setHalfCasterRoundUp] = createSignal(false);
  const [hasCantrips, setHasCantrips] = createSignal(false);
  const [hasRitualCasting, setHasRitualCasting] = createSignal(false);
  const [spellsKnownPerLevel, setSpellsKnownPerLevel] = createSignal<{level:number,amount:number}[]>([]);
  const [toAddKnownLevel, setToAddKnownLevel] = createSignal(1);
  const [toAddKnownAmount, setToAddKnownAmount] = createSignal(0);
  const [spellcastingInfo, setSpellcastingInfo] = createSignal<{name:string,desc:string[]}[]>([]);

  // Spell selection (avoid JSON stringify churn)
  const [selectedSpellName, setSelectedSpellName] = createSignal<string | undefined>(undefined);
  const selectedSpell = createMemo(() => allSpells().find(s => s.name === selectedSpellName()));

  // Derived: subclass levels for feature options
  const getSubclassLevels = createMemo(() => {
    const className = subclassClass().toLowerCase();
    const [ currentClass ] = allClasses().filter((c)=> c.name?.toLowerCase() === className?.toLowerCase());
				
        
    if (!!currentClass && !!currentClass.classMetadata?.subclassLevels?.length) {
      return currentClass.classMetadata.subclassLevels.map(x=>`${x}`);
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

  // Derived spellcasting levels
  const baseCastingLevels = createMemo(() => {
    if (!hasCasting()) return [] as {level:number, spellcasting: Record<string,number>}[];
    return Array.from({length:20}, (_,i)=>({
      level: i+1,
      spellcasting: getSpellcastingDictionary(i+1, casterType(), hasCantrips())
    }));
  });

  // Apply custom spells known if "Other"
  const mergedCastingLevels = createMemo(() => {
    if (!hasCasting()) return [];
    const useCustom = spellsKnown() === SpellsKnown.Other;
    const map = spellsKnownPerLevel();
    if (!useCustom) return baseCastingLevels();
    return baseCastingLevels().map(l => {
      const custom = map.find(x => x.level === l.level);
      return custom ? { ...l, spellcasting: { ...l.spellcasting, spells_known: custom.amount } } : l;
    });
  });

  const spellcasting = createMemo(() => {
    if (!hasCasting()) return undefined;
    return {
      info: spellcastingInfo(),
      castingLevels: mergedCastingLevels(),
      name: subclassName(),
      spellcastingAbility: castingModifier(),
      casterType: casterType(),
      spellsKnownCalc: spellsKnown(),
      spellsKnownRoundup: halfCasterRoundUp(),
      ritualCasting: hasRitualCasting()
    } as Subclass['spellcasting'];
  });

  // Assembled subclass (pure)
  const currentSubclass = createMemo<Subclass>(() => ({
    id: 0,
    name: subclassName(),
    desc: subclassDesc(),
    features: subclassFeatures(),
    class: subclassClass(),
    spells: subclassSpells(),
    spellcasting: spellcasting()
  } as Subclass));

  const canAddSubclass = createMemo(() => {
    if (!subclassClass() || !subclassName().trim() || subclassDesc().length === 0) return false;
    return allClasses().some(c => c.name.toLowerCase() === subclassClass().toLowerCase());
  });

  const clearValues = () => {
    batch(() => {
      setSubclassClass("");
      setSubclassName("");
      setSubclassDesc([]);
      setSubclassFeatures([]);
      setSubclassSpells([]);
      setHasCasting(false);
      setCasterType("");
      setCastingModifier("");
      setSpellsKnown(SpellsKnown.None);
      setHalfCasterRoundUp(false);
      setHasCantrips(false);
      setHasRitualCasting(false);
      setSpellsKnownPerLevel([]);
      setSpellcastingInfo([]);
      setToAddFeatureLevel(0);
      setSelectedSpellName(undefined);
    });
  };

  // URL param hydration (one-time)
  onMount(() => {
    if (searchParam.name && searchParam.subclass) {
      const [cls] = allClasses().filter(c => c.name.toLowerCase() === searchParam.name!.toLowerCase());
      if (cls) {
        const [sc] = cls.subclasses.filter(s => s.name.toLowerCase() === searchParam.subclass!.toLowerCase());
        if (sc) {
          batch(() => {
            setSubclassClass(cls.name);
            setSubclassName(sc.name);
            setSubclassDesc(sc.desc || []);
            setSubclassFeatures(sc.features || []);
            setSubclassSpells(sc.spells || []);
            if (sc.spellcasting) {
              setHasCasting(true);
              setCasterType(sc.spellcasting.casterType || "");
              setCastingModifier((sc.spellcasting.spellcastingAbility as unknown as string) || "");
              setSpellsKnown(sc.spellcasting.spellsKnownCalc as SpellsKnown ?? SpellsKnown.None);
              setHalfCasterRoundUp(!!sc.spellcasting.spellsKnownRoundup);
              setSpellcastingInfo(sc.spellcasting.info || []);
              // Custom known extraction
              const custom = (sc.spellcasting.castingLevels || []).map(x => ({ level: x.level, amount: (x as any).spellcasting?.spells_known })).filter(x => typeof x.amount === 'number');
              if (custom.length) setSpellsKnownPerLevel(custom as {level:number,amount:number}[]);
            }
          });
        }
      }
    }
  });

  // Helpers to mutate features
  const updateParamsIfReady = () => {
    if (subclassClass() && subclassName()) {
      setSearchParam({ name: subclassClass(), subclass: subclassName() });
    }
  };

  return (
    <>
      <Body>
        <h1>Subclass Homebrew</h1>
        <div></div>
        <div>
          <h2>Choose a class</h2>
          <Select transparent value={subclassClass()} onChange={(e)=>{
            setSubclassClass(e);
            if (getSubclassLevels().length > 0) setToAddFeatureLevel(+getSubclassLevels()[0]);
            updateParamsIfReady();
          }}>
            <For each={allClassNames()}>{(className) => (
              <Option value={`${className}`}>{className}</Option>
            )}</For>
          </Select>
        </div>
        <div style={{display:"flex","flex-direction":"column"}}>
          <FormField name="Subclass Name">
            <Input transparent value={subclassName()} 
              onChange={(e)=> { setSubclassName(e.currentTarget.value); updateParamsIfReady(); }} />
          </FormField>
          <FormField class={`${styles.textArea}`}  name="Subclass Description">
            <TextArea 
              placeholder="Enter a Subclass description.." 
              text={()=>subclassDesc().join("\n")}
              setText={() => { /* no-op handled by onChange */ return; }}
              value={subclassDesc().join("\n")} 
              transparent
              onChange={(e)=> setSubclassDesc(e.currentTarget.value.split("\n"))} />
          </FormField>
        </div>
        <Show when={subclassClass().trim().length > 0}>
          <div>
            <h2>Level up features</h2>
            <Select value={toAddFeatureLevel()} transparent onChange={(e)=>{
              setToAddFeatureLevel(e);
            }}>
              <For each={getSubclassLevels()}>{(level) => (
                <Option value={`${level}`}>{level}</Option>
              )}</For>
            </Select>
            <Show when={toAddFeatureLevel() > 0}>
              <Button onClick={()=>setShowFeatureModal(old=>!old)}>Add Feature (modal TBD)</Button>
            </Show>
            <For each={getLevelUpFeatures(toAddFeatureLevel())}>{(feature)=>(
              <Button onClick={()=>{
                setEditIndex(subclassFeatures().indexOf(feature));
                setShowFeatureModal(true);
              }}>{feature.name}</Button>
            )}</For>
          </div>
        </Show>
        <div>
          <h2>Spellcasting</h2>
          <div>
            <div>
              <Checkbox checked={hasCasting()} onChange={(e)=>setHasCasting(e)} label="Has Spellcasting" />
            </div>
            <Show when={hasCasting()}>
              <div class={`${styles.castingRowOne}`}>
                <span>
                  <label for="casterType">Caster Type:</label>
                  <Select value={casterType()} onChange={(e)=>setCasterType(e)}>
                    <Option value="half">Half Caster</Option>
                    <Option value="third">Third Caster</Option>
                  </Select>
                </span>
                <span>
                  <label for="castingStat">Casting Stat:</label>
                  <Select value={castingModifier()} onChange={(e)=>setCastingModifier(e)}>
                    <For each={["Intelligence", "Wisdom", "Charisma"]}>
                      {(stat) => <Option value={stat}>{stat}</Option>}
                    </For>
                  </Select>
                </span>
              </div>
              <div>
                <label for="spellsKnown">Spells Known: </label>
                <Select value={spellsKnown()} onChange={(e)=>setSpellsKnown(+e)} > 
                  <Option value="0">None</Option>
                  <Option value="1">Level</Option>
                  <Option value="2">Half Level</Option>
                  <Option value="3">Stat Modifier + Level</Option>
                  <Option value="4">Stat Modifier + Half Level</Option>
                  <Option value="5">Stat Modifier + Third Level</Option>
                  <Option value="6">Other</Option>
                </Select>
                <span>
                  <Checkbox checked={halfCasterRoundUp()} onChange={(e)=>setHalfCasterRoundUp(e)} label="Half Caster Round Up" />
                </span>
              </div>
              <Show when={spellsKnown() === SpellsKnown.Other}>
                <div> 
                  {/* Spells known by number and select inputs with chips */}
                  <h3>Spells Known </h3>
                  <div>
                    <label for="slotLevel">Class Level: </label>
                    <Select onChange={setToAddKnownLevel}>
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
                  <Button onClick={()=>{
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
                <Checkbox checked={hasCantrips()} onChange={(e)=>setHasCantrips(e)} label="Has Cantrips" />
                <Checkbox checked={hasRitualCasting()} onChange={(e)=>setHasRitualCasting(e)} label="Ritual Casting" />
              </div>
              <div>
                <h3>Spells Table</h3>
                <div>
                  <Select value={selectedSpellName() || ""} onChange={(e)=>setSelectedSpellName(e)}>
                    <For each={allSpells()}>{(spell)=>(
                      <Option value={spell.name}>{spell.name}</Option>
                    )}</For>
                  </Select>
                  <Button onClick={()=>{ if (selectedSpell()) setSubclassSpells(old => old.some(s=>s.name===selectedSpell()!.name) ? old : [...old, selectedSpell()!]) }}>Add Spell</Button>
                </div>
                <div>
                  <For each={subclassSpells()}>{(spell)=>(
                    <Chip key={getAddNumberAccent(+spell.level)} value={spell.name} remove={()=>{
                      setSubclassSpells(old => old.filter(x => x.name !== spell.name));
                    }} />
                  )}</For>
                </div>
              </div>
              <div>
                <h3>Spellcasting Info</h3>
                <div>
                  <Button onClick={()=>{
                    setSpellcastingInfo(info => [...info, { name: "", desc: [] }]);
                  }}>Add Info</Button>
                </div>
                <div>
                  <For each={spellcastingInfo()}>{(info,i)=>(
                    <div>
                      <div>
                        <label for={`nameInput${i()}`}>Title: </label>
                        <Input name={`nameInput${i()}`} value={info.name} onChange={(e)=>{
                          setSpellcastingInfo(arr => {
                            const clone = [...arr];
                            clone[i()] = { ...clone[i()], name: e.currentTarget.value };
                            return clone;
                          });
                        }} />
                      </div>
                      <div>
                        <label for={`descInput${i()}`}>Description: </label>
                        <textarea class={`${styles.textArea}`} name={`descInput${i()}`} value={info.desc.join("\n")} onChange={(e)=>{
                          setSpellcastingInfo(arr => {
                            const clone = [...arr];
                            clone[i()] = { ...clone[i()], desc: e.currentTarget.value.split("\n") };
                            return clone;
                          });
                        }} />
                      </div>
                      <div>
                        <Button onClick={()=>{
                          setSpellcastingInfo(arr => arr.filter((_,idx)=> idx !== i()));
                        }}>Remove</Button>
                      </div>
                    </div>
                  )}</For>
                </div>
              </div>
            </Show>
            <div>
              <Show when={canAddSubclass()}>
                <Button onClick={()=>{
                  const target = allClasses().find(c => c.name === subclassClass());
                  if (!target) return;
                  const cloned = { ...target, subclasses: [...target.subclasses, currentSubclass()] };
                  homebrewManager.updateClass(cloned);
                  homebrewManager.updateClassesInDB();
                  clearValues();
                }}>Save</Button>
              </Show>
            </div>
          </div>

        </div>
      </Body>
    </>
  );
}
export default Subclasses;