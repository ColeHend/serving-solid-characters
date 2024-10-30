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
import ItemCreate from "./parts/item/item";
import ArmorCreate from "./parts/armor/armor";
import WeaponCreate from "./parts/weapon/weapon";

const Items: Component = () => {
  // state
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
  const [itemDesc,setItemDesc] = createSignal<string>("");

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

  //  ----------- functions -----------  \\

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
        setCurrentWeapon("desc",itemDesc())

        break;

      case "Armor":
        setCurrentArmor("name", itemName());
        setCurrentArmor("equipmentCategory", itemType());
        setCurrentArmor("cost", {
          quantity: itemCost(),
          unit: costUnit() !== "other" ? costUnit() : otherUnit(),
        });
        setCurrentArmor("desc",itemDesc())
        
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
        setCurrentItem("desc",itemDesc())

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

  // feature modal

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

  // -------------

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
          setItemDesc(item.desc.join(""));
          setCurrentItem(item);
          break;
        
        case "Armor":
          setItemType(item.equipmentCategory);
          setItemName(item.name);
          setItemCost(item.cost.quantity);
          setCostUnit(item.cost.unit);
          setItemDesc(item.desc.join(""));
          setCurrentArmor(item);
          break;

        case "Weapon":
          setItemType(item.equipmentCategory);
          setItemName(item.name);
          setItemCost(item.cost.quantity);
          setCostUnit(item.cost.unit);
          setItemDesc(item.desc.join(""));
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
          setItemDesc(allItem.desc.join(""));
          setCurrentItem(allItem);
          break;
        
        case "Armor":
          setItemType(allItem.equipmentCategory);
          setItemName(allItem.name);
          setItemCost(allItem.cost.quantity);
          setCostUnit(allItem.cost.unit);
          setItemDesc(allItem.desc.join(""));
          setCurrentArmor(allItem);
          break;

        case "Weapon":
          setItemType(allItem.equipmentCategory);
          setItemName(allItem.name);
          setItemCost(allItem.cost.quantity);
          setCostUnit(allItem.cost.unit);
          setItemDesc(allItem.desc.join(""));
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
                {(unitOption) => <Option value={unitOption}>{unitOption !== "other" ? unitOption : "other"}</Option>}
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
            <WeaponCreate 
              currentWeapon={currentWeapon}
              setCurrentWeapon={setCurrentWeapon}
              styles={styles}
              dmgDice={dmgDice}
              setDmgDice={setDmgDice}
              dmgType={dmgType}
              setDmgType={setDmgType}
              dmgBonus={dmgBonus}
              setDmgBonus={setDmgBonus}
              diceNumber={diceNumber}
              setDiceNumber={setDiceNumber}
              damageTypes={damageTypes}
              desc={itemDesc}
              setDesc={setItemDesc}
            />
          </Show>

          <Show when={itemType() === "Armor"}>
            <ArmorCreate 
              currentArmor={currentArmor}
              setCurrentArmor={setCurrentArmor}
              armorCategory={armorCategory}
              setArmorCategory={setArmorCategory}
              otherCategory={otherCategory}
              setOtherCategory={setOtherCategory}
              styles={styles}
              desc={itemDesc}
              setDesc={setItemDesc}
            />
          </Show>

          <Show when={itemType() === "Item"}>
            <ItemCreate 
              currentItem={currentItem}
              setCurrentItem={setCurrentItem}
              desc={itemDesc}
              setDesc={setItemDesc}
            />
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

        
        <hr />

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