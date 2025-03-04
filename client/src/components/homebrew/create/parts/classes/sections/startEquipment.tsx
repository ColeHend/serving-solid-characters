import {
  Component,
  For,
  Show,
  createEffect,
  createMemo,
  createSignal,
  untrack,
} from "solid-js";
import {
  Input,
  Button,
  Chip,
  useGetItems,
  Weapon,
  Item,
  Armor,
  Paginator,
  SortArrayByKey,
  Clone,
  UniqueSet
} from "../../../../../../shared/";
import { DnDClass } from "../../../../../../models";
import { Choice, FeatureTypes } from "../../../../../../models/core.model";
import Modal from "../../../../../../shared/components/popup/popup.component";
import Tabs, { Tab } from "../../../../../../shared/components/Tabs/tabs";
import { Table } from "../../../../../../shared/components/Table/table";
import { Column, Header, Cell, Row } from "../../../../../../shared/components/Table/innerTable";
import styles from './equipment.module.scss';
import SearchBar from "../../../../../../shared/components/SearchBar/SearchBar";

interface Props {
	currentClass: DnDClass;
	setStartEquipChoice: (choiceNum: number, choice: Choice<Item>[]) => void;
}
const StartingEquipment: Component<Props> = (props) => {
  const [itemSort, setItemSort] = createSignal<{key: keyof Item, isAsc: boolean}>({key: "name", isAsc: true});
  const allItems = useGetItems();
  const [allItemsT, setAllItemsT] = createSignal<Item[]>([]);
  const [paginatedItems, setPaginatedItems] = createSignal<Item[]>([]);
  const [selectedItems, setSelectedItems] = createSignal<{item:Item, amnt: number}[]>([]);

  const allWeapons = createMemo(()=>allItems().filter((item)=>item.equipmentCategory === "Weapon") as Weapon[]);
  const [weaponSort, setWeaponSort] = createSignal<{key: keyof Weapon, isAsc: boolean}>({key:"name", isAsc:true});
  const [allWeaponsT, setAllWeaponsT] = createSignal<Weapon[]>([]);
  const [paginatedWeapons, setPaginatedWeapons] = createSignal<Weapon[]>([]);
  const [selectedWeapons, setSelectedWeapons] = createSignal<{item:Weapon, amnt: number}[]>([]);

  const allArmor = createMemo(()=>allItems().filter((item)=>item.equipmentCategory === "Armor") as Armor[]);
  const [armorSort, setArmorSort] = createSignal<{key: keyof Armor, isAsc: boolean}>({key:"name", isAsc:true});
  const [paginatedArmor, setPaginatedArmor] = createSignal<Armor[]>([]);
  const [allArmorT, setAllArmorT] = createSignal<Armor[]>([]);
  const [selectedArmor, setSelectedArmor] = createSignal<{item:Armor, amnt: number}[]>([]);

  const [showChoices, setShowChoices] = createSignal(false);
  const [currentChoiceNum, setCurrentChoiceNum] = createSignal(1);
  const getChoice = (choiceNum: number) => {
    const currentClass = props.currentClass;
    if (choiceNum === 1) return currentClass.startingEquipment?.choice1 ?? [];
    if (choiceNum === 2) return currentClass.startingEquipment?.choice2 ?? [];
    if (choiceNum === 3) return currentClass.startingEquipment?.choice3 ?? [];
    if (choiceNum === 4) return currentClass.startingEquipment?.choice4 ?? [];	
    return [];	
  };

  const getItemAmntOnClass = (item: Item, choiceNum: number, i:number)=>{
    const classItems = getChoice(choiceNum)[i]?.choices ?? 1;
    return classItems.filter(x=>x.name === item.name).length
  };
  const getUniqueItems = (items: Item[])=>{
    const uniqueItems = new UniqueSet<Item>();
    uniqueItems.value = items;
    return uniqueItems.value;
  }

  createEffect(()=>{
    setAllItemsT(allItems());
  });
  createEffect(()=>{
    setAllWeaponsT(allWeapons())
  });
  createEffect(()=>{
    setAllArmorT(allArmor())
  });

  createEffect(()=>{
    const curSort = itemSort()
    setAllItemsT(old => Clone(SortArrayByKey(old, curSort.key, curSort.isAsc)) as Item[]);
  });
  createEffect(()=>{
    const curSort = armorSort();
    setAllArmorT(old => Clone(SortArrayByKey(old, curSort.key, curSort.isAsc)));
  });
  createEffect(()=>{
    const curSort = weaponSort();
    setAllWeaponsT(old => Clone(SortArrayByKey(old, curSort.key, curSort.isAsc)));
  });
  createEffect(()=>{
    // eslint-disable-next-line
    !showChoices() && setSelectedItems([]);
    // eslint-disable-next-line
    !showChoices() && setSelectedWeapons([]);
    // eslint-disable-next-line
    !showChoices() && setSelectedArmor([]);
  });
  const addWeapons = (choose: number = 1) => {
    const choice = getChoice(currentChoiceNum());
    const newChoices = [...choice, {
      choose,
      type: FeatureTypes.Weapon,
      choices: selectedWeapons().flatMap((item)=>Array.from({length: item.amnt}, ()=>item.item))
    }];
    props.setStartEquipChoice(currentChoiceNum(), newChoices);
    setShowChoices(false);
    setSelectedWeapons([]);
    setSelectedAmount(1);
  }
  const addArmor = (choose: number = 1) => {
    const choice = getChoice(currentChoiceNum());
    props.setStartEquipChoice(currentChoiceNum(), [...choice, {
      choose,
      type: FeatureTypes.Armor,
      choices: selectedArmor().flatMap((item)=>Array.from({length: item.amnt}, ()=>item.item))
    }]);
    setShowChoices(false);
    setSelectedArmor([]);
    setSelectedAmount(1);
  }
  const addItems = (choose: number = 1) => {
    const choice = getChoice(currentChoiceNum());
    props.setStartEquipChoice(currentChoiceNum(), [...choice, {
      choose,
      type: FeatureTypes.Item,
      choices: selectedItems().flatMap((item)=>Array.from({length: item.amnt}, ()=>item.item))
    }]);
    setShowChoices(false);
    setSelectedItems([]);
    setSelectedAmount(1);
  }

  const [selectedAmount, setSelectedAmount] = createSignal(1);

  return (
    <div class={`${styles.equipContain}`}>
      <h2>Starting Equipment</h2>
      <div>
        <ul class={`${styles.list}`}>
          <For each={[1,2,3,4]}>{(choiceNum)=>(<li>
            <h3>Choice {choiceNum} <Button onClick={(e)=>{
              e.preventDefault();
              setCurrentChoiceNum(choiceNum);
              setShowChoices(true);
            }}>+</Button></h3>
            <ul>
              <For each={getChoice(choiceNum)}>
                {(item, i)=>(<>
                  <li>
                    <span>
                      <Button onClick={(e) => {
                        e.preventDefault();
                         
                        const newChoices = Clone(getChoice(choiceNum)).filter((x, idx)=>idx !== i());
                        props.setStartEquipChoice(choiceNum, newChoices);
                      }}>x</Button>Choose: {item?.choose} 
                    </span>
                    <span>
                      <For each={getUniqueItems(item.choices)}>{(choice)=>(
                        <Chip 
                          key={`Choice`} 
                          value={`${(choice?.name ?? choice?.item)} ${getItemAmntOnClass(choice, choiceNum, i()) > 1 ? `x${getItemAmntOnClass(choice, choiceNum, i())}`: ``}`}
                        />
                      )}</For>	
                    </span>
                  </li>
                  <Show when={getChoice(choiceNum).length > 1 && --getChoice(choiceNum).length !== i()}>
                    <li>or</li>
                  </Show>
                </>)}
              </For>
            </ul>
            <Show when={getChoice(choiceNum)?.length === 0}>
              <i>Add Items to choose from.</i>
            </Show>
          </li>)}</For>
          <Show when={showChoices()}>
            <Modal backgroundClick={[showChoices, setShowChoices]} title="Add Equipment Choice" >
              <div>
                <Tabs>
                  <Tab name="Items">
                    <SearchBar wrapClass={`${styles.searchBar}`} placeholder="search for items.." dataSource={allItems} setResults={setAllItemsT} />
                    <div class={`${styles.tableContainer}`}>
                      <Table 
                        class={`${styles.itemTable}`}
                        data={paginatedItems} 
                        columns={['include','name', 'price', 'category']}>
                        <Column name='include'>
                          <Header class={`${styles.header}`}>Include</Header>
                          <Cell<Item> >{(item)=><><Input class={`${styles.checkbox}`} type="number" min={0}  onChange={(e)=>{
                            const val = parseInt(e.currentTarget.value);
                            if (val > 0) {
                              setSelectedItems(old=>[...old.filter((ite)=>ite.item.name!==item.name), {item, amnt: val}])
                            } else {
                              setSelectedItems(old=>old.filter((ite)=>ite.item.name!==item.name))
                            }
                          }} /></>}</Cell>
                        </Column>
                        <Column name='amount'>
                          <Header class={`${styles.header}`}>Include</Header>
                          <Cell<Item> >{()=><><Input class={`${styles.checkbox}`} type="number" /></>}</Cell>
                        </Column>
                        <Column name="name">
                          <Header class={`${styles.header}`} onClick={()=>{setItemSort(old=>({key: 'name', isAsc: !old.isAsc}))}}>
															Name {itemSort().key === "name" ? (itemSort().isAsc ? "▲" : "▼") : ""}
                          </Header>
                          <Cell<Item> >{(item)=><span title={(item.desc??[]).join('\n')}>{item.name}</span>}</Cell>
                        </Column>
                        <Column name="price">
                          <Header class={`${styles.header}`} onClick={()=>{setItemSort(old=>({key: 'cost', isAsc: !old.isAsc}))}}>
															Price {itemSort().key === "cost" ? (itemSort().isAsc ? "▲" : "▼") : ""}
                          </Header>
                          <Cell<Item>>{(item)=><span title={(item.desc??[]).join('\n')}>
                            {`${item.cost.quantity} ${item.cost.unit}`}
                          </span>}</Cell>
                        </Column>
                        <Column name="category">
                          <Header class={`${styles.header}`} onClick={()=>{setItemSort(old=>({key: 'equipmentCategory', isAsc: !old.isAsc}))}}>
															Category {itemSort().key === "equipmentCategory" ? (itemSort().isAsc ? "▲" : "▼") : ""}
                          </Header>
                          <Cell<Item>>{(item)=><span title={(item.desc??[]).join('\n')}>
                            {item.equipmentCategory}
                          </span>}</Cell>
                        </Column>
                        <Row />
                      </Table>
                    </div>
                    <Paginator classes={`${styles.paginator}`} items={allItemsT} setPaginatedItems={setPaginatedItems} />
                    <div>
                      <Input type="number" min={1} max={999} style={{width:'50px'}} value={selectedAmount()} onInput={(e)=>{
                        const val = parseInt(e.currentTarget.value);
                        if (val > 0) {
                          setSelectedAmount(val);
                        }
                      }} />
                      <Button onClick={(e)=>{
                        e.preventDefault();
                        addItems(untrack(selectedAmount));
                      }}>Add Items</Button>
                    </div>
                  </Tab>
                  <Tab name="Weapons">
                    <SearchBar wrapClass={`${styles.searchBar}`} placeholder="search for weapons.." dataSource={allWeapons} setResults={setAllWeaponsT} />
                    <div class={`${styles.tableContainer}`}>
                      <Table 
                        class={`${styles.itemTable}`}
                        data={paginatedWeapons} 
                        columns={['include', 'name', 'price', 'category', 'damage', 'range']}>
                        <Column name='include'>
                          <Header class={`${styles.header}`}>Include</Header>
                          <Cell<Weapon> >{(item)=><><Input class={`${styles.checkbox}`} type="number" min={0}  onChange={(e)=>{
                            const val = parseInt(e.currentTarget.value);
                            if (val > 0) {
                              setSelectedWeapons(old=>[...old.filter((ite)=>ite.item.name!==item.name), {item, amnt: val}])
                            } else {
                              setSelectedWeapons(old=>old.filter((ite)=>ite.item.name!==item.name))
                            }
                          }}  /></>}</Cell>
                        </Column>
                        <Column name="name">
                          <Header class={`${styles.header}`} onClick={()=>{setWeaponSort(old=>({key: 'name', isAsc: !old.isAsc}))}}>
															Name {weaponSort().key === "name" ? (weaponSort().isAsc ? "▲" : "▼") : ""}
                          </Header>
                          <Cell<Weapon> >{(weapon)=><span title={(weapon.desc??[]).join('\n')}>{weapon.name}</span>}</Cell>
                        </Column>
                        <Column name="price">
                          <Header class={`${styles.header}`} onClick={()=>{setWeaponSort(old=>({key: 'cost', isAsc: !old.isAsc}))}}>
															Price {weaponSort().key === "cost" ? (weaponSort().isAsc ? "▲" : "▼") : ""}
                          </Header>
                          <Cell<Weapon>>{(weapon)=><span title={(weapon.desc??[]).join('\n')}>
                            {`${weapon.cost.quantity} ${weapon.cost.unit}`}
                          </span>}</Cell>
                        </Column>
                        <Column name="category">
                          <Header class={`${styles.header}`} onClick={()=>{setWeaponSort(old=>({key: 'categoryRange', isAsc: !old.isAsc}))}}>
															Category {weaponSort().key === "equipmentCategory" ? (weaponSort().isAsc ? "▲" : "▼") : ""}
                          </Header>
                          <Cell<Weapon>>{(weapon)=><span title={(weapon.desc??[]).join('\n')}>
                            {weapon.weaponCategory}
                          </span>}</Cell>
                        </Column>
                        <Column name='damage'>
                          <Header class={`${styles.header}`} onClick={()=>{setWeaponSort(old=>({key: 'damage', isAsc: !old.isAsc}))}}>
															Damage {weaponSort().key === 'damage' ? (weaponSort().isAsc ? "▲" : "▼") : ""}
                          </Header>
                          <Cell<Weapon> >{(weapon)=><span title={(weapon.desc??[]).join('\n')}>
                            {weapon.damage.map((x)=>`${x.damageDice} ${x.damageBonus ? '+' : ''} ${x.damageBonus ? x.damageBonus : ''} ${x.damageType}`).join(' ')}
                          </span>}</Cell>
                        </Column>
                        <Column name='range'>
                          <Header class={`${styles.header}`} onClick={()=>{setWeaponSort(old=>({key: 'range', isAsc: !old.isAsc}))}}>
															Range {weaponSort().key === 'range' ? (weaponSort().isAsc ? "▲" : "▼") : ""}
                          </Header>
                          <Cell<Weapon> >{(weapon)=><span title={(weapon.desc??[]).join('\n')}>
                            {weapon.range.long ? `${weapon.range.normal}ft / ${weapon.range.long}ft`: `${weapon.range.normal}ft`}
                          </span>}</Cell>
                        </Column>
                        <Row />
                      </Table>
                    </div>
                    <Paginator classes={`${styles.paginator}`} items={allWeaponsT} setPaginatedItems={setPaginatedWeapons} />
                    <div>
                      <Input type="number" min={1} max={999} style={{width:'50px'}} value={selectedAmount()} onInput={(e)=>{
                        const val = parseInt(e.currentTarget.value);
                        if (val > 0) {
                          setSelectedAmount(val);
                        }
                      }} />
                      <Button onClick={(e)=>{
                        e.preventDefault();
                        addWeapons(untrack(selectedAmount));
                      }}>Add Weapons</Button>
                    </div>
                  </Tab>
                  <Tab name="Armor"> 
                    <SearchBar wrapClass={`${styles.searchBar}`} placeholder="search for armor.." dataSource={allArmor} setResults={setAllArmorT} />
                    <div class={`${styles.tableContainer}`}>
                      <Table 
                        class={`${styles.itemTable}`}
                        data={paginatedArmor} 
                        columns={['include', 'name', 'price', 'category', 'damage', 'range']}>
                        <Column name='include'>
                          <Header class={`${styles.header}`}>Include</Header>
                          <Cell<Armor> >{(item)=><><Input class={`${styles.checkbox}`} type="number" min={0}  onChange={(e)=>{
                            const val = parseInt(e.currentTarget.value);
                            if (val > 0) {
                              setSelectedArmor(old=>[...old.filter((ite)=>ite.item.name!==item.name), {item, amnt: val}])
                            } else {
                              setSelectedArmor(old=>old.filter((ite)=>ite.item.name!==item.name))
                            }
                          }}  /></>}</Cell>
                        </Column>
                        <Column name="name">
                          <Header class={`${styles.header}`} onClick={()=>{setArmorSort(old=>({key: 'name', isAsc: !old.isAsc}))}}>
															Name {armorSort().key === "name" ? (armorSort().isAsc ? "▲" : "▼") : ""}
                          </Header>
                          <Cell<Armor> >{(armor)=><span title={(armor.desc??[]).join('\n')}>{armor.name}</span>}</Cell>
                        </Column>
                        <Column name="price">
                          <Header class={`${styles.header}`} onClick={()=>{setArmorSort(old=>({key: 'cost', isAsc: !old.isAsc}))}}>
															Price {armorSort().key === "cost" ? (armorSort().isAsc ? "▲" : "▼") : ""}
                          </Header>
                          <Cell<Armor>>{(armor)=><span title={(armor.desc??[]).join('\n')}>
                            {`${armor.cost.quantity} ${armor.cost.unit}`}
                          </span>}</Cell>
                        </Column>
                        <Column name="category">
                          <Header class={`${styles.header}`} onClick={()=>{setArmorSort(old=>({key: 'armorCategory', isAsc: !old.isAsc}))}}>
															Category {armorSort().key === "armorCategory" ? (armorSort().isAsc ? "▲" : "▼") : ""}
                          </Header>
                          <Cell<Armor>>{(armor)=><span title={(armor.desc??[]).join('\n')}>
                            {armor.armorCategory}
                          </span>}</Cell> 
                        </Column>
                        <Column name='damage'>
                          <Header class={`${styles.header}`} onClick={()=>{setArmorSort(old=>({key: 'armorClass', isAsc: !old.isAsc}))}}>
															Armor Class {armorSort().key === 'armorClass' ? (armorSort().isAsc ? "▲" : "▼") : ""}
                          </Header>
                          <Cell<Armor> >{(armor)=><span title={(armor.desc??[]).join('\n')}>
                            {armor.armorClass.base} {armor.armorClass.dexBonus ? `+ DEX ` : ``} {armor.armorClass.maxBonus ? <i>{`Max(${armor.armorClass.maxBonus})`}</i>: ``}
                          </span>}</Cell>
                        </Column>
                        <Row />
                      </Table>
                    </div>
                    <Paginator classes={`${styles.paginator}`} items={allArmorT} setPaginatedItems={setPaginatedArmor} />
                    <div>
                      <Input type="number" min={1} max={999} style={{width:'50px'}} value={selectedAmount()} onInput={(e)=>{
                        const val = parseInt(e.currentTarget.value);
                        if (val > 0) {
                          setSelectedAmount(val);
                        }
                      }} />
                      <Button onClick={(e)=>{
                        e.preventDefault();
                        addArmor(untrack(selectedAmount));
                      }}>Add Armor</Button>
                    </div>
                  </Tab>
                </Tabs>
              </div>
            </Modal>	
          </Show>
        </ul>
      </div>
    </div>
  );
} 

export default StartingEquipment;