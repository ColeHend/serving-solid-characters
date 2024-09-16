import { Accessor, Component, createMemo, createSignal, For, JSX, Setter, Show, useContext } from "solid-js";
import FeatureTable from "./featureTable/featureTable";
import Carousel from "../../Carosel/Carosel";
import ExpansionPanel from "../../expansion/expansion";
import { DnDClass, Subclass } from "../../../../models/class.model";
import { useSearchParams } from "@solidjs/router";
import { effect } from "solid-js/web";
import { SharedHookContext } from "../../../../components/rootApp";
import useGetClasses from "../../../customHooks/data/useGetClasses";
import getUserSettings from "../../../customHooks/userSettings";
import useStyles from "../../../../shared/customHooks/utility/style/styleHook";
import styles from "./classModal.module.scss";
import Paginator from "../../paginator/paginator";
import { Feature } from "../../../../models/core.model";
import Modal from "../../popup/popup.component";
import ChipType from "../../../models/chip";
import SubclassModal from "./subclassModal.component";
import Chipbar from "../../Chipbar/chipbar";
import Tabs, { Tab } from "../../Tabs/tabs";

type props = {
	currentClass: Accessor<DnDClass>;
	boolean: Accessor<boolean>;
	booleanSetter: Setter<boolean>;
}

const ClassModal: Component<props> = (props) => {
	const sharedHooks = useContext(SharedHookContext);
	const [userSettings, setUserSettings] = getUserSettings();
	const stylin = createMemo(() => useStyles(userSettings().theme));
	const [paginatedFeatures, setPaginatedFeatures] = createSignal<Feature<unknown, string>[]>([]);
	const [equipChips, setEquipChips] = createSignal<ChipType[]>([{ key: "test", value: 'test' }]);


	const currentSubclasses = createMemo(() => props.currentClass().subclasses?.length > 0 ? props.currentClass().subclasses : [] as Subclass[])

	const allFeatures = createMemo(() => props.currentClass().classLevels.map(x => x.features).flat())
	// props to pass in
	// the current class

	const getEquipmentChoice = (choiceNum: 1 | 2 | 3 | 4) => {
		return props.currentClass()?.startingEquipment?.[`choice${choiceNum}`];
	}

	return (
		<Modal width="85%" height="90%" title={props.currentClass().name} backgroundClick={[props.boolean, props.booleanSetter]}>
			<div class={`${stylin()?.primary} ${styles.CenterPage}`}>
				<div class={`${styles.eachPage}`}>

					<h1>{props.currentClass().name}</h1>

					{/* the feature table */}
					<div>
						<FeatureTable Class={() => props.currentClass()} />
					</div>

					<div class={`${styles.tabBar}`}>
						<Tabs transparent>
							<Tab name="Proficiencies">
								<span class={`${styles.left} ${styles.flexBoxColumn}`}>
									<span>
										Armor: {props.currentClass().proficiencies.filter(x => x.toLowerCase().includes("armor")).join(", ")}
									</span>
									<span>
										<Show when={!!props.currentClass().proficiencies.filter(x => x.toLowerCase() === "shields").length}>
											, Shields
										</Show>
									</span>

									<span>Weapons: {props.currentClass().proficiencies.filter(x => x.toLowerCase().includes("weapons")).join(", ")} </span>

									<span>
										Tools:
										{/* I give up! heres my fix ↓ */}
										{/* if you want a tool to show up without the None */}
										<Show when={!props.currentClass().proficiencies.map(x => x.toLowerCase()).includes("tools") && !props.currentClass().proficiencies.map(x => x.toLowerCase()).includes("kit")}>
											None
										</Show>
										<Show when={!props.currentClass().proficiencies.map(x => x.toLowerCase()).includes("kit")}>
											{props.currentClass().proficiencies.filter(x => x.toLowerCase().includes("kit"))}
										</Show>
										<Show when={!props.currentClass().proficiencies.map(x => x.toLowerCase()).includes("tools")}>
											{props.currentClass().proficiencies.filter(x => x.toLowerCase().includes("tools")).join(", ")}
										</Show>

									</span>

									<span>
										Saving Throws: {props.currentClass().savingThrows.join(", ")}
									</span>
								</span>
							</Tab>
							<Tab name="Skills" >
								<div>
									<Show when={props.currentClass().proficiencyChoices.length > 0}>
										<For each={props.currentClass().proficiencyChoices}>
											{(Choice) =>
												<>
													<br />

													<span>Choose: {Choice.choose}</span>

													<br />

													<For each={Choice.choices}>
														{(choice) =>
															<>
																<span>{choice}</span>
																<br />
															</>
														}
													</For>
												</>
											}
										</For>
									</Show>

								</div>
							</Tab>
							<Tab name="Starting Equipment">
								<div>
									sorry nouthing here yet...  (╯︵╰,)
								</div>
							</Tab>
							<Tab name="Subclasses">
								<div class={`${styles.subClasses}`}>
									<For each={currentSubclasses()}>{(subclass) => (
										<SubclassModal subclass={subclass} />
									)}</For>
								</div>
							</Tab>
						</Tabs>
					</div>



				</div>

			</div>
		</Modal>

	)
}
export default ClassModal;




