import {
  Accessor,
  Component,
  For,
  Show,
  createEffect,
  createMemo,
  createSignal,
  untrack,
  useContext,
  type JSX,
} from "solid-js";
import {
  Input,
  Button,
  Select,
  Option,
  Carousel,
  Chip,
  useGetClasses,
  useGetItems,
  getUserSettings,
  useStyle,
  Body,
	Weapon,
	Item,
	Armor,
	Paginator,
	SortArrayByKey,
	Clone
} from "../../../../../../shared/";
import FormField from "../../../../../../shared/components/FormField/formField";
import { DnDClass } from "../../../../../../models";
import { Choice } from "../../../../../../models/core.model";
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

	const allWeapons = createMemo(()=>allItems().filter((item)=>item.equipmentCategory === "Weapon") as Weapon[]);
	const [weaponSort, setWeaponSort] = createSignal<{key: keyof Weapon, isAsc: boolean}>({key:"name", isAsc:true});
	const [allWeaponsT, setAllWeaponsT] = createSignal<Weapon[]>([]);
	const [paginatedWeapons, setPaginatedWeapons] = createSignal<Weapon[]>([]);

	const allArmor = createMemo(()=>allItems().filter((item)=>item.equipmentCategory === "Armor") as Armor[]);
	const [armorSort, setArmorSort] = createSignal<{key: keyof Armor, isAsc: boolean}>({key:"name", isAsc:true});
	const [paginatedArmor, setPaginatedArmor] = createSignal<Armor[]>([]);
	const [allArmorT, setAllArmorT] = createSignal<Armor[]>([]);

	const [showChoices, setShowChoices] = createSignal(false);
	const [currentChoiceNum, setCurrentChoiceNum] = createSignal(1);
	const getChoice = (choiceNum: number) => {
		if (choiceNum === 1) return props.currentClass.startingEquipment.choice1;
		if (choiceNum === 2) return props.currentClass.startingEquipment.choice2;
		if (choiceNum === 3) return props.currentClass.startingEquipment.choice3;
		if (choiceNum === 4) return props.currentClass.startingEquipment.choice4;	
		return [];	
	};
	const [selectedItems, setSelectedItems] = createSignal<string[]>([]);

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
	return (
		<div>
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
									<li>Choose: {item.choose}
										<For each={item.choices}>{(choice)=>(
											<Chip key="Choice " value={choice.item} />
										)}</For>	
									</li>
									<Show when={getChoice(choiceNum).length > 1 && --getChoice(choiceNum).length !== i()}>
										<li>or</li>
									</Show>
								</>)}
							</For>
						</ul>
					<Show when={getChoice(choiceNum).length === 0}>
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
													columns={['name', 'price', 'category']}>
													<Column name="name">
														<Header class={`${styles.header}`} onClick={()=>{setItemSort(old=>({key: 'name', isAsc: !old.isAsc}))}}>
															Name {itemSort().key === "name" ? (itemSort().isAsc ? "▲" : "▼") : ""}
														</Header>
														<Cell<Item> >{(item, i)=><span title={(item.desc??[]).join('\n')}>{item.name}</span>}</Cell>
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
												<Button>Add Items</Button>
											</div>
										</Tab>
										<Tab name="Weapons">
											<SearchBar wrapClass={`${styles.searchBar}`} placeholder="search for items.." dataSource={allWeapons} setResults={setAllWeaponsT} />
											<div class={`${styles.tableContainer}`}>
												<Table 
													class={`${styles.itemTable}`}
													data={paginatedWeapons} 
													columns={['name', 'price', 'category', 'damage', 'range']}>
													<Column name="name">
														<Header class={`${styles.header}`} onClick={()=>{setWeaponSort(old=>({key: 'name', isAsc: !old.isAsc}))}}>
															Name {weaponSort().key === "name" ? (weaponSort().isAsc ? "▲" : "▼") : ""}
														</Header>
														<Cell<Weapon> >{(weapon, i)=><span title={(weapon.desc??[]).join('\n')}>{weapon.name}</span>}</Cell>
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
														<Cell<Weapon> >{(weapon,i)=><span title={(weapon.desc??[]).join('\n')}>
															{weapon.damage.map((x)=>`${x.damageDice} ${!!x.damageBonus ? '+' : ''} ${!!x.damageBonus ? x.damageBonus : ''} ${x.damageType}`).join(' ')}
															</span>}</Cell>
													</Column>
													<Column name='range'>
														<Header class={`${styles.header}`} onClick={()=>{setWeaponSort(old=>({key: 'range', isAsc: !old.isAsc}))}}>
															Range {weaponSort().key === 'range' ? (weaponSort().isAsc ? "▲" : "▼") : ""}
														</Header>
														<Cell<Weapon> >{(weapon,i)=><span title={(weapon.desc??[]).join('\n')}>
															{!!weapon.range.long ? `${weapon.range.normal}ft / ${weapon.range.long}ft`: `${weapon.range.normal}ft`}
															</span>}</Cell>
													</Column>
													<Row />
												</Table>
											</div>
												<Paginator classes={`${styles.paginator}`} items={allWeaponsT} setPaginatedItems={setPaginatedWeapons} />
											<div>
												<Button>Add Weapons</Button>
											</div>
										</Tab>
										<Tab name="Armor">
											<div style={{height: '100%'}}>
												<Select transparent>
													<For each={allArmor()}>{(item)=>(
														<Option value={item.name}>{item.name}</Option>
													)}</For>
												</Select>
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