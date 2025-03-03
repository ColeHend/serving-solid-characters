import { Component, For, createSignal, createMemo, Show, createEffect, onMount } from "solid-js";
import styles from './spells.module.scss';
import FormField from "../../../../../shared/components/FormField/formField";
import {
  Input,
  Button,
  Select,
  Option,
  Chip,
  useGetClasses,
  Body,
  getAddNumberAccent,
  UniqueSet,
  TextArea
} from "../../../../../shared/";
import useGetSpells from "../../../../../shared/customHooks/data/useGetSpells";
import { createStore } from "solid-js/store";
import { Spell } from "../../../../../models";
import HomebrewManager from "../../../../../shared/customHooks/homebrewManager";
import { useSearchParams } from "@solidjs/router";

const Spells: Component = () => {
  const doesExist = ()=>{
    return HomebrewManager.spells().findIndex((x) => x.name === currentSpell.name) > -1;
  }
  const createSpell = () => {
    HomebrewManager.addSpell(currentSpell);
  }
  const updateSpell = () => {
    HomebrewManager.updateSpell(currentSpell);
  }
  const [currentSpell, setCurrentSpell] = createStore<Spell>({
    name: "",
    desc: "",
    duration: "",
    concentration: false,
    level: "0",
    range: "",
    ritual: false,
    school: "",
    castingTime: "",
    damageType: "",
    page: "",
    isMaterial: false,
    isSomatic: false,
    isVerbal: false,
    materials_Needed: "",
    higherLevel: "",
    classes: [],
    subClasses: [],
  });
  const spellLevels = Array.from({ length: 10 }, (_, i) => i);
  const allSpells = useGetSpells();
  const allClasses = useGetClasses();
  const [searchParam, setSearchParam] = useSearchParams();
  const ClassNames = createMemo(()=> allClasses().map((x) => x.name));
  const [tempValue, setTempValue] = createStore<{[key:string]:string}>({});
  const [showCustoms, setShowCustoms] = createStore<{ [key: string]: boolean }>({
    castingTime: false,
    range: false,
  });
  const [spellDesc, setSpellDesc] = createSignal("");
  const [spellHigherLevel, setSpellHigherLevel] = createSignal("");

  const getSchools = () => {
    const schools = new UniqueSet<string>();
		
    allSpells().forEach(spell => schools.add(spell.school));
    return schools.value.sort()
  };
  const getCastingTimes = () => {
    const castingTimes = new UniqueSet<string>();
    allSpells().forEach(spell => castingTimes.add(spell.castingTime));
    return castingTimes.value.sort()
  };
  const getRanges = () => {
    const ranges = new UniqueSet<string>();
    allSpells().forEach(spell => ranges.add(spell.range));
    return ranges.value.sort()
  }
  const getDurations = () => {
    const durations = new UniqueSet<string>(); 
    allSpells().forEach(spell => durations.add(spell.duration));
    return durations.value.sort()
  }
  const fillSpellInfo = (search?: boolean)=> {
    const searchName = search ? searchParam.name : currentSpell.name;
    const spell = HomebrewManager.spells().find((x)=>x.name === searchName);
    const srdSpell = allSpells().find((x)=>x.name === searchName)

    if(srdSpell) {
      setCurrentSpell(srdSpell);
      setSpellDesc(srdSpell.desc);
      setSpellHigherLevel(srdSpell.higherLevel);
    }
    if (spell) {
      setCurrentSpell(spell);
      setSpellDesc(spell.desc);
      setSpellHigherLevel(spell.higherLevel);
    };
  };

  onMount(()=>{
    if (searchParam.name) fillSpellInfo(true);
  })
  createEffect(() => {
    setCurrentSpell({ 'desc': spellDesc() });
  });
  createEffect(() => {
    setCurrentSpell({ 'higherLevel': spellHigherLevel() });
  });

  return (
    <>
      <Body>
        <h1>Spells</h1>
        <div class={`${styles.wrapper}`}>
          <p>
            <FormField class={`${styles.smallField}`} name="Spell Name">
              <Input transparent value={currentSpell['name']} onInput={(e) => setCurrentSpell({ name: e.currentTarget.value })} />
            </FormField>
            <Show when={doesExist()}>
              <Button onClick={()=>fillSpellInfo()}>Fill Info</Button>
              <Button onClick={() => HomebrewManager.removeSpell(currentSpell.name)}>Delete</Button>
            </Show>
          </p>
          <span class={`${styles.break}`} />
          <p>
            <Input id="hasVerbal" type="checkbox"
              class={`${styles.check}`}
              checked={currentSpell['isVerbal']}
              onChange={(e) => setCurrentSpell({ isVerbal: e.currentTarget.checked })} />
            <label for="hasVerbal">has Verbal?</label>
            <Input id="hasSomatic" type="checkbox"
              class={`${styles.check}`}
              checked={currentSpell['isSomatic']}
              onChange={(e) => setCurrentSpell({ isSomatic: e.currentTarget.checked })} />
            <label for="hasSomatic">has Somatic?</label>
            <Input checked={currentSpell['isMaterial']}
              class={`${styles.check}`}
              onclick={(e) => setCurrentSpell({ "isMaterial": e.currentTarget.checked })}
              id="hasMaterial" type="checkbox" />
            <label for="hasMaterial">has Material?</label>
          </p>
          <span class={`${styles.break}`} />
          <Show when={currentSpell['isMaterial']}>
            <div>
              <FormField class={`${styles.smallField}`} name="Material Components">
                <Input transparent
                  value={currentSpell['materials_Needed']}
                  onChange={(e) => setCurrentSpell({ materials_Needed: e.currentTarget.value })} />
              </FormField>
            </div>
          </Show>
          <span class={`${styles.break}`} />
          <p class={`${styles.field}`}>
            <label>Level </label>
            <Select class={`${styles.border}`} value={currentSpell["level"]} onChange={(e) => setCurrentSpell({ level: e.currentTarget.value })} transparent>
              <For each={spellLevels}>{(slotLevel) =>
                <Option value={slotLevel.toString(10)} >
                  {getAddNumberAccent(slotLevel)}
                </Option>
              }</For>
            </Select>
          </p>
          <p class={`${styles.field}`}>
            <label>School </label>
            <Select class={`${styles.border}`}
              value={currentSpell["school"]}
              onChange={(e) => setCurrentSpell({ "school": e.currentTarget.value })} transparent>
              <For each={getSchools()}>{(school) =>
                <Option value={school} >
                  {school}
                </Option>
              }</For>
            </Select>
          </p>
          <span class={`${styles.break}`} />
          <p class={`${styles.field}`}>
            <label for="isRitual">is Ritual?</label>
            <Input id="isRitual" type="checkbox"
              checked={currentSpell['ritual']}
              onChange={(e) => setCurrentSpell({ ritual: e.currentTarget.checked })} />
          </p>
          <div class={`${styles.field}`}>
            <h4>Classes?</h4>
            <Select class={`${styles.border}`} value={tempValue["currentClass"]} onChange={(e)=>setTempValue({"currentClass": e.currentTarget.value})} transparent>
              <For each={ClassNames()}>{(className) =>
                <Option value={className} >
                  {className}
                </Option>
              }</For>
            </Select>
            <Button disabled={currentSpell["classes"].includes(tempValue["currentClass"])} onClick={(e)=>{
              setCurrentSpell({ classes: [...currentSpell["classes"], tempValue["currentClass"]] })
            }}>Add</Button>
          </div>
          <span class={`${styles.break}`} />
          <div class={`${styles.classList}`}>
            <For each={currentSpell["classes"]}>{(className) =>
              <Chip key="Class" value={className} remove={()=>{
                setCurrentSpell({ classes: currentSpell["classes"].filter((x)=>x !== className) })
              }} />
            }</For>
          </div>
          <span class={`${styles.break}`} />
          <p class={`${styles.field}`}>
            <span>
              <label >Custom</label>
              <Input type="checkbox" tooltip="Custom Input?"
                onClick={(e) => setShowCustoms({ "castingTime": e.currentTarget.checked })}
                checked={showCustoms["castingTime"]} />
            </span>
            <Show when={!showCustoms["castingTime"]}>
              <label>Casting Time</label>
              <Select class={`${styles.border}`}
                value={currentSpell["castingTime"]}
                onChange={(e) => setCurrentSpell({ "castingTime": e.currentTarget.value })} transparent>
                <For each={getCastingTimes()}>{(castingTime) =>
                  <Option value={castingTime} >
                    {castingTime}
                  </Option>
                }</For>
              </Select>
            </Show>
            <Show when={showCustoms["castingTime"]}>
              <FormField class={`${styles.smallField}`} name="Casting Time">
                <Input transparent
                  value={currentSpell["castingTime"]}
                  onChange={(e) => setCurrentSpell({ "castingTime": e.currentTarget.value })} />
              </FormField>
            </Show>
          </p>
          <p class={`${styles.field}`}>
            <span>
              <label>Custom</label>
              <Input type="checkbox" tooltip="Custom Input?"
                onClick={(e) => setShowCustoms({ "range": e.currentTarget.checked })}
                checked={showCustoms["range"]} />
            </span>
            <Show when={!showCustoms["range"]}>
              <label>Range</label>
              <Select class={`${styles.border}`} transparent
                value={currentSpell['range']}
                onChange={(e) => setCurrentSpell({ 'range': e.currentTarget.value })}>
                <For each={getRanges()}>{(range) =>
                  <Option value={range} >
                    {range}
                  </Option>
                }</For>
              </Select>
            </Show>
            <Show when={showCustoms["range"]}>
              <FormField class={`${styles.smallField}`} name="Range">
                <Input transparent value={currentSpell['range']}
                  onChange={(e) => setCurrentSpell({ 'range': e.currentTarget.value })} />
              </FormField>
            </Show>
          </p>
					
          <span class={`${styles.break}`} />
          <p class={`${styles.field}`}>
            <span>
              <label >Custom</label>
              <Input type="checkbox" tooltip="Custom Input?" 
                onClick={(e) => setShowCustoms({ "duration": e.currentTarget.checked })}
                checked={showCustoms["duration"]} />
            </span>
            <span>
              <label for="isConcentration">isConcentration?</label>
              <Input id="isConcentration" type="checkbox" tooltip="Custom Input?"
                class={`${styles.check}`}
                onClick={(e) => setCurrentSpell({ "concentration": e.currentTarget.checked })}
                checked={currentSpell["concentration"]} />
              <Show when={!showCustoms["duration"]}>
                <label>Duration</label>
                <Select class={`${styles.border}`} transparent 
                  value={currentSpell["duration"]} 
                  onChange={(e)=>{
                    setCurrentSpell({ duration: e.currentTarget.value })
                  }}>
                  <For each={getDurations().filter((val) => currentSpell["concentration"] ? val.toLowerCase().includes("concentration") : !val.toLowerCase().includes("concentration"))}>{(duration) =>
                    <Option value={duration} >
                      {duration}
                    </Option>
                  }</For>
                </Select>
              </Show>
              <Show when={showCustoms["duration"]}>
                <FormField class={`${styles.smallField}`} name="Duration">
                  <Input transparent
                    value={currentSpell['duration']}
                    onChange={(e) => setCurrentSpell({ duration: e.currentTarget.value })} />
                </FormField>
              </Show>
            </span>
          </p>
          <span class={`${styles.break}`} />
          <p>
            <FormField name="Description">
              <TextArea transparent={true} text={spellDesc} setText={setSpellDesc} picToTextEnabled={true} />
            </FormField>
          </p>
          <span class={`${styles.break}`} />
          <p>
            <FormField name="Higher Levels">
              <TextArea transparent={true} text={spellHigherLevel} setText={setSpellHigherLevel} picToTextEnabled={true} />
            </FormField>
          </p>
          <span class={`${styles.break}`} />
          <p>
            <Show when={!doesExist()}>
              <Button onClick={createSpell}>Create</Button>
            </Show>
            <Show when={doesExist()}>
              <Button onClick={updateSpell}>Update</Button>
            </Show>
          </p>
        </div>
      </Body>
    </>
  );
}
export default Spells;