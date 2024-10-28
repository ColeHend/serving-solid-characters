import {
  Component,
  For,
  createSignal,
  useContext,
  createMemo,
  createEffect,
  Show,
  onMount,
} from "solid-js";
import {
  useStyle,
  Carousel,
  getUserSettings,
  Body,
  Item,
  Weapon,
  Armor,
  FormField,
  Input,
  Select,
  Option,
  Chip,
  Button,
  UniqueStringArray,
  Clone,
  homebrewManager,
} from "../../../../../shared/";
import styles from "./items.module.scss";
import type { Tab } from "../../../../navbar/navbar";
import HomebrewSidebar from "../../sidebar";
import { SharedHookContext } from "../../../../rootApp";
import { useSearchParams } from "@solidjs/router";
import { ItemType } from "../../../../../shared/customHooks/utility/itemType";
import { createStore } from "solid-js/store";
import addSnackbar from "../../../../../shared/components/Snackbar/snackbar";
import { Feature } from "../../../../../models/core.model";
import FeatureModal from "../classes/sections/featureModal";
import { LevelEntity } from "../../../../../models/class.model";
import HomebrewManager from "../../homebrewManager";
import {useGetItems} from "../../../../../shared/";
import useGetSpells from "../../../../../shared/customHooks/data/useGetSpells";
import { c } from "@vite-pwa/assets-generator/shared/assets-generator.5e51fd40";

