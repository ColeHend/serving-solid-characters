import { Component, For, createSignal, createMemo, Show, onMount } from "solid-js";
import { Body, Input, Select, Option, Button, TextArea, Chip, useGetItems, Weapon, Armor } from "../../../../../shared/";
import styles from './backgrounds.module.scss';
import HomebrewManager, { homebrewManager } from "../../../../../shared/customHooks/homebrewManager";
import { createStore } from "solid-js/store";
import { Background } from "../../../../../models";
import useGetBackgrounds from "../../../../../shared/customHooks/data/useGetBackgrounds";
import FormField from "../../../../../shared/components/FormField/formField";
import FeatureModal from "../classes/sections/featureModal";
import { LevelEntity } from "../../../../../models/class.model";
import { Feature, FeatureTypes } from "../../../../../models/core.model";
import { useSearchParams } from "@solidjs/router";
import addSnackbar from "../../../../../shared/components/Snackbar/snackbar";

const Backgrounds: Component = () => {
  // eslint-disable-next-line
  const [searchParams, setSearchParams] = useSearchParams();
  const allBackgrounds = useGetBackgrounds();
  const allItemsTypes = useGetItems();
  const allOtherItems = createMemo(()=>allItemsTypes().filter((item)=>item.equipmentCategory !== "Weapon" && item.equipmentCategory !== "Armor"));
  const allWeapons = createMemo(()=>allItemsTypes().filter((item)=>item.equipmentCategory === "Weapon") as Weapon[]);
  const allArmor = createMemo(()=>allItemsTypes().filter((item)=>item.equipmentCategory === "Armor") as Armor[]);
  const [showFeatureModal, setShowFeatureModal] = createSignal(false);
  const [editIndex, setEditIndex] = createSignal(-1);
  const [featureDesc, setFeatureDesc] = createSignal("");
	
  const [selectedSkill, setSelectedSkill] = createSignal("");
	
  const [selectedTool, setSelectedTool] = createSignal("");
	
  const [selectedLanguage, setSelectedLanguage] = createSignal("");
	
  const [selectedProficiency, setSelectedProficiency] = createSignal("");
	
  const [selectedItem, setSelectedItem] = createSignal("");
  const [selectedItemAmnt, setSelectedItemAmnt] = createSignal(1);
  const [selectedItemType, setSelectedItemType] = createSignal("Item");

  const [selectedChoiceItem, setSelectedChoiceItem] = createSignal("");
  const [selectedChoices, setSelectedChoices] = createSignal<string[]>([]);
  // eslint-disable-next-line
  const [selectedChoiceItemAmnt, setSelectedChoiceItemAmnt] = createSignal(1);
  const [selectedChoicesItemType, setSelectedChoiceItemType] = createSignal("Item");


  const [currentBackground, setCurrentBackground] = createStore<Background>({
    name: "",
    desc: "",
    startingProficiencies: [],
    languageChoice: { choose: 0, type: FeatureTypes.Language, choices: [] },
    startingEquipment: [],
    startingEquipmentChoices: [],
    feature: []
  });
  const addFeature = (level: number, feature: Feature<string, string>) => {
    const newFeature: Feature<string[], string> = {
      name: feature.name,
      value: [feature.value],
      info: feature.info,
      metadata: feature.metadata
    };
    setCurrentBackground({ feature: [...currentBackground.feature, newFeature] });
  };

   
  const replaceFeature = (level: number, index: number, feature: Feature<string, string>) => {
    const newFeatures = [...currentBackground.feature];
    newFeatures[index] = {
      name: feature.name,
      value: [feature.value],
      info: feature.info,
      metadata: feature.metadata
    };
    setCurrentBackground({ feature: newFeatures });
  };

  const fillBackground = (search?:boolean) => {
    const searchName = search ? searchParams.name : currentBackground.name
    const background = homebrewManager.backgrounds().find((x)=>x.name === searchName);
    const srdBackground = allBackgrounds().find((x)=>x.name === searchName);

		 if (background) {
      setCurrentBackground(background);
		 }

		 if (srdBackground) {
      setCurrentBackground(srdBackground);
		 }

  }

  const doesExist = ()=> {
    return homebrewManager.backgrounds().findIndex(x=>x.name === currentBackground.name) > -1
  }

  onMount(()=>{
    if (searchParams.name) fillBackground(true)
  })

  return (
    <>
      <Body>
        <h1>backgrounds</h1>
        <div>
          <div class={`${styles.name}`}>
            <FormField name="Background Name">
              <Input
                min={1}
                value={currentBackground.name}
                onChange={(e) => setCurrentBackground({ name: e.currentTarget.value })} transparent />
            </FormField>
						
            <Show when={doesExist()}>
              <Button onClick={()=>fillBackground()}>Fill Info</Button>
              <Button onClick={()=>{
                const areSure = confirm("are you sure");

                if (areSure) homebrewManager.removeBackground(currentBackground.name)
              }}>Delete</Button>
            </Show>
          </div>
          <div class={`${styles.description}`}>
            <h4>Background Description</h4>
            <FormField name="Description">
              <TextArea
                transparent
                onChange={(e) => setCurrentBackground({ desc: e.currentTarget.value })}
                text={featureDesc}
                setText={setFeatureDesc} />
            </FormField>
          </div>
          <div class={`${styles.addition}`}>
            <div class={`${styles.skills}`}>
              <h4>Skill Proficiencies</h4>
              <div>
                <Select transparent
                  value={selectedSkill()}
                  onChange={(e) => {
                    setSelectedSkill(e.currentTarget.value);
                  }
                  }>
                  <For each={allSkills()}>{(skill) =>
                    <Option value={skill}>{skill}</Option>
                  }</For>
                </Select>
                <Button onClick={() => {
                  setCurrentBackground({
                    startingProficiencies: [...currentBackground.startingProficiencies,
                      {
                        info: {
                          className: '',
                          subclassName: '',
                          level: 0,
                          type: FeatureTypes.Background,
                          other: ''
                        },
                        metadata: {},
                        name: 'Skill Proficiency',
                        value: selectedSkill()
                      }
                    ]
                  })
                }}>Add Proficiency</Button>
              </div>
            </div>
            <div class={`${styles.proficiencies}`}>
              <h4>Starting Proficiencies</h4>
              <div>
                <Select transparent
                  value={selectedProficiency()}
                  onChange={(e) => {
                    setSelectedProficiency(e.currentTarget.value);
                  }
                  }>
                  <For each={allSkills()}>{(skill) =>
                    <Option value={skill}>{skill}</Option>
                  }</For>
                </Select>
                <Button onClick={() => {
                  setCurrentBackground({
                    startingProficiencies: [...currentBackground.startingProficiencies, {
                      info: {
                        className: '',
                        subclassName: '',
                        level: 0,
                        type: FeatureTypes.Background,
                        other: ''
                      },
                      name: 'Skill Proficiency',
                      value: selectedProficiency(),
                      metadata: {}
                    }]
                  });
                }}>Add Proficiency</Button>
              </div>
            </div>
            <div class={`${styles.tools}`}>
              <h4>Tool Proficiencies</h4>
              <div>
                <Select transparent
                  value={selectedTool()}
                  onChange={(e) => {
                    setSelectedTool(e.currentTarget.value);
                  }
                  }>
                  <For each={allTools()}>{(tool) =>
                    <Option value={tool}>{tool}</Option>
                  }</For>
                </Select>
                <Button onClick={() => {
                  setCurrentBackground({
                    startingProficiencies: [...currentBackground.startingProficiencies, {
                      info: {
                        className: '',
                        subclassName: '',
                        level: 0,
                        type: FeatureTypes.Background,
                        other: ''
                      },
                      name: 'Tool Proficiency',
                      value: selectedTool(),
                      metadata: {}
                    }]
                  });
                }}>Add Proficiency</Button>
              </div>
            </div>
            <div class={`${styles.languages}`}>
              <div>
                <h4>Languages</h4>
              </div>
              <div>
                <Select transparent
                  value={selectedLanguage()}
                  onChange={(e) => {
                    setSelectedLanguage(e.currentTarget.value);
                  }
                  }>
                  <For each={getLanguages()}>{(lang) =>
                    <Option value={lang}>{lang}</Option>
                  }</For>
                  <Option value="Custom">Custom</Option>
                </Select>
                <Button onClick={() => {
                  setCurrentBackground({
                    languageChoice: {
                      ...currentBackground.languageChoice,
                      choices: [...currentBackground.languageChoice.choices, selectedLanguage()]
                    }
                  });
                }}>Add Language</Button>
              </div>
            </div>
            <div class={`${styles.startEquip}`}>
              <h4>Starting Equipment</h4>
              <div>
                <span>
                  <Select transparent disableUnselected
                    value={selectedItemType()}
                    onChange={(e) => {
                      setSelectedItemType(e.currentTarget.value);
                    }
                    }>
                    <Option value="Item">Item</Option>
                    <Option value="Weapon">Weapon</Option>
                    <Option value="Armor">Armor</Option>
                  </Select>
                </span>
                <span>
                  <Show when={selectedItemType() === "Item"}>
                    <Select transparent
                      value={selectedItem()}
                      onChange={(e) => {
                        setSelectedItem(e.currentTarget.value);
                      }
                      }>
                      <For each={allOtherItems()}>{(item) =>
                        <Option value={item.item}>{item.name}</Option>
                      }</For>
                    </Select>
                  </Show>
                  <Show when={selectedItemType() === "Weapon"}>
                    <Select transparent
                      value={selectedItem()}
                      onChange={(e) => {
                        setSelectedItem(e.currentTarget.value);
                      }
                      }>
                      <For each={allWeapons()}>{(item) =>
                        <Option value={item.item}>{item.name}</Option>
                      }</For>
                    </Select>
                  </Show>
                  <Show when={selectedItemType() === "Armor"}>
                    <Select transparent
                      value={selectedItem()}
                      onChange={(e) => {
                        setSelectedItem(e.currentTarget.value);
                      }
                      }>
                      <For each={allArmor()}>{(item) =>
                        <Option value={item.item}>{item.name}</Option>
                      }</For>
                    </Select>
                  </Show>
                </span>
                <div>
									Amount: 
                  <Input type="number" transparent
                    style={{ width: "75px" }}
                    value={selectedItemAmnt()}
                    onChange={(e) => { 
                      setSelectedItemAmnt(parseInt(e.currentTarget.value));
                    }} />
                  <Button onClick={() => {
                    const item = allItemsTypes().find((i) => i.item === selectedItem());
                    if (!item) return;
                    setCurrentBackground((old)=>({
                      startingEquipment: [...old.startingEquipment, item]
                    }));
                  }}>Add Equipment</Button>
                </div>
              </div>
            </div>
            <div class={`${styles.startEquipChoices}`}>
              <h4>Starting Equipment Choices</h4>
              <div>
                <span>
                  <Select transparent disableUnselected
                    value={selectedChoicesItemType()}
                    onChange={(e) => {
                      setSelectedChoiceItemType(e.currentTarget.value);
                    }
                    }>
                    <Option value="Item">Item</Option>
                    <Option value="Weapon">Weapon</Option>
                    <Option value="Armor">Armor</Option>
                  </Select>
                </span>
                <span>
                  <Show when={selectedChoicesItemType() === "Item"}>
                    <Select transparent
                      value={selectedChoiceItem()}
                      onChange={(e) => {
                        setSelectedChoiceItem(e.currentTarget.value);
                      }
                      }>
                      <For each={allOtherItems()}>{(item) =>
                        <Option value={item.name}>{item.name}</Option>
                      }</For>
                    </Select>
                    <Button onClick={()=>{
                      const item = allOtherItems().find((i) => i.name === selectedChoiceItem());
                      if (!item) return;
                      setSelectedChoices(old=>[...old, item.name]);
                    }} >Add To Choice</Button>
                  </Show>
                  <Show when={selectedChoicesItemType() === "Weapon"}>
                    <Select transparent
                      value={selectedChoiceItem()}
                      onChange={(e) => {
                        setSelectedChoiceItem(e.currentTarget.value);
                      }
                      }>
                      <For each={allWeapons()}>{(item) =>
                        <Option value={item.name}>{item.name}</Option>
                      }</For>
                    </Select>
                    <Button onClick={()=>{
                      const item = allWeapons().find((i) => i.name === selectedChoiceItem());
                      if (!item) return;
                      setSelectedChoices(old=>[...old, item.name]);
                    }} >Add To Choice</Button>
                  </Show>
                  <Show when={selectedChoicesItemType() === "Armor"}>
                    <Select transparent
                      value={selectedChoiceItem()}
                      onChange={(e) => {
                        setSelectedChoiceItem(e.currentTarget.value);
                      }
                      }>
                      <For each={allArmor()}>{(item) =>
                        <Option value={item.name}>{item.name}</Option>
                      }</For>
                    </Select>
                    <Button onClick={()=>{
                      const item = allArmor().find((i) => i.name === selectedChoiceItem());
                      if (!item) return;
                      setSelectedChoices(old=>[...old, item.name]);
                    }} >Add To Choice</Button>
                  </Show>
                </span>
                <Show when={selectedChoices().length > 0}>
                  <div>
                    {selectedChoices().join(', ')}
                  </div>
                </Show>
                <div>
                  <Button disabled={selectedChoices().length === 0} onClick={() => {
                    setCurrentBackground((old)=>({
                      startingEquipmentChoices: [...old.startingEquipmentChoices, {
                        choose: selectedChoiceItemAmnt(),
                        type: FeatureTypes.Background,
                        choices: selectedChoices().map((c)=>allItemsTypes().find((i)=>i.name === c || i.item === c) ?? undefined).filter((i)=>!!i)
                      }]
                    }));
                    setSelectedChoices([]);
                  }
                  }>Add Equipment Choice</Button>
                </div> 
              </div>
            </div>

          </div>
          <div class={`${styles.visual}`}>
            <div class={`${styles.angle}`}>
              <h5>Proficiencies</h5>
              <div style={{display: 'flex', 'flex-wrap':'wrap'}}>
                <For each={currentBackground.startingProficiencies}>{(prof) => <>
                  <Chip value={prof.value} remove={() => {
                    setCurrentBackground({ startingProficiencies: currentBackground.startingProficiencies.filter((p) => p !== prof) });
                  }} />
                </>}</For>
                <Show when={currentBackground.startingProficiencies.length === 0}>
                  <Chip value="None" />
                </Show>
              </div>
            </div>
            <div class={`${styles.angle}`}>
              <h5>Languages</h5>
              <div>
                <span>Choose:</span>
                <Input type="number" transparent
                  style={{ width: "min-content" }}
                  value={currentBackground.languageChoice.choose}
                  onChange={(e) => setCurrentBackground({
                    languageChoice: {
                      ...currentBackground.languageChoice,
                      choose: parseInt(e.currentTarget.value)
                    }
                  })} />
              </div>
              <div style={{display: 'flex', 'flex-wrap':'wrap'}}>
                <For each={currentBackground.languageChoice.choices}>{(lang) => <>
                  <Chip value={lang} remove={() => {
                    setCurrentBackground({
                      languageChoice: {
                        ...currentBackground.languageChoice,
                        choices: currentBackground.languageChoice.choices.filter((l) => l !== lang)
                      }
                    });
                  }} />
                </>}</For>
                <Show when={currentBackground.languageChoice.choices.length === 0}>
                  <Chip value="None" />
                </Show>
              </div>
            </div>
            <div class={`${styles.angle}`}>
              <h5>Starting Equipment</h5>
              <div>
                <For each={currentBackground.startingEquipment}>{(equip) => <>
                  <Chip value={equip.item} remove={() => {
                    setCurrentBackground({ startingEquipment: currentBackground.startingEquipment.filter((e) => e !== equip) });
                  }} />
                </>}</For>
                <Show when={currentBackground.startingEquipment.length === 0}>
                  <Chip value="None" />
                </Show>
              </div>
            </div>
            <div class={`${styles.angle}`}>
              <h5>Starting Equipment Choices</h5>
              <div>
                <For each={currentBackground.startingEquipmentChoices}>{(choice) => <>
                  <Chip key={`Choose ${choice.choose}`} value={choice.choices.map((c) => c?.item ?? c?.name).join(', ')} remove={() => {
                    setCurrentBackground({
                      startingEquipmentChoices: currentBackground.startingEquipmentChoices.filter((c) => c !== choice)
                    });
                  }} />
                </>}</For>
                <Show when={currentBackground.startingEquipmentChoices.length === 0}>
                  <Chip value="None" />
                </Show>
              </div>
            </div>
          </div>
          <div class={`${styles.features}`}>
            <h4>Features</h4>
            <Button onClick={() => {
              setShowFeatureModal(true);
              setEditIndex(-1);
            }}>Add Feature</Button>
            <Show when={showFeatureModal()}>
              <FeatureModal
                addFeature={addFeature}
                replaceFeature={replaceFeature}
                currentLevel={{} as LevelEntity}
                showFeature={showFeatureModal}
                setShowFeature={setShowFeatureModal}
                editIndex={editIndex}
                setEditIndex={setEditIndex}
                currentBackground={currentBackground}
              />
            </Show>
            <For each={currentBackground.feature}>{(f, index) =>
              <Button onClick={() => {
                setShowFeatureModal(true);
                setEditIndex(index);
              }}>{f.name}</Button>
            }</For>
          </div>
          <div>
            <Show when={!!doesExist()}>
              <Button onClick={()=>{
                const result = HomebrewManager.updateBackground(currentBackground);
                if (result) {
                  addSnackbar({
                    message: `Updated Background: ${currentBackground.name}`,
                    severity: "success"
                  });
                } else {
                  addSnackbar({
                    message: `Failed to update Background: ${currentBackground.name}`,
                    severity: "error"
                  });
                }
              }} >Edit</Button>
            </Show>
            <Show when={!doesExist()}>
              <Button onClick={()=>{
                HomebrewManager.addBackground(currentBackground);
              }}>Save</Button>
            </Show>
          </div>
        </div>
      </Body>
    </>
  );
}
export default Backgrounds;

