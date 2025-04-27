import { Component, createEffect, createMemo, createSignal, For, Setter, Show } from "solid-js";
import { Button, Checkbox, FormGroup, Input, Menu, MenuItem, Modal, Radio, RadioGroup } from "coles-solid-library";
import styles from "./classes.module.scss";
import { Item } from "../../../../../models";
import { Armor, Weapon } from "../../../../../shared";
import { ClassForm } from "./classes";
import { Choice, FeatureTypes } from "../../../../../models/old/core.model";
import { AddItem } from "./items";

interface ItemMenuButtonProps {
  item?: Item;
  addItem: (item: AddItem) => void;
  weapon?: Weapon;
  addWeapon: (weapon: AddItem<Weapon>) => void;
  armor?: Armor;
  addArmor: (armor: AddItem<Armor>) => void;
  formGroup: FormGroup<ClassForm>;
}
export const ItemMenuButton: Component<ItemMenuButtonProps> = (props) => {
  const [showMenu, setShowMenu] = createSignal<boolean>(false);

  const [isNewChoice, setIsNewChoice] = createSignal<boolean>(true);
  const [showChoice, setShowChoice] = createSignal<boolean>(false);
  const [showChoiceAmnt, setShowChoiceAmnt] = createSignal<number>(1);
  const [choiceOpened, setChoiceOpened] = createSignal<boolean>(false);
  const [showChoiceIndex, setShowChoiceIndex] = createSignal<number>(0);

  const [showMultipleMenu, setShowMultipleMenu] = createSignal<boolean>(false);
  const [multipleAmnt, setMultipleAmnt] = createSignal<number>(1);

  const [anchorElement, setAnchorElement] = createSignal<HTMLElement | undefined>();
  const handleClick = () => {
    setShowMenu(true);
  };

  const menuItemClick = (choice: boolean, amnt: number) => {
    if (props?.item) {
      props.addItem({
        item: props.item,
        choice: choice,
        itemAmnt: amnt,
      });
    } else if (props?.weapon) {
      props.addWeapon({
        item: props.weapon,
        choice: choice,
        itemAmnt: amnt,
      });
    } else if (props?.armor) {
      props.addArmor({
        item: props.armor,
        choice: choice,
        itemAmnt: amnt,
      });
    }
  };

  const SetShowChoicePatch: Setter<boolean> = (value: boolean | ((prev: boolean) => boolean)) => {
    setShowChoice(value);
    if (!value) {
      setShowChoiceAmnt(0);
      setChoiceOpened(false);
    }
  };
  const checkboxLabel = createMemo(() => {
    return isNewChoice() ? "New Choice" : "Existing Choice";
  });
  const modalWidth = createMemo(() =>{
    if (showMultipleMenu()) {
      return "250px";
    }
    if (!choiceOpened()) {
      return "300px";
    } else {
      return "400px";
    }
  });
  const modalHeight = createMemo(() =>{
    if (showMultipleMenu()) {
      return "150px";
    }
    if (!choiceOpened()) {
      return "200px";
    } else {
      return "400px";
    }
  });
  const itemTypeString = createMemo(() => {
    if (props?.item) {
      return "Item";
    } else if (props?.weapon) {
      return "Weapon";
    } else if (props?.armor) {
      return "Armor";
    } else {
      return "Unknown";
    }
  })
  const getCurrentChoices = createMemo(() =>{
    switch (itemTypeString()) {
    case "Item":
      return props.formGroup.get('toolProfChoices') as Choice<string>[];
    case "Weapon":
      return props.formGroup.get('weaponProfChoices') as Choice<string>[];
    case "Armor":
      return props.formGroup.get('armorProfChoices') as Choice<string>[];
    default:
      return [];
    }
  });
  const hasChoices = createMemo(() => {
    const choices = getCurrentChoices();
    return choices.length > 0;
  });
  const findOccurrences = (arr: string[], item: string) => {
    const occurrences = arr.reduce((acc, curr) => {
      if (curr === item) {
        acc++;
      }
      return acc;
    }, 0);
    return occurrences;
  };
  const getOccurenceText = (arr: string[], item: string) => {
    const occurrences = findOccurrences(arr, item);
    if (occurrences > 1) {
      return `x ${occurrences}`;
    }
    return '';
  }
  return (
    <div>
      <Button style={{width:'75px'}} ref={setAnchorElement} onClick={handleClick}>
        Add Item
      </Button>
      <Menu show={[showMenu, setShowMenu]} anchorElement={anchorElement}>
        <MenuItem onClick={()=> {
          menuItemClick(false, 1);
          setShowMenu(false);
        }}>Add</MenuItem>
        <MenuItem onClick={() => {
          setShowMultipleMenu(true)
          setShowMenu(false)
        }}>Add Multiple</MenuItem>
        <MenuItem onClick={() => {
          setShowChoice(true);
          setShowMenu(false);

        }}>Add As Choice</MenuItem>
      </Menu>
      <Modal title="Add Multiple" show={[showMultipleMenu, setShowMultipleMenu]} width={modalWidth()} height={modalHeight()} >
        <div class={styles.choiceType}>
          <div class={styles.fieldSizeMd}>
            <span>How many?</span>
            <Input type="number" min={1} value={multipleAmnt()} onChange={(e) => setMultipleAmnt(parseInt(e.currentTarget.value))} />
          </div>
          <div>
            <Button onClick={() => {
              if (props?.item) {
                props.addItem({
                  item: props.item,
                  choice: false,
                  itemAmnt: multipleAmnt(),
                });
              } else if (props?.weapon) {
                props.addWeapon({
                  item: props.weapon,
                  choice: false,
                  itemAmnt: multipleAmnt(),
                });
              } else if (props?.armor) {
                props.addArmor({
                  item: props.armor,
                  choice: false,
                  itemAmnt: multipleAmnt(),
                });
              }
            }}>Add</Button>
          </div>
        </div>
      </Modal>
      <Modal title="Add As Choice" show={[showChoice, SetShowChoicePatch]} width={modalWidth()} height={modalHeight()}>
        <Show when={!choiceOpened()}>
          <div class={styles.choiceType}>
            <span>Is this a new choice?</span>
            <Checkbox label={checkboxLabel()} 
              checked={isNewChoice()}
              disabled={!hasChoices()} 
              onChange={setIsNewChoice} />
            <Button style={{width: "min-content"}} onClick={()=>{
              setChoiceOpened(true);
            }}>Next</Button>
          </div>
        </Show>
        <Show when={isNewChoice() && choiceOpened()}>
          <div class={styles.choiceType}>
            <span>Choose how many?</span>
            <div class={styles.fieldSizeMd}>
              <Input type="number" min={1} value={showChoiceAmnt()} onChange={(e)=>{
                setShowChoiceAmnt(parseInt(e.target.value))
              }}  />
            </div>
            <div class={styles.fieldSizeMd}>
              <span>How many?</span>
              <Input type="number" min={1} value={multipleAmnt()} onChange={(e) => {
                setMultipleAmnt(parseInt(e.target.value));
                console.log('new Howmany: ', e);
                
              }} />
            </div>
            <div>
              <Button onClick={() => {
                console.log('itemAmnt: ',multipleAmnt());
                console.log('choiceAmnt: ',showChoiceAmnt());
                
                if (props?.item) {
                  props.addItem({
                    item: props.item,
                    choice: true,
                    itemAmnt: multipleAmnt(),
                    choiceAmnt: showChoiceAmnt(),
                  });
                } else if (props?.weapon) {
                  props.addWeapon({
                    item: props.weapon,
                    choice: true,
                    itemAmnt: multipleAmnt(),
                    choiceAmnt: showChoiceAmnt(),
                  });
                } else if (props?.armor) {
                  props.addArmor({
                    item: props.armor,
                    choice: true,
                    itemAmnt: multipleAmnt(),
                    choiceAmnt: showChoiceAmnt(),
                  });
                }
              }}>Add</Button>
            </div>
          </div>
        </Show>
        <Show when={!isNewChoice() && choiceOpened()}>
          <div>
            <RadioGroup value={showChoiceIndex()} onChange={setShowChoiceIndex} >
              <For each={getCurrentChoices()}>{(item, i) => <>
                <Radio value={i()} label={`Choose ${item.choose} ${FeatureTypes[item.type]}`}/>
                <ul>
                  <For each={[...new Set(item.choices)]}>{(choice) => <li>{choice} {getOccurenceText(item.choices, choice)}</li>}</For>
                </ul>
              </>}</For>
            </RadioGroup>
          </div>
          <div class={styles.choiceType}>
            <span>Choose how many?</span>
            <div class={styles.fieldSizeMd}>
              <Input type="number" min={1} value={showChoiceAmnt()} onChange={(e) => setShowChoiceAmnt(parseInt(e.currentTarget.value))} />
            </div>
            <div>
              <Button onClick={() => {
                if (props?.item) {
                  props.addItem({
                    item: props.item,
                    choice: true,
                    itemAmnt: showChoiceAmnt(),
                    index: showChoiceIndex(),
                  });
                } else if (props?.weapon) {
                  props.addWeapon({
                    item: props.weapon,
                    choice: true,
                    itemAmnt: showChoiceAmnt(),
                    index: showChoiceIndex(),
                  });
                } else if (props?.armor) {
                  props.addArmor({
                    item: props.armor,
                    choice: true,
                    itemAmnt: showChoiceAmnt(),
                    index: showChoiceIndex(),
                  });
                }
              }}>Add</Button>
            </div>
          </div>
        </Show>
      </Modal>
    </div>
  );
};