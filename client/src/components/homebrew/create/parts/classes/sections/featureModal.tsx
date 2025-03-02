import { Accessor, Component, createEffect, createMemo, createSignal, For, Match, Setter, Show, Switch, untrack } from "solid-js";
import { Button, Input, Tabs, Tab, FormField, TextArea, Select, Option, Markdown, useGetClasses, ExpansionPanel, isNullish } from "../../../../../../shared";
import { AbilityScores, ChangeSubTypes, CharacterChange, CharacterChangeTypes, Choice, Feature, FeatureTypes, Info, MovementTypes, TypeRestrictions } from "../../../../../../models/core.model";
import styles from './featureModal.module.scss';
import Modal from "../../../../../../shared/components/popup/popup.component";
import { LevelEntity, Subclass } from "../../../../../../models/class.model";
import useGetFeatures from "../../../../../../shared/customHooks/useGetFeatures";
import { useSearchParams } from "@solidjs/router";
import { Background, Item, Race } from "../../../../../../models";
import { p, S } from "@vite-pwa/assets-generator/shared/assets-generator.5e51fd40";
import CharacterChanges from "./characterChanges";
import { Subrace } from "../../../../../../models/race.model";

type FeatureType = 'new' | 'existing' | 'template' | '';

interface FeatureModalProps {
	addFeature: (level: number, feature: Feature<string, string>) => void;
	replaceFeature: (level: number, index: number, feature: Feature<string, string>) => void;
	currentLevel: LevelEntity;
	currentSubclass?: Subclass;
	currentBackground?: Background;
	currentRace?: Race;
	currentItem?: Item;
	currentSubrace?: Subrace;
	showFeature: Accessor<boolean>;
	setShowFeature: Setter<boolean>;
	editIndex: Accessor<number>;
	setEditIndex: Setter<number>;
}
const FeatureModal: Component<FeatureModalProps> = (props) => {
	const allFullClasses = useGetClasses();
	const allFeatures = useGetFeatures();
	// -------- Signals --------
	const [featureType, setFeatureType] = createSignal<FeatureType>("");
	const [selectedFeature, setSelectedFeature] = createSignal<Feature<string, string>>({} as Feature<string, string>);
	const [newName, setNewName] = createSignal<string>("");
	const [newDesc, setNewDesc] = createSignal<string>("");
	const [classFilter, setClassFilter] = createSignal<string>('');
	const [selectedChangeType, setSelectedChangeType] = createSignal<CharacterChangeTypes>();
	const [selectedSubType, setSelectedSubType] = createSignal<ChangeSubTypes>();
	const [selectedRestriction, setSelectedRestriction] = createSignal<TypeRestrictions>();
	const [selectedValue, setSelectedValue] = createSignal<number>();
	const [selectedDieSize, setSelectedDieSize] = createSignal<number>();
	const [selectedStat, setSelectedStat] = createSignal<AbilityScores>();
	const [selectedSet, setSelectedSet] = createSignal<number>();
	const [characterChanges, setCharacterChanges] = createSignal<CharacterChange[]>([]);

	// ------- Memoized Values -------
	const getEditIndex = createMemo(() => props.editIndex());
	const isEdit = createMemo(() => getEditIndex() !== -1);
	const validate = createMemo(() => newName().trim().length === 0 || getUnknownToString(newDesc()).trim().length === 0);
	const allClasses = createMemo(() => {
		const classes = allFeatures().filter((f) => !!f?.info?.className);
		const uniqueClasses = new Set<string>();
		classes.forEach((c) => uniqueClasses.add(c.info.className));
		return Array.from(uniqueClasses);
	});
	const allDisplayFeatures = createMemo(() => {
		if (classFilter() === '') {
			return allFeatures();
		} else if (classFilter() === 'Background') {
			return allFeatures().filter((f) => f?.info?.type === FeatureTypes.Background);
		} else if (classFilter() === 'Item') {
			return allFeatures().filter((f) => f?.info?.type === FeatureTypes.Item);
		} else if (classFilter() === 'Feature') {
			return allFeatures().filter((f) => f?.info?.type === FeatureTypes.Feat);
		} else {
			return allFeatures().filter((f) => f?.info?.className === classFilter());
		}
	})

	// -------- Functions --------
	const back = () => {
		setFeatureType("");
		setNewName("");
		setNewDesc("");
	}
	const saveAndClose = () => {
		let level = 0;
		switch (true) {
			case !!props?.currentSubclass:
				level = props.currentLevel.level;
				break;
			case !!props?.currentBackground:
				level = 0;
				break;
			case !isNullish(props.currentLevel?.level):
				level = props.currentLevel.level;
				break;
			case !isNullish(props.currentRace):
				level = 0;
				break;
			case !isNullish(props.currentItem):
				level = 0;
				break;
			case !isNullish(props.currentSubclass):
				level = props.currentLevel.level;
				break;
			default:
				break;
		}

		if (isEdit()) {
			props.replaceFeature(level, getEditIndex(), {
				name: untrack(newName),
				value: untrack(newDesc),
				info: buildInfo(),
				metadata: {
					changes: characterChanges()
				}
			});
		} else {
			props.addFeature(level, {
				name: untrack(newName),
				value: untrack(newDesc),
				info: buildInfo(),
				metadata: {
					changes: characterChanges()
				}
			});
		}
		props.setShowFeature(false);
		props.setEditIndex(-1);
	}

	const getUnknownToString = (value: unknown) => {
		if (typeof value === 'string') {
			return value;
		} else if (Array.isArray(value)) {
			return value.join('\n');
		} else {
			return '';
		}
	}
	const getAdditionFeatureText = (feature: Feature<string, string>) => {
		const featureInfo = feature.info;
		if (!!featureInfo) {
			if (!!featureInfo.subclassName && !!featureInfo.className) {
				return `(${feature.info.subclassName} ${featureInfo.className})`;
			} else if (!!featureInfo.className) {
				return `(${featureInfo.className})`;
			} else if (featureInfo.type !== null || featureInfo.type !== undefined) {
				return `(${FeatureTypes[featureInfo.type]})`;
			}
		};
		return '';
	};

	const buildInfo = (): Info<string> => {
		const currentInfo: Info<string> = {
			className: "",
			subclassName: "",
			level: 0,
			type: FeatureTypes.Class,
			other: ""
		};
		switch (true) {
			case !!props?.currentSubclass:
				currentInfo.className = props.currentSubclass.class;
				currentInfo.subclassName = props.currentSubclass.name;
				currentInfo.type = FeatureTypes.Subclass;
				break;
			case !!props?.currentBackground:
				currentInfo.type = FeatureTypes.Background;
				break;
			case !isNullish(props.currentLevel) && !!props.currentLevel?.info?.className:
				currentInfo.className = props.currentLevel.info.className;
				currentInfo.subclassName = props.currentLevel.info.subclassName;
				currentInfo.level = props.currentLevel.level;
				break;
			case !isNullish(props.currentRace):
				currentInfo.type = FeatureTypes.Race;
				break;

			case !isNullish(props.currentItem):
				currentInfo.type = FeatureTypes.Item

			case !isNullish(props.currentSubclass):
				currentInfo.type = FeatureTypes.Subrace
			default:
				break;
		}

		return currentInfo;
	};

	const differentChangeTypes = [CharacterChangeTypes.UseNumber, CharacterChangeTypes.Spell, CharacterChangeTypes.SpellSlot, undefined];
	const showOtherChangeType = () => !differentChangeTypes.includes(selectedChangeType()) && (selectedChangeType() ?? -1) > -1;

	// ----------------- Effects -----------------
	createEffect(() => {
		if (isEdit()) {
			// -----------------
			let feature: Feature<string, string>;
			switch (true) {
				case !!props?.currentSubclass:
					feature = props.currentSubclass.features[getEditIndex()];
					break;
				case !!props?.currentBackground:
					feature = {
						name: props.currentBackground.feature[getEditIndex()].name,
						value: props.currentBackground.feature[getEditIndex()].value.join('\n'),
						info: props.currentBackground.feature[getEditIndex()].info,
						choices: (props.currentBackground.feature[getEditIndex()]?.choices?.map((c) => ({
							...c,
							choices: c.choices.map(ch => ch.join('\n'))
						}))),
						metadata: {
							...props.currentBackground.feature[getEditIndex()]?.metadata,
							changes: props.currentBackground.feature[getEditIndex()]?.metadata?.changes ?? []
						} 
					};
					break;
				case !!props.currentRace:
					feature = {
						name: props.currentRace.traits[getEditIndex()]?.name ?? '',
						value: props.currentRace.traits[getEditIndex()].value.join('\n'),
						info: props.currentRace.traits[getEditIndex()].info,
						choices: (props.currentRace.traits[getEditIndex()]?.choices?.map((c) => ({
							...c,
							choices: c.choices.map(ch => ch.join('\n'))
						}))),
						metadata: {
							...props.currentRace.traits[getEditIndex()]?.metadata,
							changes: props.currentRace.traits[getEditIndex()]?.metadata?.changes ?? []
						}   
					}
					break;

				case !!props.currentItem:
					feature = {
						name: (props.currentItem.features ?? [])[getEditIndex()]?.name ?? '',
						value: (props.currentItem.features ?? [])[getEditIndex()]?.value,
						info: (props.currentItem.features ?? [])[getEditIndex()]?.info,
						choices: ((props.currentItem.features ?? [])[getEditIndex()]?.choices?.map((c) => ({
							...c,
							choices: c.choices.map(ch => ch)
						}))),
						metadata: {
							...(props.currentItem.features ?? [])[getEditIndex()]?.metadata,
							changes: (props.currentItem.features ?? [])[getEditIndex()]?.metadata.changes ?? []
						}
					}
					break;
				case !!props.currentSubclass:
					feature = {
						name: (props.currentSubrace?.traits ?? [])[getEditIndex()]?.name ??'',
						value: (props.currentSubrace?.traits ?? [])[getEditIndex()]?.value.join(`\n`) ?? '',
						info: (props.currentSubrace?.traits ?? [])[getEditIndex()]?.info,
						choices: (props.currentSubrace?.traits ?? [])[getEditIndex()]?.choices?.map((c) => ({
							...c,
							choices: c.choices.map(ch=> ch.join(`\n`))
						})),
						metadata: {
							...(props.currentSubrace?.traits ?? [])[getEditIndex()]?.metadata,
							changes: (props.currentSubrace?.traits ?? [])[getEditIndex()]?.metadata.changes
						}
					}
				default:
					feature = props.currentLevel.features[getEditIndex()];
					break;
			}

			setNewName(feature.name);
			setNewDesc(getUnknownToString(feature.value));
		}
	})
	// ----------------- Return -----------------
	return (
		<Modal title="Add Feature" setClose={(value: any) => {
			props.setEditIndex(-1);
			return props.setShowFeature(value);
		}}>
			<div class={`${styles.container}`}>
				<div class={`${styles.top}`}>
					<Show when={featureType() !== ''}>
						<Button onClick={back}>←</Button>
					</Show>
					<h3>Level {props.currentLevel.level} Features</h3>
				</div>
				<div class={`${styles.body}`}>
					<Show when={featureType() === "" && !isEdit()}>
						<div>
							<Button onClick={(e) => {
								setFeatureType("new");
							}}>New Feature</Button>
							<Button onClick={() => setFeatureType("existing")}>Existing Feature</Button>
						</div>
					</Show>
					<Show when={featureType() === "new" && !isEdit()}>
						<div class={`${styles.new}`}>
							<CharacterChanges
								characterChanges={characterChanges}
								setCharacterChanges={setCharacterChanges}
								selectedChangeType={selectedChangeType}
								setSelectedChangeType={setSelectedChangeType}
								selectedSubType={selectedSubType}
								setSelectedSubType={setSelectedSubType}
								selectedRestriction={selectedRestriction}
								setSelectedRestriction={setSelectedRestriction}
								selectedValue={selectedValue}
								setSelectedValue={setSelectedValue}
								selectedDieSize={selectedDieSize}
								setSelectedDieSize={setSelectedDieSize}
								selectedStat={selectedStat}
								setSelectedStat={setSelectedStat}
								selectedSet={selectedSet}
								setSelectedSet={setSelectedSet}
								showOtherChangeType={showOtherChangeType}
							/>
							<div class={`${styles.formField}`}>
								<FormField name="Feature Name">
									<Input type="text" transparent
										value={newName()}
										onInput={(e) => setNewName(e.currentTarget.value)} />
								</FormField>
							</div>
							<div class={`${styles.formField}`}>
								<FormField name="Feature Description">
									<TextArea transparent text={newDesc} setText={setNewDesc} />
								</FormField>
							</div>
							<Button onClick={() => saveAndClose()} disabled={validate()}>Save</Button>
						</div>
					</Show>
					<Show when={featureType() === "existing" && !isEdit()}>
						<div class={`${styles.new}`}>
							<span>
								<Select transparent onChange={(e) => {
									setSelectedFeature(JSON.parse(e.currentTarget.value) as Feature<string, string>)
									setNewName(selectedFeature().name);
									setNewDesc(getUnknownToString(selectedFeature().value));
								}}>
									<For each={allDisplayFeatures()}>{(feature) =>
										<Option value={JSON.stringify(feature)}>
											{feature.name} <i>{getAdditionFeatureText(feature)}</i>
										</Option>}</For>
								</Select>
								<Select transparent disableUnselected onChange={(e) => setClassFilter(e.currentTarget.value)}>
									<Option value="">All</Option>
									<Option value="Feature">Feats</Option>
									<Option value="Item">Items</Option>
									<Option value="Background">Backgrounds</Option>
									<For each={allClasses()}>{(c) => <Option value={c}>{c}</Option>}</For>
								</Select>
								<Button onClick={() => saveAndClose()} disabled={validate()}>Save</Button>
							</span>
							<FormField name="Feature Name">
								<Input disabled readOnly type="text" transparent
									value={newName()}
									onInput={(e) => setNewName(e.currentTarget.value)} />
							</FormField>
							<Markdown text={newDesc} />
						</div>
					</Show>
					<Show when={featureType() === "template" && !isEdit()}>
						<div class={`${styles.new}`}>
							<span>
								<Select transparent disableUnselected onChange={(e) => { setSelectedFeature(JSON.parse(e.currentTarget.value) as Feature<string, string>) }}>
									<For each={allDisplayFeatures()}>{(feature) =>
										<Option value={JSON.stringify(feature)}>
											{feature.name} <i>{getAdditionFeatureText(feature)}</i>
										</Option>}</For>
								</Select>
								<Select transparent disableUnselected onChange={(e) => setClassFilter(e.currentTarget.value)}>
									<Option value="">All</Option>
									<Option value="Feature">Feats</Option>
									<For each={allClasses()}>{(c) => <Option value={c}>{c}</Option>}</For>
								</Select>
								<Button onClick={(e) => {
									setNewName(selectedFeature().name);
									setNewDesc(getUnknownToString(selectedFeature().value));
								}}>Fill Feature</Button>
								<Button onClick={() => saveAndClose()} disabled={validate()}>Save</Button>
							</span>
							<FormField name="Feature Name">
								<Input type="text" transparent
									value={newName()}
									onInput={(e) => setNewName(e.currentTarget.value)} />
							</FormField>
							<FormField name="Feature Description">
								<TextArea transparent text={newDesc} setText={setNewDesc} />
							</FormField>
							<Button onClick={() => saveAndClose()} disabled={validate()}>Save</Button>
						</div>
					</Show>
					<Show when={isEdit()}>
						<div class={`${styles.new}`}>
						<CharacterChanges
								characterChanges={characterChanges}
								setCharacterChanges={setCharacterChanges}
								selectedChangeType={selectedChangeType}
								setSelectedChangeType={setSelectedChangeType}
								selectedSubType={selectedSubType}
								setSelectedSubType={setSelectedSubType}
								selectedRestriction={selectedRestriction}
								setSelectedRestriction={setSelectedRestriction}
								selectedValue={selectedValue}
								setSelectedValue={setSelectedValue}
								selectedDieSize={selectedDieSize}
								setSelectedDieSize={setSelectedDieSize}
								selectedStat={selectedStat}
								setSelectedStat={setSelectedStat}
								selectedSet={selectedSet}
								setSelectedSet={setSelectedSet}
								showOtherChangeType={showOtherChangeType}
							/>
							<FormField name="Feature Name">
								<Input type="text" transparent
									value={newName()}
									onInput={(e) => setNewName(e.currentTarget.value)} />
							</FormField>
							<FormField name="Feature Description">
								<TextArea transparent text={newDesc} setText={setNewDesc} />
							</FormField>
							<Button onClick={() => saveAndClose()} disabled={validate()}>Save</Button>
						</div>
					</Show>
				</div>
			</div>
		</Modal>
	);
}
export { FeatureModal };
export default FeatureModal;
