import { Component, For, Match, Switch, createSignal, createMemo, Show, onMount } from "solid-js";
import styles from "./feats.module.scss";
import { useGetClasses, useGetFeats, Input, Select, Option, Chip, homebrewManager, Body, Button, TextArea } from "../../../../../shared/";
import { Feature, FeatureTypes } from "../../../../../models/core.model";
import { effect } from "solid-js/web";
import { Feat } from "../../../../../models/feat.model";
import FormField from "../../../../../shared/components/FormField/formField";
import HomebrewManager from "../../../../../shared/customHooks/homebrewManager";
import { useSearchParams } from "@solidjs/router";


const Feats: Component = () => {
  const classes = useGetClasses();
  const feats = useGetFeats();
  const [preReqs, setPreReqs] = createSignal<Feature<string, string>[]>([]);
  const [selectedType, setSelectedType] = createSignal<number>(0);
  const [featName, setFeatName] = createSignal<string>("");
  const [keyName, setKeyName] = createSignal<string>("str");
  const [keyValue, setKeyValue] = createSignal<string>("0");
  const [featDescription, setFeatDescription] = createSignal<string>("");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [searchParams, setSearchParams] = useSearchParams();
  const clearFields = () => {
    setPreReqs([]);
    setSelectedType(FeatureTypes.AbilityScore);
    setFeatName("");
    setKeyName("str");
    setKeyValue("0");
    setFeatDescription("");
  };
  const addPreReq = (e: Event) => {
    switch (selectedType()) {
    case 7: // Ability Score
      setPreReqs((old) => [
        ...old,
        {
          info: {
            className: "",
            subclassName: "",
            level: 0,
            type: FeatureTypes.AbilityScore,
            other: "",
          },
          name: keyName(),
          value: keyValue(),
          metadata: {}
        },
      ]);
      break;
    case 0: // Class
      setPreReqs((old) => [
        ...old,
        {
          info: {
            className: "",
            subclassName: "",
            level: 0,
            type: FeatureTypes.Class,
            other: "",
          },
          name: keyName(),
          value: keyValue(),
          metadata: {}
        },
      ]);
      break;
    case 8: // Class Level
      setPreReqs((old) => [
        ...old,
        {
          info: {
            className: "",
            subclassName: "",
            level: 0,
            type: FeatureTypes.CharacterLevel,
            other: "",
          },
          name: keyName(),
          value: keyValue(),
          metadata: {}
        },
      ]);
      break;
    default:
      break;
    }
  };

  effect(() => {
    switch (selectedType()) {
    case 0: // Ability Score
      setKeyName("STR");
      setKeyValue("0");
      break;
    case 1: // Class
      setKeyName("Class");
      setKeyValue("Barbarian");
      break;
    case 2: // Class Level
      setKeyName("Barbarian");
      setKeyValue("0");
      break;
    default:
      break;
    }
  });

  const currentFeat = createMemo(()=>{
    const newFeat: Feat = {} as Feat;
    newFeat.name = featName();
    newFeat.preReqs = preReqs();
    newFeat.desc = [featDescription()];
    return newFeat;
  });
  onMount(()=>{
    if (searchParams.name) {
      const feat = HomebrewManager.feats().find((x) => x.name === searchParams.name);
      if (feat) {
        setPreReqs(feat.preReqs);
        setFeatDescription(feat.desc[0]);
        setFeatName(feat.name);
      }
    }
  })
  const featExists = createMemo(()=>{
    return HomebrewManager.feats().findIndex((x) => x.name === featName()) !== -1;
  });
  const addFeat = () => {
    homebrewManager.addFeat(currentFeat());
    clearFields();
  };
  const updateFeat = () => {
    homebrewManager.updateFeat(currentFeat());
    clearFields();
  }
  return (
    <>
      <Body>
        <h1>Feats</h1>
        <div class="featHomebrew">
          <div class={`${styles.name}`}>
            <h2>Add Name</h2>
            <FormField name="Add Name">
              <Input
                type="text"
                transparent
                id="featName"
                value={featName()}
                onChange={(e) => setFeatName(e.currentTarget.value)}
              />
            </FormField>
            <Show when={featExists()}>
              <Button onClick={()=>{
                const feat = HomebrewManager.feats().find((x) => x.name === featName());
                const srdFeat = feats().find((x) => x.name === featName());
                if (feat) {
                  setPreReqs(feat.preReqs);
                  setFeatDescription(feat.desc[0]);
                }
                if (srdFeat) {
                  setPreReqs(srdFeat.preReqs);
                  setFeatDescription(srdFeat.desc[0]);
                }
              }}>Fill</Button>
            </Show>
          </div>
          <div class={`${styles.preRequisites}`}>
            <h2>Add Pre-Requisites</h2>
            <div>
              <Select
                value={selectedType()}
                onChange={(e) => setSelectedType(() => +e.currentTarget.value)}
                disableUnselected={true}
                transparent
              >
                <Option value={FeatureTypes.AbilityScore}>Ability Score</Option>
                <Option value={FeatureTypes.Class}>Class</Option>
                <Option value={FeatureTypes.CharacterLevel}>Class Level</Option>
              </Select>
              <Switch>
                <Match when={selectedType() === FeatureTypes["AbilityScore"]}>
                  <div>
                    <Select transparent disableUnselected={true} onChange={(e) => setKeyName(e.currentTarget.value)}>
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
                <Match when={selectedType() === FeatureTypes["Class"]}>
                  <div>
                    <Select transparent 
                      value={keyName()}
                      onChange={(e) => {
                        setKeyName("Class");
                        setKeyValue(e.currentTarget.value);
                      }}
                    >
                      <For each={classes()}>
                        {(classObj) => (
                          <Option value={classObj.name}>{classObj.name}</Option>
                        )}
                      </For>
                    </Select>
                  </div>
                </Match>
                <Match when={selectedType() === FeatureTypes["CharacterLevel"]}>
                  <div>
                    <Select transparent
                      value={keyName()} 
                      onChange={(e) => setKeyName(e.currentTarget.value)}>
                      <For each={classes()}>
                        {(classObj) => (
                          <Option value={classObj.name}>{classObj.name}</Option>
                        )}
                      </For>
                    </Select>
                    <Input
                      type="number"
                      value={keyValue()}
                      onChange={(e) => setKeyValue(e.currentTarget.value)}
                    />
                  </div>
                </Match>
              </Switch>
              <Button disabled={preReqs().length >= 10} onClick={addPreReq}>
                Add
              </Button>
            </div>
            <div class={`${styles.chipBar}`}>
              <Chip key={keyName()} value={keyValue()} />
              <For each={preReqs()}>
                {(preReq, i) => (
                  <Chip
                    key={preReq.name}
                    value={preReq.value}
                    remove={() =>
                      setPreReqs((old) => old.filter((x, ind) => ind !== i()))
                    }
                  />
                )}
              </For>
            </div>
          </div>
          <div class={`${styles.Description}`}>
            <h2>Description</h2>
            <FormField name="Description">
              <TextArea
                id="featDescription"
                name="featDescription"
                text={featDescription}
                setText={setFeatDescription}
                picToTextEnabled={true}
                transparent
              />
            </FormField>
          </div>
          <Show when={!featExists()}>
            <Button
              class={`${styles.addButton}`}
              onClick={addFeat}
            >
							Add Feat
            </Button>
          </Show>
          <Show when={featExists()}>
            <Button
              class={`${styles.addButton}`}
              onClick={updateFeat}
            >
							Update Feat
            </Button>
          </Show>
        </div>
      </Body>
    </>
  );
};
export default Feats;
