import { Component, For, Match, Switch, createSignal, createMemo, Show, onMount, createEffect, onCleanup } from "solid-js";
import styles from "./feats.module.scss";
import { homebrewManager, } from "../../../../../shared/";
import { Input, Select, Option, Chip, Body, Button, TextArea, FormField} from "coles-solid-library";
import { effect } from "solid-js/web";
import { Feat, Prerequisite, PrerequisiteType } from "../../../../../models/data";
import HomebrewManager from "../../../../../shared/customHooks/homebrewManager";
import { useSearchParams } from "@solidjs/router";
import { useDnDClasses } from "../../../../../shared/customHooks/dndInfo/info/all/classes";
import { useDnDFeats } from "../../../../../shared/customHooks/dndInfo/info/all/feats";
import { useDnDSubclasses } from "../../../../../shared/customHooks/dndInfo/info/all/subclasses";
import { useDnDRaces } from "../../../../../shared/customHooks/dndInfo/info/all/races";
import { useDnDItems } from "../../../../../shared/customHooks/dndInfo/info/all/items";
import { FlatCard } from "../../../../../shared/components/flatCard/flatCard";


const Feats: Component = () => {
  const classes = useDnDClasses();
  const feats = useDnDFeats();
  const subclasses = useDnDSubclasses();
  const races = useDnDRaces();
  const items = useDnDItems();
  // local prerequisite representation is the new data model Prerequisite[]
  const [prerequisites, setPrerequisites] = createSignal<Prerequisite[]>([]);
  const [selectedType, setSelectedType] = createSignal<PrerequisiteType>(PrerequisiteType.Stat);
  const [featName, setFeatName] = createSignal<string>("");
  const [keyName, setKeyName] = createSignal<string>("str");
  const [keyValue, setKeyValue] = createSignal<string>("0");
  const [featDescription, setFeatDescription] = createSignal<string>("");
  const [classLevel, setClassLevel] = createSignal<string>("");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [searchParams, setSearchParams] = useSearchParams();
  const clearFields = () => {
    setPrerequisites([]);
  setSelectedType(PrerequisiteType.Stat);
    setFeatName("");
    setKeyName("str");
    setKeyValue("0");
    setFeatDescription("");
  setClassLevel("");
  };

  const addPreReq = () => {
  const type = selectedType();
  if (type === PrerequisiteType.Stat) {
      setPrerequisites(old => [...old, { type: PrerequisiteType.Stat, value: `${keyName().toUpperCase()} ${keyValue()}` }]);
  } else if (type === PrerequisiteType.Class) {
  const lvl = classLevel();
  const base = keyValue();
  const val = lvl && /^\d+$/.test(lvl) ? `${base} ${lvl}` : base;
  setPrerequisites(old => [...old, { type: PrerequisiteType.Class, value: val }]);
  } else if (type === PrerequisiteType.Level) {
      setPrerequisites(old => [...old, { type: PrerequisiteType.Level, value: keyValue() }]);
    } else if (type === PrerequisiteType.String) {
      if (keyValue().trim()) setPrerequisites(old => [...old, { type: PrerequisiteType.String, value: keyValue().trim() }]);
    } else if (type === PrerequisiteType.Subclass) {
      setPrerequisites(old => [...old, { type: PrerequisiteType.Subclass, value: keyValue() }]);
    } else if (type === PrerequisiteType.Feat) {
      setPrerequisites(old => [...old, { type: PrerequisiteType.Feat, value: keyValue() }]);
    } else if (type === PrerequisiteType.Race) {
      setPrerequisites(old => [...old, { type: PrerequisiteType.Race, value: keyValue() }]);
    } else if (type === PrerequisiteType.Item) {
      setPrerequisites(old => [...old, { type: PrerequisiteType.Item, value: keyValue() }]);
    }
  };

  const prefillFromQuery = (featNameParam: string) => {
    if (!featNameParam) return;
    // Prefer homebrew feat; fallback to SRD feats hook
    const hb = HomebrewManager.feats().find((x:any) => x.details?.name === featNameParam || x.name === featNameParam);
    const srd = feats().find((x:any) => x.details?.name === featNameParam || x.name === featNameParam);
    const chosen: any = hb || srd;
    if (!chosen) return;
    if (Array.isArray(chosen.prerequisites)) setPrerequisites(chosen.prerequisites);
    else if (Array.isArray(chosen.preReqs)) {
      // Legacy mapping
      const mapped = chosen.preReqs.map((f:any): Prerequisite => {
        const raw = (f?.value || f?.name || '').toString();
        if (/^(STR|DEX|CON|INT|WIS|CHA)\s+\d+$/i.test(raw)) return { type: PrerequisiteType.Stat, value: raw.toUpperCase() };
        if (/^\d+$/.test(raw)) return { type: PrerequisiteType.Level, value: raw };
        return { type: PrerequisiteType.Class, value: raw };
      });
      setPrerequisites(mapped);
    } else setPrerequisites([]);
    setFeatDescription(chosen.details?.description || (Array.isArray(chosen.desc) ? chosen.desc[0] : chosen.desc) || '');
    setFeatName(chosen.details?.name || chosen.name || '');
  };

  effect(() => {
    switch (selectedType()) {
      case PrerequisiteType.Stat:
        setKeyName("STR");
        setKeyValue("10");
        break;
      case PrerequisiteType.Class:
        setKeyName("Class");
        setKeyValue(classes()[0]?.name || "Barbarian");
        setClassLevel("");
        break;
      case PrerequisiteType.Level:
        setKeyName("Level");
        setKeyValue("1");
        break;
      case PrerequisiteType.Subclass: {
        const sc = subclasses()[0];
        setKeyName("Subclass");
        setKeyValue(sc ? `${sc.parentClass}:${sc.name}` : "");
        break;
      }
      case PrerequisiteType.Feat: {
        const f = feats()[0];
        setKeyName("Feat");
        setKeyValue(f ? (f as any).details?.name || (f as any).name || "" : "");
        break;
      }
      case PrerequisiteType.Race: {
        const r:any = races()[0];
        setKeyName("Race");
        setKeyValue(r ? r.name : "");
        break;
      }
      case PrerequisiteType.Item: {
        const it:any = items()[0];
        setKeyName("Item");
        setKeyValue(it ? it.name : "");
        break;
      }
      case PrerequisiteType.String:
        setKeyName("Text");
        setKeyValue("");
        break;
      default:
        break;
    }
  });

  const currentFeat = createMemo(()=>{
    const newFeat: any = {
      // Root fields required by Dexie schema ('name') & legacy mapping
      name: featName(),
      desc: [featDescription()],
      details: { name: featName(), description: featDescription() },
      prerequisites: prerequisites()
    } as Feat & { name: string; desc: string[] };
    return newFeat as Feat;
  });
  onMount(() => { 
    if (searchParams.name && typeof searchParams.name === "string") prefillFromQuery(searchParams.name); 

    document.body.classList.add('feats-bg');
  });
  createEffect(() => { const qp = typeof searchParams.name === "string" ? searchParams.name : searchParams.name?.join(" "); if (qp) prefillFromQuery(qp); });
  const featExists = createMemo(()=>{
    return HomebrewManager.feats().findIndex((x) => (x as any).details?.name === featName() || x.name === featName()) !== -1;
  });
  const addFeat = () => {
    homebrewManager.addFeat(currentFeat() as any);
    clearFields();
  };
  const updateFeat = () => {
    homebrewManager.updateFeat(currentFeat() as any);
    clearFields();
  }

  const isValid = createMemo(() => {
    return featName()?.trim().length > 0;
  })

  onCleanup(() => {
    document.body.classList.remove('feats-bg');
  })

  return (
    <Body class={`${styles.body}`}>
        <h1>Feats</h1>
        <div class="featHomebrew">
          <FlatCard icon="identity_platform" headerName="Identity" startOpen={true} transparent>
            <div class={`${styles.name}`}>
              <h2>Add Name</h2>
              <FormField name="Add Name">
                <Input
                  type="text"
                  transparent
                  id="featName"
                  value={featName()}
                  onChange={(e) => setFeatName(e.currentTarget.value)}
                  onInput={(e) => setFeatName((e.target as HTMLInputElement).value)}
                />
              </FormField>
              <Show when={featExists()}>
                <Button onClick={()=>{
                  const feat = HomebrewManager.feats().find((x:any) => x.details?.name === featName() || x.name === featName());
                  const srdFeat = feats().find((x:any) => x.details?.name === featName() || x.name === featName());
                  const chosen: any = feat || srdFeat;
                  if (chosen) {
                    // Prefer new model prerequisites
                    if (Array.isArray(chosen.prerequisites)) {
                      setPrerequisites(chosen.prerequisites);
                    } else if (Array.isArray(chosen.preReqs)) {
                      // Map legacy Feature<string,string>[] into Prerequisite[] best-effort
                      // Heuristic: if value looks like STAT + number use Stat, if numeric only -> Level, else Class
                      const mapped = chosen.preReqs.map((f:any): Prerequisite => {
                        const raw = (f?.value || f?.name || '').toString();
                        if (/^(STR|DEX|CON|INT|WIS|CHA)\s+\d+$/i.test(raw)) {
                          return { type: PrerequisiteType.Stat, value: raw.toUpperCase() };
                        }
                        if (/^\d+$/.test(raw)) {
                          return { type: PrerequisiteType.Level, value: raw };
                        }
                        return { type: PrerequisiteType.Class, value: raw };
                      });
                      setPrerequisites(mapped);
                    } else {
                      setPrerequisites([]);
                    }
                    setFeatDescription(chosen.details?.description || (Array.isArray(chosen.desc) ? chosen.desc[0] : chosen.desc) || '');
                  }
                }}>Fill</Button>
              </Show>
            </div>
          </FlatCard>
          <FlatCard icon="deployed_code" headerName="Prerequisites" transparent>
            <div class={`${styles.preRequisites}`}>
              
              <h2>Add Pre-Requisites</h2>
              <div>
                <Select
                  value={selectedType()}
                  onChange={(e) => setSelectedType(() => +e as PrerequisiteType)}
                  transparent
                >
                  <Option value={PrerequisiteType.Stat}>Ability Score</Option>
                  <Option value={PrerequisiteType.Class}>Class</Option>
                  {/* Label kept as 'Class Level' for backward test compatibility (test searches /Class Level/) */}
                  <Option value={PrerequisiteType.Level}>Class Level</Option>
                  <Option value={PrerequisiteType.Subclass}>Subclass</Option>
                  <Option value={PrerequisiteType.Feat}>Feat</Option>
                  <Option value={PrerequisiteType.Race}>Race</Option>
                  <Option value={PrerequisiteType.Item}>Item</Option>
                  <Option value={PrerequisiteType.String}>Other / Text</Option>
                </Select>
                <Switch>
                  <Match when={selectedType() === PrerequisiteType.Stat}>
                    <div>
                      <Select transparent value={keyName()} onChange={(e) => setKeyName(e)}>
                        <Option value={"STR"}>Strength</Option>
                        <Option value={"DEX"}>Dexterity</Option>
                        <Option value={"CON"}>Constitution</Option>
                        <Option value={"INT"}>Intelligence</Option>
                        <Option value={"WIS"}>Wisdom</Option>
                        <Option value={"CHA"}>Charisma</Option>
                      </Select>
                      <FormField name="Amount">
                        <Input
                          transparent
                          type="number"
                          value={keyValue()}
                          onChange={(e) => setKeyValue(e.currentTarget.value)}
                        />
                      </FormField>
                    </div>
                  </Match>
                  <Match when={selectedType() === PrerequisiteType.Class}>
                    <div>
                      <Select transparent 
                        value={keyName()}
                        onChange={(e) => {
                          setKeyName("Class");
                          setKeyValue(e);
                        }}
                      >
                        <For each={classes()}>
                          {(classObj) => (
                            <Option value={classObj.name}>{classObj.name}</Option>
                          )}
                        </For>
                      </Select>
                      <FormField name="Level (optional)">
                        <Input
                          id="classLevelInput"
                          type="number"
                          min="1"
                          value={classLevel()}
                          placeholder="Any level"
                          onChange={(e) => setClassLevel(e.currentTarget.value)}
                          transparent
                        />
                      </FormField>
                    </div>
                  </Match>
                  <Match when={selectedType() === PrerequisiteType.Level}>
                    <div>
                      <FormField name="Level">
                        <Input
                          type="number"
                          min="1"
                          value={keyValue()}
                          onChange={(e) => setKeyValue(e.currentTarget.value)}
                        />
                      </FormField>
                    </div>
                  </Match>
                  <Match when={selectedType() === PrerequisiteType.Subclass}>
                    <div>
                      <Select
                        transparent
                        value={keyValue()}
                        onChange={(e) => setKeyValue(e)}
                      >
                        <For each={subclasses()}>{sc => (
                          <Option value={`${sc.parentClass}:${sc.name}`}>{sc.parentClass} / {sc.name}</Option>
                        )}</For>
                      </Select>
                    </div>
                  </Match>
                  <Match when={selectedType() === PrerequisiteType.Feat}>
                    <div>
                      <Select
                        transparent
                        value={keyValue()}
                        onChange={(e) => setKeyValue(e)}
                      >
                        <For each={feats()}>{f => {
                          const nm = (f as any).details?.name || (f as any).name;
                          return <Option value={nm}>{nm}</Option>;
                        }}</For>
                      </Select>
                    </div>
                  </Match>
                  <Match when={selectedType() === PrerequisiteType.Race}>
                    <div>
                      <Select
                        transparent
                        value={keyValue()}
                        onChange={(e) => setKeyValue(e)}
                      >
                        <For each={races()}>{r => (
                          <Option value={(r as any).name}>{(r as any).name}</Option>
                        )}</For>
                      </Select>
                    </div>
                  </Match>
                  <Match when={selectedType() === PrerequisiteType.Item}>
                    <div>
                      <Select
                        transparent
                        value={keyValue()}
                        onChange={(e) => setKeyValue(e)}
                      >
                        <For each={items()}>{it => (
                          <Option value={(it as any).name}>{(it as any).name}</Option>
                        )}</For>
                      </Select>
                    </div>
                  </Match>
                  <Match when={selectedType() === PrerequisiteType.String}>
                    <div>
                      <FormField name="Text">
                        <Input
                          type="text"
                          value={keyValue()}
                          onChange={(e) => setKeyValue(e.currentTarget.value)}
                          placeholder="Enter prerequisite text"
                          transparent
                        />
                      </FormField>
                    </div>
                  </Match>
                </Switch>
                <Button disabled={prerequisites().length >= 10} onClick={addPreReq}>
                  Add
                </Button>
              </div>
              <div class={`${styles.chipBar}`}>
                <For each={prerequisites()}>
                  {(pre, i) => (
                    <Chip
                      key={`${PrerequisiteType[pre.type]}`}
                      value={pre.value}
                      remove={() => setPrerequisites(old => old.filter((_, ind) => ind !== i()))}
                    />
                  )}
                </For>
              </div>
            </div>
          </FlatCard>
          <FlatCard icon="equalizer" headerName="Description" transparent>
            <div class={`${styles.Description}`}>
              <h2>Description</h2>
              <FormField name="Description">
                <TextArea
                  id="featDescription"
                  name="featDescription"
                  text={featDescription}
                  setText={setFeatDescription}
                  transparent
                />
              </FormField>
            </div>
          </FlatCard>
          <FlatCard icon="save" headerName="Saving" alwaysOpen transparent>
            <Show when={!featExists()}>
              <Button
                disabled={!isValid()}
                class={`${styles.addButton}`}
                onClick={addFeat}
              >
              Save Feat
              </Button>
            </Show>
            <Show when={featExists()}>
              <Button
                disabled={!isValid()}
                class={`${styles.addButton}`}
                onClick={updateFeat}
              >
              Update Feat
              </Button>
            </Show>
          </FlatCard>
        </div>
    </Body>
  );
};
export default Feats;
