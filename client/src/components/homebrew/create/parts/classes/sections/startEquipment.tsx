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
  Body
} from "../../../../../../shared/";
import FormField from "../../../../../../shared/components/FormField/formField";
import { DnDClass } from "../../../../../../models";
import { Choice, Item } from "../../../../../../models/core.model";
import Modal from "../../../../../../shared/components/popup/popup.component";
import Tabs, { Tab } from "../../../../../../shared/components/Tabs/tabs";

interface Props {
	currentClass: DnDClass;
	setStartEquipChoice: (choiceNum: number, choice: Choice<Item>[]) => void;
}
const StartingEquipment: Component<Props> = (props) => {
	const [showChoices, setShowChoices] = createSignal(false);
	const [currentChoiceNum, setCurrentChoiceNum] = createSignal(1);
	const getChoice = (choiceNum: number) => {
		if (choiceNum === 1) return props.currentClass.startingEquipment.choice1;
		if (choiceNum === 2) return props.currentClass.startingEquipment.choice2;
		if (choiceNum === 3) return props.currentClass.startingEquipment.choice3;
		if (choiceNum === 4) return props.currentClass.startingEquipment.choice4;	
		return [];	
	};
	const addChoice = (choiceNum: number) => {
	};
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
						<Show when={showChoices()}>
							<Modal backgroundClick={[showChoices, setShowChoices]}>
								<Tabs>
									<Tab name="Items">
										<div></div>
									</Tab>
									<Tab name="Weapons">
										<div></div>
									</Tab>
									<Tab name="Armor">
										<div></div>
									</Tab>
								</Tabs>
							</Modal>	
						</Show>
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
				</ul>
			</div>
		</div>
	);
} 

export default StartingEquipment;