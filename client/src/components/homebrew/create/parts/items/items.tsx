import {
  Component,
  For,
  createSignal,
  useContext,
  createMemo,
  createEffect,
  Show,
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

const Items: Component = () => {
  // state part 1
  const sharedHooks = useContext(SharedHookContext);
  const [userSettings, setUserSettings] = getUserSettings();
  const stylin = createMemo(() => useStyle(userSettings().theme));
  const [searchParams, setSearchParams] = useSearchParams();

  const [itemName, setItemName] = createSignal<string>("");
  const [itemType, setItemType] = createSignal<string>("Item");
  const [itemCost, setItemCost] = createSignal<number>(0);
  const [costUnit, setCostUnit] = createSignal<string>("PP");
  const [otherUnit, setOtherUnit] = createSignal<string>("");
  const [itemTag, setItemTag] = createSignal<string>("Versatile");
  const [otherTag, setOtherTag] = createSignal<string>("");

  const [showFeatureModal,setShowFeatureModal] = createSignal<boolean>(false);
  const [editIndex,setEditIndex] = createSignal<number>(-1);

  if (!!!searchParams.Name) setSearchParams({ Name: itemName() });

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

  // stores

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
    name: "", // done
    equipmentCategory: "", // done
    cost: {
      quantity: 0,
      unit: "",
    }, // done
    weight: 0, // done
    tags: [], // done
    desc: [], // done
    item: "", // depricated
    features: [], // done
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

        break;

      case "Armor":
        setCurrentArmor("name", itemName());
        setCurrentArmor("equipmentCategory", itemType());
        setCurrentArmor("cost", {
          quantity: itemCost(),
          unit: costUnit() !== "other" ? costUnit() : otherUnit(),
        });

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
    setCostUnit("");
    setOtherUnit("");
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

  // ▼ when things change ▼
  createEffect(() => {
    setSearchParams({ ItemType: itemType(), Name: itemName() });
    saveToObject();

    switch (itemType()) {
      case "Weapon":
        console.log("currentWeapon", currentWeapon);
        break;
      case "Armor":
        console.log("currentArmor", currentArmor);
        break;
      case "Item":
        console.log("currentItem", currentItem);
        break;
    }
  });

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
              <p>damage</p>
              <p>properties</p>

              <h2>description</h2>
              <FormField name="Item desc">
                <Input 
                  type="number"
                  transparent
                  value={currentWeapon.desc}
                  onInput={(e)=>setCurrentWeapon("desc",e.currentTarget.value)}
                />
              </FormField>

              <h2>weight</h2>
              <FormField name="Item weight">
                <Input 
                  type="number"
                  transparent
                  value={currentWeapon.weight}
                  onInput={(e)=>setCurrentWeapon("weight",parseInt(e.currentTarget.value))}
                />
              </FormField>

              <h2>Weapon Type</h2>

              <FormField name="Weapon Type">
                as
              </FormField>

              <h2></h2>
            </div>
          </Show>

          <Show when={itemType() === "Armor"}>
            <div>
              <p>armor class</p>
              <p>strength requirement</p>
              <p>stealth disadvantage</p>
              <p>description</p>
              <p>weight</p>
            </div>
          </Show>

          <Show when={itemType() === "Item"}>
            <div>
              <h2>description</h2>
              <FormField name="Item desc">
                <Input
                  type="text"
                  transparent
                  value={currentItem.desc}
                  onInput={(e) => setCurrentItem("desc", e.currentTarget.value)}
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
              disableUnselected
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
            <Show when={getItemObj().tags.length > 0}>
              <For each={UniqueStringArray(getItemObj().tags)}>
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
      </Body>
    </>
  );
};
export default Items;