const Items: Component = () => {
  // state part 1
  const sharedHooks = useContext(SharedHookContext);
  const [userSettings, setUserSettings] = getUserSettings();
  const stylin = createMemo(() => useStyle(userSettings().theme));
  const [searchParams, setSearchParams] = useSearchParams();
  const allItems = useGetItems()

  // shared info on the items
  const [itemName, setItemName] = createSignal<string>("");
  const [itemType, setItemType] = createSignal<string>("Item");
  const [itemCost, setItemCost] = createSignal<number>(0);
  const [costUnit, setCostUnit] = createSignal<string>("PP");
  const [otherUnit, setOtherUnit] = createSignal<string>("");
  const [itemTag, setItemTag] = createSignal<string>("Versatile");
  const [otherTag, setOtherTag] = createSignal<string>("");
  
  // feature modal
  const [showFeatureModal,setShowFeatureModal] = createSignal<boolean>(false);
  const [editIndex,setEditIndex] = createSignal<number>(-1);

  // weapon
  const [dmgDice,setDmgDice] = createSignal<string>("");
  const [dmgType,setDmgType] = createSignal<string>("");
  const [dmgBonus,setDmgBonus] = createSignal<number>(0);
  const [diceNumber,setDiceNumber] = createSignal<number>(0);

  // armor
  const [armorCategory,setArmorCategory] = createSignal<string>("")
  const [otherCategory,setOtherCategory] = createSignal<string>("");

  // search paramaters 
  if (!!!searchParams.Name) setSearchParams({ Name: itemName() });

  // stores & base info 

  const builtInTags = () => [
    "Versatile",
    "Ammunition",
    "Loading",
    "Light",
    "Two-Handed",
    "Finesse",
    "Thrown",
    "Monk",
    "Heavy",
    "Reach",
    "Special",
    "Consumable",
    "Other",
  ];

  const damageTypes = () => {
    const allSpells = useGetSpells()

    const dmgTypes:string[] = []

    const weapons = allItems().filter(x=>x.equipmentCategory === ItemType[1]) as Weapon[]

    weapons.forEach(y=>y.damage.forEach(z=>dmgTypes.push(z.damageType)));

    allSpells().forEach(s=>dmgTypes.push(s.damageType));
    
    return UniqueStringArray(dmgTypes)
  }

  const [currentItem, setCurrentItem] = createStore<Item>({
    name: "",
    equipmentCategory: "",
    cost: {
      quantity: 0,
      unit: "",
    },
    weight: 0,
    tags: [],
    desc: [],
    item: "",
    features: [],
  });

  const [currentWeapon, setCurrentWeapon] = createStore<Weapon>({
    name: "",
    equipmentCategory: "",
    cost: {
      quantity: 0,
      unit: "",
    },
    weight: 0,
    tags: [], 
    desc: [], 
    item: "", // depricated
    features: [],
    weaponCategory: "",
    weaponRange: "",
    categoryRange: "",
    damage: [],
    range: { 
      normal: 0,
      long: 0,
    },
  });

  const [currentArmor, setCurrentArmor] = createStore<Armor>({
    name: "",
    equipmentCategory: "",
    cost: {
      quantity: 0,
      unit: "",
    },
    weight: 0,
    tags: [],
    desc: [],
    item: "",
    features: [],
    armorCategory: "",
    armorClass: {
      base: 0,
      dexBonus: false,
      maxBonus: 0,
    },
    strMin: 0,
    stealthDisadvantage: false,
  });

  const getItemObj = createMemo(() => {
    switch (itemType()) {
      case "Item":
        return currentItem;
      case "Weapon":
        return currentWeapon;
      case "Armor":
        return currentArmor;
      default:
        return currentItem;
    }
  });

  // functions

  const saveToObject = () => {
    switch (itemType()) {
      case "Weapon":
        setCurrentWeapon("name", itemName());
        setCurrentWeapon("equipmentCategory", itemType());
        setCurrentWeapon("cost", {
          quantity: itemCost(),
          unit: costUnit() !== "other" ? costUnit() : otherUnit(),
        });
        setCurrentWeapon("categoryRange",`${currentWeapon.weaponCategory}${currentWeapon.weaponRange}`)

        break;

      case "Armor":
        setCurrentArmor("name", itemName());
        setCurrentArmor("equipmentCategory", itemType());
        setCurrentArmor("cost", {
          quantity: itemCost(),
          unit: costUnit() !== "other" ? costUnit() : otherUnit(),
        });
        
        if (armorCategory() === "Other") {
          setCurrentArmor("armorCategory",otherCategory());
        } else {
          setCurrentArmor("armorCategory",armorCategory());
        }
        break;

      case "Item":
        setCurrentItem("name", itemName());
        setCurrentItem("equipmentCategory", itemType());
        setCurrentItem("cost", {
          quantity: itemCost(),
          unit: costUnit() !== "other" ? costUnit() : otherUnit(),
        });

        break;
    }
  };

  const clearInputs = (isSaving?: boolean) => {
    setCurrentArmor({
      name: "",
      equipmentCategory: "",
      cost: {
        quantity: 0,
        unit: "",
      },
      weight: 0,
      tags: [],
      desc: [],
      item: "",
      features: [],
      armorCategory: "",
      armorClass: {
        base: 0,
        dexBonus: false,
        maxBonus: 0,
      },
      strMin: 0,
      stealthDisadvantage: false,
    });
    setCurrentItem({
      name: "",
      equipmentCategory: "",
      cost: {
        quantity: 0,
        unit: "",
      },
      weight: 0,
      tags: [],
      desc: [],
      item: "",
      features: [],
    });
    setCurrentWeapon({
      name: "",
      equipmentCategory: "",
      cost: {
        quantity: 0,
        unit: "",
      },
      weight: 0,
      tags: [],
      desc: [],
      item: "",
      features: [],
      weaponCategory: "",
      weaponRange: "",
      categoryRange: "",
      damage: [],
      range: {
        normal: 0,
        long: 0,
      },
    });
    setItemName("");
    setItemCost(0);
    setCostUnit("PP");
    setOtherUnit("");
    setItemTag("Versatile");
    setOtherTag("");
    setDmgDice("");
    setDmgType("");
    setDmgBonus(0);
    setDiceNumber(0);
    if (isSaving) setItemType("Item");
  };

  const addFeature = (level: number, feature: Feature<string, string>) => {
    const newFeature: Feature<string, string> = {
      name: feature.name,
      value: feature.value,
      info: {
        className: feature.info.className,
        subclassName: feature.info.subclassName,
        level: feature.info.level,
        type: feature.info.type,
        other: feature.info.other
      },
      metadata: feature.metadata
    }
    const newFeatures = Clone(getItemObj().features)
    newFeatures?.push(newFeature);

    switch(itemType()){
      case "Item":
        setCurrentItem("features",newFeatures);
        break;
      case "Armor":
        setCurrentArmor("features",newFeatures);
        break;
      case "Weapon":
        setCurrentWeapon("features",newFeatures);
        break
    }

    setShowFeatureModal(false);
  }

  const replaceFeature = (level: number,index: number,feature: Feature<string, string>) => {
    const newFeature: Feature<string, string> = {
      name: feature.name,
      value: feature.value,
      info: {
        className: feature.info.className,
        subclassName: feature.info.subclassName,
        level: feature.info.level,
        type: feature.info.type,
        other: feature.info.other
      },
      metadata: feature.metadata
    }
    const newFeatures = Clone(getItemObj().features)
    if (newFeatures) newFeatures[index] = newFeature;

    switch(itemType()){
      case "Item":
        setCurrentItem("features",newFeatures);
        break;
      case "Armor":
        setCurrentArmor("features",newFeatures);
        break;
      case "Weapon":
        setCurrentWeapon("features",newFeatures);
        break
    }

    setShowFeatureModal(false);
  }

  const doesExist = () => {
    const homebrewItems = homebrewManager.items().filter(x=>x.equipmentCategory === ItemType[0])
    const homewbrewWeapons = homebrewManager.items().filter(x=>x.equipmentCategory === ItemType[1]) as Weapon[];
    const homebrewArmor = homebrewManager.items().filter(x=>x.equipmentCategory === ItemType[2]) as Armor[];

    switch (itemType()) {
      case "Armor":
        return homebrewArmor.findIndex((x)=>x.name === currentArmor.name) > -1;

      case "Weapon":
        return homewbrewWeapons.findIndex((x)=>x.name === currentWeapon.name) > -1;

      case "Item":
        return homebrewItems.findIndex((x)=>x.name === currentItem.name) > -1;
    }
  }

  const saveItem = () => {
    saveToObject()
    switch (itemType()) {
      case "Weapon":
        homebrewManager.addItem(currentWeapon)
        clearInputs(true);
        break;

      case "Armor":
        homebrewManager.addItem(currentArmor)
        clearInputs(true);
        break;

      case "Item":
        homebrewManager.addItem(currentItem);
        clearInputs(true);
        break;
    }
  }

  const editItem = () => {
    saveToObject()
    switch (itemType()) {
      case "Weapon":
        homebrewManager.updateItem(currentWeapon);
        clearInputs();
        break;

      case "Armor":
        homebrewManager.updateItem(currentArmor);
        clearInputs();
        break;

      case "Item":
        homebrewManager.updateItem(currentItem);
        clearInputs();
        break;
    }

  }

  const fillInfo = (search?:boolean) => {
    const searchName = !!search ? searchParams.name : getItemObj().name;
    const item = homebrewManager.items().find(x=>x.name === searchName);
    const allItem = allItems().find(x=>x.name === searchName);

    if (!!item) {
      switch (item.equipmentCategory) {
        case "Item":
          setItemType(item.equipmentCategory);
          setItemName(item.name);
          setItemCost(item.cost.quantity);
          setCostUnit(item.cost.unit);
          setCurrentItem(item);
          break;
        
        case "Armor":
          setItemType(item.equipmentCategory);
          setItemName(item.name);
          setItemCost(item.cost.quantity);
          setCostUnit(item.cost.unit);
          setCurrentArmor(item);
          break;

        case "Weapon":
          setItemType(item.equipmentCategory);
          setItemName(item.name);
          setItemCost(item.cost.quantity);
          setCostUnit(item.cost.unit);
          setCurrentWeapon(item);
          break;
      }
    }

    if (!!allItem) {
      switch (allItem.equipmentCategory) {
        case "Item":
          setItemType(allItem.equipmentCategory);
          setItemName(allItem.name);
          setItemCost(allItem.cost.quantity);
          setCostUnit(allItem.cost.unit);
          setCurrentItem(allItem);
          break;
        
        case "Armor":
          setItemType(allItem.equipmentCategory);
          setItemName(allItem.name);
          setItemCost(allItem.cost.quantity);
          setCostUnit(allItem.cost.unit);
          setCurrentArmor(allItem);
          break;

        case "Weapon":
          setItemType(allItem.equipmentCategory);
          setItemName(allItem.name);
          setItemCost(allItem.cost.quantity);
          setCostUnit(allItem.cost.unit);
          setCurrentWeapon(allItem);
          break;
      }
    }

  }

  // ▼ when things change ▼
  createEffect(() => {
    setSearchParams({ itemType: itemType(), name: itemName() });
    saveToObject();
  });

  onMount(()=>{
    if (!!searchParams.name && !!searchParams.itemType) fillInfo(true)
  })

  return (
    <>
      <Body>
        <h1>Items</h1>

        <h2>Item Type</h2>
        <div>
          <Select
            transparent
            value={getItemObj().equipmentCategory}
            onChange={(e) => {
              setItemType(e.currentTarget.value);
              clearInputs();
              saveToObject();
              addSnackbar({
                message: "Cleared Inputs",
                severity: "info",
                closeTimeout: 3000,
              });
            }}
            disableUnselected
          >
            <For each={["Item", "Weapon", "Armor"]}>
              {(typeOption) => <Option value={typeOption}>{typeOption}</Option>}
            </For>
          </Select>

          <p>
            Please choose the item type first. It clears the inputs every time
            it changes
          </p>
        </div>

        <h2>Cost</h2>
        <div>
          <FormField class={`${styles.cost}`} name="cost">
            <Input
              type="number"
              transparent
              value={getItemObj().cost.quantity}
              onInput={(e) => setItemCost(parseInt(e.currentTarget.value))}
            />
            <Select
              transparent
              value={getItemObj().cost.unit}
              onChange={(e) => setCostUnit(e.currentTarget.value)}
              disableUnselected
            >
              <For each={["PP", "GP", "SP", "CP", "other"]}>
                {(unitOption) => <Option value={unitOption}>{unitOption}</Option>}
              </For>
            </Select>
          </FormField>
        </div>

        <Show when={costUnit() === "other"}>
          <FormField name="other unit">
            <Input
              type="text"
              transparent
              value={otherUnit()}
              onInput={(e) => setOtherUnit(e.currentTarget.value)}
            />
          </FormField>
        </Show>

        <h2>Name</h2>
        <FormField name="Item name">
          <Input
            type="text"
            transparent
            value={getItemObj().name}
            onInput={(e) => setItemName(e.currentTarget.value)}
          />
        </FormField>

        <div>
          <Show when={itemType() === "Weapon"}>
            <div>
              <h2>Weapon Category</h2>
              <Select
                transparent
                value={currentWeapon.weaponCategory}
                onChange={(e)=>setCurrentWeapon("weaponCategory",e.currentTarget.value)}
                disableUnselected
              >
                <For each={["Martial","Simple"]}>
                  { (weaponType) => <Option value={weaponType}>{weaponType}</Option> }
                </For>
              </Select>

              <h2>Weapon Range</h2>
              <Select
                transparent
                value={currentWeapon.weaponRange}
                onChange={(e)=>setCurrentWeapon("weaponRange",e.currentTarget.value)}
                disableUnselected
              >
                <For each={["Melee","Ranged"]}>
                  { (weaponRange) => <Option value={weaponRange}>{weaponRange}</Option> }
                </For>
              </Select>

              <h2>Damage</h2>
              <div style={`${styles.damage}`}>
                <h3>Dmg Dice</h3>
                <FormField class={`${styles.dmgDice}`} name="Dmg Dice">
                  <Input 
                    type="number"
                    transparent
                    min={0}
                    placeholder="how many"
                    value={diceNumber()}
                    onChange={(e)=>setDiceNumber(parseInt(e.currentTarget.value))}
                  />
                  <Select
                    transparent
                    onChange={(e)=>setDmgDice(`${diceNumber()}${e.currentTarget.value}`)}
                  >
                    <For each={["d4","d6","d8","d10","d12","d20"]}>
                      { (dice)=> <Option value={dice}>{dice}</Option> }
                    </For>
                  </Select>
                </FormField>
                
                <h3>Dmg Type</h3>

                <Select 
                  transparent
                  value={dmgType()}
                  onChange={(e)=>setDmgType(e.currentTarget.value)}
                >
                  <For each={damageTypes().filter(x=>x !== "")}>
                    { (damageType) => <Option value={damageType}>{damageType}</Option> }
                  </For>
                </Select>

                <h3>Damage Bonus</h3>
                <FormField name="Dmg Bonus">
                  <Input 
                    type="number"
                    transparent
                    value={dmgBonus()}
                    onInput={(e)=>setDmgBonus(parseInt(e.currentTarget.value))}
                  />
                </FormField>

                <Button onClick={()=>setCurrentWeapon("damage",old=>([...old,{
                    damageDice: dmgDice(),
                    damageType: dmgType(),
                    damageBonus: dmgBonus()
                }]))}>Add Damage</Button>

              </div>

              <Show when={currentWeapon.damage.length > 0}>
                <For each={currentWeapon.damage}>
                  { (damageObj) => <Chip key={`${damageObj.damageDice} + ${damageObj.damageBonus}`} value={damageObj.damageType} /> }
                </For>
              </Show>

              <h2>Range</h2>

              <div style={{display:"flex","flex-direction":"column"}}>
                <h3>Normal</h3>
                <FormField name="Normal">
                  <Input 
                    type="text"
                    transparent
                    value={currentWeapon.range.normal}
                    onInput={(e)=>setCurrentWeapon("range",old=>({
                      normal: parseInt(e.currentTarget.value),
                      long: old.long
                    }))}
                  />
                </FormField>
                <h3>Long</h3>
                <FormField name="Long" >
                  <Input 
                    type="text"
                    transparent
                    value={currentWeapon.range.long}
                    onInput={(e)=>setCurrentWeapon("range",old=>({
                      normal: old.normal,
                      long: parseInt(e.currentTarget.value)
                    }))}
                  />
                </FormField>
              </div>

              <h2>Description</h2>
              <FormField name="Desc">
                <Input 
                  type="text"
                  transparent
                  value={currentWeapon.desc}
                  onInput={(e)=>setCurrentWeapon("desc",[e.currentTarget.value])}
                />
              </FormField>

              <h2>Weight</h2>
              <FormField name="Weight">
                <Input 
                  type="number"
                  transparent
                  value={currentWeapon.weight}
                  onInput={(e)=>setCurrentWeapon("weight",parseInt(e.currentTarget.value))}
                />
              </FormField>

            </div>
          </Show>

          <Show when={itemType() === "Armor"}>
            <div>
              <h2>Armor Category</h2>
              <div>
                <Select
                  transparent
                  value={armorCategory()}
                  onChange={(e)=>setArmorCategory(e.currentTarget.value)}
                >
                  <For each={["Light","Medium","Heavy","Shield","Other"]}>
                    { (armorType) => <Option value={armorType}>{armorType}</Option>}
                  </For>
                </Select>

                <Show when={armorCategory() === "Other"}>
                  <div>
                    <FormField name="Other Category">
                    <Input 
                      type="text"
                      transparent
                      value={otherCategory()}
                      onInput={(e)=>{
                        setOtherCategory(e.currentTarget.value)
                      }}
                    />
                    </FormField>
                  </div>
                </Show>
              </div>

              <h2>Armor class</h2>
              <div>
                  <div>
                    <Input
                      type="checkbox"
                      checked={currentArmor.armorClass.dexBonus}
                      name="dexBonus"
                      onChange={(e)=>{
                        if (e.currentTarget.checked) {
                          setCurrentArmor("armorClass",old=>({
                            base: old.base,
                            dexBonus: true,
                            maxBonus: old.maxBonus
                          }))
                        } else {
                          setCurrentArmor("armorClass",old=>({
                            base: old.base,
                            dexBonus: false,
                            maxBonus: old.maxBonus
                          }))
                        }
                      }}
                    /> <label for="dexBonus">dexterity Bonus</label>
                  </div>

                  <FormField name="base">
                    <Input
                      type="number"
                      transparent
                      value={currentArmor.armorClass.base}
                      onInput={(e)=>setCurrentArmor("armorClass",old=>({
                        base: parseInt(e.currentTarget.value),
                        dexBonus: old.dexBonus,
                        maxBonus: old.maxBonus,
                      }))}
                    />
                  </FormField>

                  <FormField name="Max Bonus">
                    <Input 
                      type="number"
                      transparent
                      value={currentArmor.armorClass.maxBonus}
                      onInput={(e)=>setCurrentArmor("armorClass",old=>({
                        base: old.base,
                        dexBonus: old.dexBonus,
                        maxBonus: parseInt(e.currentTarget.value),
                      }))}
                    />
                  </FormField>

              </div>

              <h2>Strength Req</h2>
              <div>
                <FormField name="Strength Min">
                  <Input 
                    type="number"
                    transparent
                    value={currentArmor.strMin}
                    onInput={(e)=>setCurrentArmor("strMin",parseInt(e.currentTarget.value))}
                  />
                </FormField>
              </div>

              <div>
                <Input
                  type="checkbox"
                  checked={currentArmor.stealthDisadvantage}
                  name="stealthDisavantage"
                  onChange={(e)=>{
                    if (e.currentTarget.checked) {
                      setCurrentArmor("stealthDisadvantage",true)
                    } else {
                      setCurrentArmor("stealthDisadvantage",false)
                    }
                  }}
                /> <label for="stealthDisavantage">Stealth Disavantage</label>
              </div>
              
              <h2>Description</h2>
              <FormField name="Desc">
                <Input
                  type="text"
                  transparent
                  value={currentArmor.desc}
                  onInput={(e)=>setCurrentArmor("desc",[e.currentTarget.value])}
                />
              </FormField>

              <h2>Weight</h2>
              <FormField name="Weight">
                <Input
                  type="number"
                  transparent
                  value={currentArmor.weight}
                  onInput={(e)=>setCurrentArmor("weight",parseInt(e.currentTarget.value))}
                />
              </FormField>
              
            </div>
          </Show>

          <Show when={itemType() === "Item"}>
            <div>
              <h2>Description</h2>
              <FormField name="Item desc">
                <Input
                  type="text"
                  transparent
                  value={currentItem.desc}
                  onInput={(e) => setCurrentItem("desc", [e.currentTarget.value])}
                />
              </FormField>

              <h2>Weight</h2>
              <FormField name="Item Weight">
                <Input
                  type="number"
                  transparent
                  value={currentItem.weight}
                  onInput={(e) =>
                    setCurrentItem("weight", parseInt(e.currentTarget.value))
                  }
                />
              </FormField>
            </div>
          </Show>
        </div>

        <h2>Tags</h2>

        <div>
          <div>
            <Select
              transparent
              value={getItemObj().tags}
              onChange={(e) => setItemTag(e.currentTarget.value)}
            >
              <For each={builtInTags()}>
                {(tag) => <Option value={tag}>{tag}</Option>}
              </For>
            </Select>

            <Show when={itemTag() === "Other"}>
              <Input
                type="text"
                transparent
                value={otherTag()}
                onInput={(e) => setOtherTag(e.currentTarget.value)}
              />
            </Show>

            <Button
              onClick={(e) => {
                switch (getItemObj().equipmentCategory) {
                  case "Item":
                    if (itemTag() === "Other") {
                      setCurrentItem("tags", (old) => [...old, otherTag()]);
                    } else {
                      setCurrentItem("tags", (old) => [...old, itemTag()]);
                    }
                    break;

                  case "Weapon":
                    if (itemTag() === "Other") {
                      setCurrentWeapon("tags", (old) => [...old, otherTag()]);
                    } else {
                      setCurrentWeapon("tags", (old) => [...old, itemTag()]);
                    }
                    break;

                  case "Armor":
                    if (itemTag() === "Other") {
                      setCurrentArmor("tags", (old) => [...old, otherTag()]);
                    } else {
                      setCurrentArmor("tags", (old) => [...old, itemTag()]);
                    }
                    break;
                }
              }}
            >
              Add Tag
            </Button>
          </div>

          <div>
            <Show when={getItemObj()?.tags?.length > 0}>
              <For each={UniqueStringArray(getItemObj()?.tags)}>
                {(tag) => (
                  <Chip
                    value={tag}
                    remove={() => {
                      switch (getItemObj().equipmentCategory) {
                        case "Item":
                          setCurrentItem("tags", (old) => [
                            ...old.filter((x) => x !== tag),
                          ]);
                          break;
                        case "Weapon":
                          setCurrentWeapon("tags", (old) => [
                            ...old.filter((x) => x !== tag),
                          ]);
                          break;
                        case "Armor":
                          setCurrentArmor("tags", (old) => [
                            ...old.filter((x) => x !== tag),
                          ]);
                          break;
                      }
                    }}
                  />
                )}
              </For>
            </Show>
          </div>
        </div>

        <h2>Features</h2>

        <div>
            <Button onClick={()=>setShowFeatureModal(!showFeatureModal())}>
              Add A Feature
            </Button>

            <span>
                <Show when={(getItemObj().features ?? []).length > 0} >
                  <For each={getItemObj().features}>
                    { (feature, i) => <Chip value={feature.name} remove={()=>{
                      switch(getItemObj().equipmentCategory){
                        case "Item":
                          setCurrentItem("features",old=>([...(old ?? []).filter(x=>x.name !== feature.name)]))
                          break

                        case "Weapon":
                          setCurrentWeapon("features",old=>([...(old ?? []).filter(x=>x.name !== feature.name)]))
                          break;

                        case "Armor":
                          setCurrentArmor("features",old=>([...(old ?? []).filter(x=>x.name !== feature.name)]))
                          break;
                      }
                    }} /> }
                  </For>
                </Show>
                <Show when={getItemObj().features?.length === 0}>
                    <Chip value="None" />
                </Show>
            </span>

            <Show when={showFeatureModal()}>
              <FeatureModal 
              addFeature={addFeature}
              replaceFeature={replaceFeature}
              currentLevel={{} as LevelEntity}
              showFeature={showFeatureModal}
              setShowFeature={setShowFeatureModal}
              editIndex={editIndex}
              setEditIndex={setEditIndex}
              currentItem={getItemObj()}
              />
            </Show>
        </div>

        <div>
          <Show when={doesExist()}>
            <Button onClick={editItem}>Edit</Button>
          </Show>
          <Show when={!doesExist()}>
            <Button onClick={saveItem}>Save</Button>
          </Show>
        </div>
      </Body>
    </>
  );
};
export default Items;