import { Component, createMemo, createSignal, For, Setter } from "solid-js";
import styles from "./classes.module.scss";
import { Armor, Clone, useGetArmor, useDnDItems, useGetWeapons, Weapon } from "../../../../../shared";
import { Modal, Select, Option, Input, FormField, Table, Column, Header, Cell, Row, FormGroup, Button, Icon } from "coles-solid-library";
import { ClassForm } from "./classes";
import { Choice, FeatureTypes } from "../../../../../models/old/core.model";
import { ItemMenuButton } from "./itemMenuButton";
import { Item } from "../../../../../models/data";

export interface AddItem<T=Item> {
  item: T;
  choice?: boolean;
  choiceAmnt?: number;
  itemAmnt?: number;
  index?: number;
}

interface ItemProps {
  formGroup: FormGroup<ClassForm>;
}
export const Items: Component<ItemProps> = (props) => {
  const [showModal, setShowModal] = createSignal<boolean>(false);
  const [modalShown, setModalShown] = createSignal<undefined | 'items' | 'weapons' | 'armor'>();

  const [choiceAmnt, setChoiceAmnt] = createSignal<number>(0);
  const [selectedChoice, setSelectedChoice] = createSignal<number>(0);
  
  const [modalColumns, setModalColumns] = createSignal<string[]>(['name', 'description', 'weight', 'cost']);
  const [empty,] = createSignal<Item[]>([]);
  const allItems = useDnDItems();
  const allWeapons = createMemo(() => allItems().filter(item => {
    return Object.keys(item?.properties ?? {}).includes('Damage');
  }));
  const allArmor = createMemo(() => allItems().filter(item => {
    return Object.keys(item?.properties ?? {}).includes('AC');
  }));

  // const allWeapons = useGetWeapons();
  // const allArmor = useGetArmor();
  const currentData = createMemo(() => {
    if (modalShown() === 'items') {
      return allItems();
    } else if (modalShown() === 'weapons') {
      return allWeapons();
    } else if (modalShown() === 'armor') {
      return allArmor();
    }
    return empty();
  });

  const setModalPatch: Setter<boolean> = (value: boolean | ((prev: boolean) => boolean)) => {
    setShowModal(value);
    if (!value) {
      setModalShown();
      setModalColumns(['name', 'description', 'weight', 'cost', 'menu']);
    } else if (modalShown() === 'items') {
      setModalColumns(['name', 'description', 'weight', 'cost', 'menu']);
    } else if (modalShown() === 'weapons') {
      setModalColumns(['name', 'description', 'weight', 'cost', 'damage', 'range', 'weaponCategory', 'menu']);
    } else if (modalShown() === 'armor') {
      setModalColumns(['name', 'description', 'weight', 'cost', 'armorClass', 'armorDisadv', 'armorType', 'armorCategory', 'menu']);
    }
  };
  const setModalType = (type: 'items' | 'weapons' | 'armor') => {
    setModalShown(type);
    setModalPatch(true);
  };

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
  const uniqueString = (arr: string[]) => {
    const unique = new Set(arr);
    return Array.from(unique);
  };
  const deleteItem = (key: keyof ClassForm, item: string) => {
    const items = props.formGroup.get(key) as string[];
    const index = items.indexOf(item);
    if (index > -1) {
      const updated = [...items.slice(0, index), ...items.slice(index + 1)];
      props.formGroup.set(key, updated);
    }
  };

  // Add a helper to remove all occurrences from an array.
  const removeAllOccurrences = (arr: string[], value: string) => arr.filter(item => item !== value);

  return (// Item choices a/b or whats given
    <div class={`${styles.classSection}`}>
      <div>
        <div>Add Starting Equipment</div>
        <div>
          <Button onClick={()=>setModalType('weapons')} >Weapons</Button> 
          <Button onClick={()=>setModalType('armor')}>Armor</Button>
          <Button onClick={()=>setModalType('items')}>Tools</Button>
        </div>
      </div>
      <div>
        <div>
          <ul class={styles.list}>
            <For each={props.formGroup.get('weaponStart') as string[]}>{(weaponProf) => <>
              <li>
                <Button onClick={()=>{
                  deleteItem('weaponStart', weaponProf);
                }}><Icon name="delete" size={"small"} /></Button> {weaponProf} {getOccurenceText(props.formGroup.get('weaponStart') as string[], weaponProf)}
              </li>
            </>}</For>
            <For each={props.formGroup.get('armorStart') as string[]}>{(armorProf) => <>
              <li>
                <Button onClick={()=>{
                  deleteItem('armorStart', armorProf);
                }}><Icon name="delete" size={"small"} /></Button> {armorProf} {getOccurenceText(props.formGroup.get('armorStart') as string[], armorProf)}
              </li>
            </>}</For>
            <For each={props.formGroup.get('itemStart') as string[]}>{(toolProf) => <>
              <li>
                <Button onClick={()=>{
                  deleteItem('itemStart', toolProf);
                }}><Icon name="delete" size={"small"} /></Button> {toolProf} {getOccurenceText(props.formGroup.get('itemStart') as string[], toolProf)}
              </li>
            </>}</For>
            <For each={props.formGroup.get('weaponProfChoices') as Choice<string>[]}>{(weaponProf, index) => <>
              <li>
                <Button onClick={()=>{
                  const choices = props.formGroup.get('weaponProfChoices') as Choice<string>[];
                  props.formGroup.set('weaponProfChoices', choices.filter((_, idx) => idx !== index()));
                }}><Icon name="delete" size={"small"} /></Button> {`Choose ${weaponProf.choose} ${weaponProf.choose > 1 ? 'Weapons' : 'Weapon'}`}
              </li>
              <li>
                <ul class={styles.list}>
                  <For each={uniqueString(weaponProf.choices)}>{(choice) => <li>
                    <Button onClick={()=>{
                      const arr = props.formGroup.get('weaponProfChoices') as Choice<string>[];
                      const updated = [...arr];
                      const choiceIdx = index();
                      if (choiceIdx < updated.length) {
                        updated[choiceIdx] = {
                          ...updated[choiceIdx],
                          choices: removeAllOccurrences(updated[choiceIdx].choices, choice)
                        };
                        props.formGroup.set('weaponProfChoices', updated);
                      }
                    }}>
                      <Icon name="delete" size={"small"} />
                    </Button> {choice} {getOccurenceText(weaponProf.choices, choice)}
                  </li>}</For>
                </ul>
              </li>
            </>}</For>
            <For each={props.formGroup.get('armorProfChoices') as Choice<string>[]}>{(armorProf, index) => <>
              <li>
                <Button onClick={()=>{
                  const arr = props.formGroup.get('armorProfChoices') as Choice<string>[];
                  props.formGroup.set('armorProfChoices', arr.filter((_, idx) => idx !== index()));
                }}><Icon name="delete" size={"small"} /></Button> {`Choose ${armorProf.choose} Armor ${armorProf.choose > 1 ? 'Pieces' : 'Piece'}`}
              </li>
              <li>
                <ul class={styles.list}>
                  <For each={uniqueString(armorProf.choices)}>{(choice) => <li>
                    <Button onClick={()=>{
                      const arr = props.formGroup.get('armorProfChoices') as Choice<string>[];
                      const updated = [...arr];
                      const choiceIdx = index();
                      if (choiceIdx < updated.length) {
                        updated[choiceIdx] = {
                          ...updated[choiceIdx],
                          choices: removeAllOccurrences(updated[choiceIdx].choices, choice)
                        };
                        props.formGroup.set('armorProfChoices', updated);
                      }
                    }}>
                      <Icon name="delete" size={"small"} />
                    </Button> {choice} {getOccurenceText(armorProf.choices, choice)}
                  </li>}</For>
                </ul>
              </li>
            </>}</For>
            <For each={props.formGroup.get('toolProfChoices') as Choice<string>[]}>{(toolProf, index) => <>
              <li>
                <Button onClick={()=>{
                  const arr = props.formGroup.get('toolProfChoices') as Choice<string>[];
                  props.formGroup.set('toolProfChoices', arr.filter((_, idx) => idx !== index()));
                }}><Icon name="delete" size={"small"} /></Button> {`Choose ${toolProf.choose} ${toolProf.choose > 1 ? 'Items' : 'Item'}`}
              </li>
              <li>
                <ul class={styles.list}>
                  <For each={uniqueString(toolProf.choices)}>{(choice) => <li>
                    <Button onClick={()=>{
                      const arr = props.formGroup.get('toolProfChoices') as Choice<string>[];
                      const updated = [...arr];
                      const choiceIdx = index();
                      if (choiceIdx < updated.length) {
                        updated[choiceIdx] = {
                          ...updated[choiceIdx],
                          choices: removeAllOccurrences(updated[choiceIdx].choices, choice)
                        };
                        props.formGroup.set('toolProfChoices', updated);
                      }
                    }}>
                      <Icon name="delete" size={"small"} />
                    </Button> {choice} {getOccurenceText(toolProf.choices, choice)}
                  </li>}</For>
                </ul>
              </li>
            </>}</For>
          </ul>
        </div>
      </div>
      
      <Modal title="Choose Items" show={[showModal, setModalPatch]}>
        <div>
          <div>

          </div>
          <div>
            <Table data={currentData} columns={modalColumns()}>
              <Row header />
              <Row />
              <Column name="name">
                <Header>Item</Header>
                <Cell<Item> >{(item)=> item.name}</Cell>
              </Column>
              <Column name="weight">
                <Header>Weight</Header>
                <Cell<Item> >{(item)=> item.weight}</Cell>
              </Column>
              <Column name="cost">
                <Header>Cost</Header>
                <Cell<Item> >{(item)=> <>{`${item.cost}`}</>}</Cell>
              </Column>
              <Column name="description">
                <Header>Description</Header>
                <Cell<Item> >{(item)=> <>{item.desc}</>}</Cell>
              </Column>

              <Column name="damage">
                <Header>Damage</Header>
                <Cell<Weapon> >{(weapon)=><>
                  {weapon.damage?.map((d)=>`${d.damageDice}${d.damageBonus ? `+ ${d.damageBonus}` : ''}${' ' + d.damageType}`).join(',\n')}
                </>}</Cell>
              </Column>
              <Column name="range">
                <Header>Range</Header>
                <Cell<Weapon> >{(item)=> <>{item.weaponRange}</>}</Cell>
              </Column>
              <Column name="weaponCategory">
                <Header>Weapon Category</Header>
                <Cell<Weapon> >{(item)=> <>{item.weaponCategory}</>}</Cell>
              </Column>

              <Column name="armorClass">
                <Header>Armor Class</Header>
                <Cell<Armor> >{(item)=> <>{item.armorClass}</>}</Cell>
              </Column>
              <Column name="armorDisadv">
                <Header>Stealth DisAdv</Header>
                <Cell<Armor> >{(item)=> <>{item.stealthDisadvantage}</>}</Cell>
              </Column>
              <Column name="armorType">
                <Header>Min STR</Header>
                <Cell<Armor> >{(item)=> <>{item.strMin > 0 ? item.strMin : '-'}</>}</Cell>
              </Column>
              <Column name="armorCategory">
                <Header>Armor Category</Header>
                <Cell<Armor> >{(item)=> <>{item.armorCategory}</>}</Cell>
              </Column>

              <Column name="menu">
                <Cell<Item> >{item=><>
                  <ItemMenuButton
                    formGroup={props.formGroup} 
                    item={modalShown() === 'items' ? item : undefined}
                    addItem={(item)=>{
                      
                      const choice = item?.choice;
                      const amnt = item?.choiceAmnt ?? 1;
                      const index = item?.index;
                      const toAddAmount = item?.itemAmnt ?? 1;
                      
                      if (choice) {
                        const toAddText = new Array<string>(toAddAmount).fill(item.item.name);
                        const choices = props.formGroup.get('toolProfChoices') as Choice<string>[];
                        if (index !== undefined) {
                          choices[index].choices.push(...toAddText);
                        } else {
                          choices.push({
                            type: FeatureTypes.Item,
                            choose: amnt,
                            choices: [...toAddText],
                          });
                        }
                        props.formGroup.set('toolProfChoices', choices);
                      } else {
                        const items = props.formGroup.get('itemStart') as string[];
                        const itemString = toAddAmount > 1 ? `${item.item.name} x ${toAddAmount}` : item.item.name;
                        
                        items.push(itemString);
                        props.formGroup.set('itemStart', items);
                      }
                    }}
                    weapon={modalShown() === 'weapons' ? item : undefined}
                    addWeapon={(weapon)=>{
                      const toAddAmount = weapon.itemAmnt ?? 1;
                      const choice = weapon.choice;
                      const amnt = weapon.choiceAmnt ?? 1;
                      const index = weapon.index;
                      if (choice) {
                        const toAddText = new Array<string>(toAddAmount).fill(weapon.item.name);
                        const choices = props.formGroup.get('weaponProfChoices') as Choice<string>[];
                        if (index !== undefined) {
                          choices[index].choices.push(...toAddText);
                        } else {
                          const newChoice: Choice<string> = {
                            type: FeatureTypes.Item,
                            choose: amnt ?? 1,
                            choices: [...toAddText],
                          };
                          choices.push(newChoice);
                        }
                        props.formGroup.set('weaponProfChoices', choices);
                      } else {
                        const items = props.formGroup.get('weaponStart') as string[];
                        const itemString = toAddAmount > 1 ? `${weapon.item.name} x ${toAddAmount}` : weapon.item.name;
                        items.push(itemString);
                        props.formGroup.set('weaponStart', items);
                      }
                    }}
                    armor={modalShown() === 'armor' ? item : undefined}
                    addArmor={(armor)=>{
                      const toAddAmount = armor?.itemAmnt ?? 1;
                      const choice = armor?.choice;
                      const amnt = armor?.choiceAmnt ?? 1;
                      const index = armor?.index;
                      
                      if (choice) {
                        const toAddText = new Array<string>(toAddAmount).fill(armor.item.name);
                        const choices = props.formGroup.get('armorProfChoices') as Choice<string>[];
                        if (index !== undefined) {
                          choices[index].choices.push(...toAddText);
                        } else {
                          const newChoice: Choice<string> = {
                            type: FeatureTypes.Item,
                            choose: amnt ?? 1,
                            choices: [...toAddText],
                          };
                          choices.push(newChoice);
                        }
                        props.formGroup.set('armorProfChoices', choices);
                      } else {
                        const items = props.formGroup.get('armorStart') as string[];
                        const itemString = toAddAmount > 1 ? `${armor.item.name} x ${toAddAmount}` : armor.item.name;
                        items.push(itemString);
                        props.formGroup.set('armorStart', items);
                      }
                    }}
                  />
                </>}</Cell>
              </Column>

            </Table>
          </div>
        </div>
      </Modal>
    </div>
  );
};