const getLanguages = () => {
  return [
    'Abyssal',
    'Aquan',
    'Auran',
    'Celestial',
    'Draconic',
    'Dwarvish',
    'Elvish',
    'Giant',
    'Gnomish',
    'Goblin',
    'Halfling',
    'Infernal',
    'Orc',
    'Sylvan',
    'Undercommon'
  ]
}

const allSkills = () => [
  'Acrobatics',
  'Animal Handling',
  'Arcana',
  'Athletics',
  'Deception',
  'History',
  'Insight',
  'Intimidation',
  'Investigation',
  'Medicine',
  'Nature',
  'Perception',
  'Performance',
  'Persuasion',
  'Religion',
  'Sleight of Hand',
  'Stealth',
  'Survival'
];
const allTools = () => [
  'Artisan\'s Tools',
  "Smith's Tools",
  "Brewer's Supplies",
  "Calligrapher's Supplies",
  "Carpenter's Tools",
  "Cobbler's Tools",
  "Cook's Utensils",
  "Glassblower's Tools",
  "Jeweler's Tools",
  "Leatherworker's Tools",
  "Mason's Tools",
  "Painter's Supplies",
  "Potter's Tools",
  "Tinker's Tools",
  "Weaver's Tools",
  "Woodcarver's Tools",
  'Disguise Kit',
  'Forgery Kit',
  'Gaming Set',
  'Herbalism Kit',
  'Musical Instrument',
  'Navigator\'s Tools',
  'Poisoner\'s Kit',
  'Thieves\' Tools',
  'Vehicles (Land)',
  'Vehicles (Water)',
];