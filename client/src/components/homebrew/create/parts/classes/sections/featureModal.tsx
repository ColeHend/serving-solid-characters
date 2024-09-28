import { Accessor, Component, createEffect, createMemo, createSignal, For, Match, Setter, Show, Switch, untrack } from "solid-js";
import { Button, Input, Tabs, Tab, FormField, TextArea, Select, Option, Markdown, useGetClasses, ExpansionPanel } from "../../../../../../shared";
import { AbilityScores, ChangeSubTypes, CharacterChangeTypes, Choice, Feature, FeatureTypes, MovementTypes, TypeRestrictions } from "../../../../../../models/core.model";
import styles from './featureModal.module.scss';
import Modal from "../../../../../../shared/components/popup/popup.component";
import { LevelEntity, Subclass } from "../../../../../../models/class.model";
import useGetFeatures from "../../../../../../shared/customHooks/useGetFeatures";
import { useSearchParams } from "@solidjs/router";
import { Background } from "../../../../../../models";
import { S } from "@vite-pwa/assets-generator/shared/assets-generator.5e51fd40";

type FeatureType = 'new' | 'existing' | 'template' | '';

interface FeatureModalProps {
	addFeature: (level: number, feature: Feature<string, string>) => void;
	replaceFeature: (level: number, index: number, feature: Feature<string, string>) => void;
	currentLevel: LevelEntity;
	currentSubclass?: Subclass;
	currentBackground?: Background;
	showFeature: Accessor<boolean>;
	setShowFeature: Setter<boolean>;
	editIndex: Accessor<number>;
	setEditIndex: Setter<number>;
}
const FeatureModal: Component<FeatureModalProps> = (props) => {
	const allFullClasses = useGetClasses();
	const allFeatures = useGetFeatures();

	const [featureType, setFeatureType] = createSignal<FeatureType>("");
	const [selectedFeature, setSelectedFeature] = createSignal<Feature<string, string>>({} as Feature<string, string>);
	const [newName, setNewName] = createSignal<string>("");
	const [newDesc, setNewDesc] = createSignal<string>("");
	const validate = createMemo(() => newName().trim().length === 0 || getUnknownToString(newDesc()).trim().length === 0);
	const [classFilter, setClassFilter] = createSignal<string>('');
	const [selectedChangeType, setSelectedChangeType] = createSignal<CharacterChangeTypes>();
	const [selectedSubType, setSelectedSubType] = createSignal<ChangeSubTypes>();
	const [selectedRestriction, setSelectedRestriction] = createSignal<TypeRestrictions>();
	const [selectedAbilityScore, setSelectedAbilityScore] = createSignal<AbilityScores>();
	const [selectedValue, setSelectedValue] = createSignal<number>();
	const [selectedDieSize, setSelectedDieSize] = createSignal<number>();
	const [selectedStat, setSelectedStat] = createSignal<AbilityScores>();
	const [selectedSet, setSelectedSet] = createSignal<number>();
	const getEditIndex = createMemo(() => props.editIndex());
	const isEdit = createMemo(() => getEditIndex() !== -1);
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
	const back = () => {
		setFeatureType("");
		setNewName("");
		setNewDesc("");
	}
	const saveAndClose = () => {
		let className = '';
		let subclassName = '';
		let level = 0;
		let type = FeatureTypes.Class;
		if (!!props.currentSubclass) {
			className = props.currentSubclass.class;
			subclassName = props.currentSubclass.name;
			level = props.currentLevel.level;
			type = FeatureTypes.Subclass;
		} else if (!!props.currentBackground) {
			level = 0;
			type = FeatureTypes.Background;

		} else {
			className = props.currentLevel.info?.className;
			subclassName = props.currentLevel.info?.subclassName;
			level = props.currentLevel?.level;
		}

		if (isEdit()) {
			props.replaceFeature(level, getEditIndex(), {
				name: untrack(newName),
				value: untrack(newDesc),
				info: {
					className,
					subclassName,
					level,
					type,
					other: ''
				},
				metadata: {
					changes: []
				}
			});
		} else {
			props.addFeature(level, {
				name: untrack(newName),
				value: untrack(newDesc),
				info: {
					className,
					subclassName,
					level,
					type,
					other: ''
				},
				metadata: {
					changes: []
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
	createEffect(() => {
		if (isEdit()) {
			// -----------------
			let feature: Feature<string, string>;
			if (!!props.currentBackground) {
				feature = {
					name: props.currentBackground.feature[getEditIndex()].name,
					value: props.currentBackground.feature[getEditIndex()].value.join('\n'),
					info: props.currentBackground.feature[getEditIndex()].info,
					choices: (props.currentBackground.feature[getEditIndex()]?.choices?.map((c) => ({
						...c,
						choices: c.choices.map(ch => ch.join('\n'))
					}))),
					metadata: props.currentBackground.feature[getEditIndex()].metadata
				};
			} else if (!!props.currentSubclass) {
				feature = props.currentSubclass.features[getEditIndex()];
			} else {
				feature = props.currentLevel.features[getEditIndex()];
			}

			setNewName(feature.name);
			setNewDesc(getUnknownToString(feature.value));
		}
	})

	const differentChangeTypes = [CharacterChangeTypes.UseNumber, CharacterChangeTypes.Spell, CharacterChangeTypes.SpellSlot, undefined];
	const showOtherChangeType = () => !differentChangeTypes.includes(selectedChangeType()) && (selectedChangeType() ?? -1) > -1;

	const disableAddCharacterChange = () => {
		if (selectedChangeType() === undefined) return true;
		switch (selectedChangeType()) {
			case CharacterChangeTypes.Spell:
				return false;
			case CharacterChangeTypes.SpellSlot:
				return false;
			case CharacterChangeTypes.AbilityScore:
				return selectedSubType() === undefined;
			case CharacterChangeTypes.AC:
				return selectedSubType() === undefined;
			case CharacterChangeTypes.AttackRoll:
				return selectedSubType() === undefined;
			case CharacterChangeTypes.Initiative:
				return selectedSubType() === undefined;
			case CharacterChangeTypes.Save:
				return selectedSubType() === undefined;
			case CharacterChangeTypes.SpellSlot:
				return selectedSubType() === undefined;
			default:
				return selectedSubType() === undefined;
		}
	}

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
							<div style={{border: '1px solid', 'border-radius':'10px'}}>
								<div >
									<ExpansionPanel arrowSize={{width:'35px', height:'35px'}} style={{height:'min-content'}}>
										<div>Character Changes</div>
										<div>
											<div>
												<label>Change Type</label>
												<Select transparent
													onChange={(e) => setSelectedChangeType(Number(e.currentTarget.value) as CharacterChangeTypes)}
													value={selectedChangeType()}
												>
													<For each={Object.keys(CharacterChangeTypes).filter((k) => !isNaN(Number(k)))}>{(changeType) => <>
														<Option value={changeType}>{CharacterChangeTypes[Number(changeType)]}</Option>
													</>}</For>
												</Select>
												<Show when={selectedChangeType() === CharacterChangeTypes.Speed}>
													<Select transparent>
														<For each={Object.keys(MovementTypes).filter((k) => !isNaN(Number(k)))}>{(changeType) => 
															<Option value={changeType}>{MovementTypes[Number(changeType)]}</Option>
														}</For>
													</Select>
												</Show>
											</div>
											<Show when={selectedChangeType() === CharacterChangeTypes.Spell}>
												<span>

												</span>
											</Show>
											<Show when={selectedChangeType() === CharacterChangeTypes.SpellSlot}>
												<span>

												</span>
											</Show>
											<Show when={showOtherChangeType()}>
												<div>
													<label>Sub Type</label>
													<Select transparent
														onChange={(e) => setSelectedSubType(Number(e.currentTarget.value) as ChangeSubTypes)}
														value={selectedSubType()}
													>
														<For each={Object.keys(ChangeSubTypes).filter((k) => !isNaN(Number(k)))}>{(changeType) => <>
															<Option value={changeType}>{ChangeSubTypes[Number(changeType)]}</Option>
														</>}</For>
													</Select>
													<Show when={selectedSubType() === ChangeSubTypes.Die}>
														<Select transparent disableUnselected>
															<For each={[4, 6, 8, 10, 12, 20]}>{(dieSize) => <>
																<Option value={dieSize}>d{dieSize}</Option>
															</>}</For>
														</Select>
													</Show>
													<Show when={selectedSubType() === ChangeSubTypes.Set}>
														<Input type="number" transparent  style={{
															width: '75px',
															'border-bottom': '1px solid',
														}}/>
													</Show>
													<Show when={selectedSubType() === ChangeSubTypes.Stat}>
														<Select transparent>
															<For each={Object.keys(AbilityScores).filter((k) => !isNaN(Number(k)))}>{(changeType) => <>
																<Option value={changeType}>{AbilityScores[Number(changeType)]}</Option>
															</>}</For>
														</Select>
													</Show>
													<Show when={selectedSubType() === ChangeSubTypes.SetAndDie}>
														<Input type="number" transparent style={{
															width: '75px',
															'border-bottom': '1px solid',
														}}/>
														<Select transparent disableUnselected>
															<For each={[4, 6, 8, 10, 12, 20]}>{(dieSize) => <>
																<Option value={dieSize}>d{dieSize}</Option>
															</>}</For>
														</Select>
													</Show>
												</div>
												<div>
													<label>Restriction</label>
													<Select transparent>
														<For each={Object.keys(TypeRestrictions).filter((k) => !isNaN(Number(k)))}>{(changeType) => <>
															<Option value={changeType}>{TypeRestrictions[Number(changeType)]}</Option>
														</>}</For>
													</Select>
												</div>
											</Show>
											<Button disabled={disableAddCharacterChange()}>Add</Button>
										</div>
									</ExpansionPanel>
									<div>
										<h4>Feature Changes</h4>
										<div>

										</div>
									</div>
								</div>
								
							</div>
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
