import { Component, For, Match, Switch, createSignal, untrack, useContext, createMemo } from "solid-js";
import styles from "./feats.module.scss";
import type { Tab } from "../../../../navbar/navbar";
import HomebrewSidebar from "../../sidebar";
import { useGetClasses, useGetFeats, ExpansionPanel, Input, Select, Option, Chip, homebrewManager, useStyle, getUserSettings, Body, Button, TextArea } from "../../../../../shared/";
import { Feature } from "../../../../../models/core.model";
import { effect } from "solid-js/web";
import { Feat } from "../../../../../models/feat.model";
import { BehaviorSubject } from "rxjs";
import { SharedHookContext } from "../../../../rootApp";
import FormField from "../../../../../shared/components/FormField/formField";

export enum PreReqType {
  AbilityScore,
  Class,
  CharacterLevel,
}

const Feats: Component = () => {
  const sharedHooks = useContext(SharedHookContext);
  const [userSettings, setUserSettings] = getUserSettings();
  const stylin = createMemo(()=>useStyle(userSettings().theme));
  const classes = useGetClasses();
  const feats = useGetFeats();
  const currentFeat$ = new BehaviorSubject<Feat>({} as Feat);
  const [preReqs, setPreReqs] = createSignal<Feature<string, string>[]>([]);
  const [selectedType, setSelectedType] = createSignal<number>(0);
  const [featName, setFeatName] = createSignal<string>("");
  const [keyName, setKeyName] = createSignal<string>("str");
  const [keyValue, setKeyValue] = createSignal<string>("0");
  const [featDescription, setFeatDescription] = createSignal<string>("");
  const [shouldAdd, setShouldAdd] = createSignal<boolean>(false);
  const clearFields = () => {
    setPreReqs([]);
    setSelectedType(PreReqType.AbilityScore);
    setFeatName("");
    setKeyName("str");
    setKeyValue("0");
    setFeatDescription("");
  };
  const addPreReq = (e: Event) => {
    switch (selectedType()) {
      case 0: // Ability Score
        setPreReqs((old) => [
          ...old,
          {
            info: {
              className: "",
              subclassName: "",
              level: 0,
              type: PreReqType[0],
              other: "",
            },
            name: keyName(),
            value: keyValue(),
          },
        ]);
        break;
      case 1: // Class
        setPreReqs((old) => [
          ...old,
          {
            info: {
              className: "",
              subclassName: "",
              level: 0,
              type: PreReqType[1],
              other: "",
            },
            name: keyName(),
            value: keyValue(),
          },
        ]);
        break;
      case 2: // Class Level
        setPreReqs((old) => [
          ...old,
          {
            info: {
              className: "",
              subclassName: "",
              level: 0,
              type: PreReqType[2],
              other: "",
            },
            name: keyName(),
            value: keyValue(),
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
  effect(() => {
    const newFeat: Feat = {} as Feat;
    newFeat.name = featName();
    newFeat.preReqs = preReqs();
    newFeat.desc = [featDescription()];
    currentFeat$.next(newFeat);
  });
  effect(() => {
    if (shouldAdd()) {
      homebrewManager.addFeat(currentFeat$.value);
      setShouldAdd(false);
      clearFields();
    }
  });
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
                <Option value={PreReqType.AbilityScore}>Ability Score</Option>
                <Option value={PreReqType.Class}>Class</Option>
                <Option value={PreReqType.CharacterLevel}>Class Level</Option>
              </Select>
              <Switch>
                <Match when={selectedType() === PreReqType["AbilityScore"]}>
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
                <Match when={selectedType() === PreReqType["Class"]}>
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
                <Match when={selectedType() === PreReqType["CharacterLevel"]}>
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
          <Button
            class={`${styles.addButton}`}
            onClick={() => setShouldAdd(true)}
          >
            Add Feat
          </Button>
        </div>
      </Body>
    </>
  );
};
export default Feats;
