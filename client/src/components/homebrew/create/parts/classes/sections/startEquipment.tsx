import {
  Accessor,
  Component,
  For,
  Show,
  createMemo,
  createSignal,
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
	Armor
} from "../../../../../../shared/";
import FormField from "../../../../../../shared/components/FormField/formField";
import { DnDClass } from "../../../../../../models";
import { Choice } from "../../../../../../models/core.model";
import Modal from "../../../../../../shared/components/popup/popup.component";
import Tabs, { Tab } from "../../../../../../shared/components/Tabs/tabs";
import { S } from "@vite-pwa/assets-generator/shared/assets-generator.5e51fd40";
import { Table } from "../../../../../../shared/components/Table/table";
import { Column, Header, Cell, Row } from "../../../../../../shared/components/Table/innerTable";

interface Props {
	currentClass: DnDClass;
	setStartEquipChoice: (choiceNum: number, choice: Choice<Item>[]) => void;
}
const StartingEquipment: Component<Props> = (props) => {
	const allItems = useGetItems();
	const allWeapons = createMemo(()=>allItems().filter((item)=>item.equipmentCategory === "Weapon"));
	const allArmor = createMemo(()=>allItems().filter((item)=>item.equipmentCategory === "Armor"));
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
	return (
		<div>
			<h2>Starting Equipment</h2>
			<div>
				<ul style={{"list-style": "none"}}>
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
											<div style={{height: '100%'}}>
												<Table data={allItems} columns={['name', 'price']}>
													<Column name="name">
														<Header>Name</Header>
														<Cell<Item> >{(item, i)=><span title={(item.desc??[]).join('\n')}>{item.name}</span>}</Cell>
													</Column>
													<Column name="price">
														<Header>Price</Header>
														<Cell<Item>>{(item)=><span title={(item.desc??[]).join('\n')}>
															{`${item.cost.quantity} ${item.cost.unit}`}
														</span>}</Cell>
													</Column>
													<Row />
												</Table>

											</div>
											<div>
												<Button>Add Items</Button>
											</div>
										</Tab>
										<Tab name="Weapons">
											<div style={{height: '100%'}}>
												<Select transparent>
													<For each={allWeapons()}>{(item)=>(
														<Option value={item.name}>{item.name}</Option>
													)}</For>
												</Select>
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