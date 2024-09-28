import { Accessor, Component, createEffect, createMemo, createSignal, For, Setter, Show, untrack } from "solid-js";
import { Button, Input, Tabs, Tab, FormField, TextArea, Select, Option, Markdown, useGetClasses } from "../../../../../../shared";
import { Choice, Feature, FeatureTypes } from "../../../../../../models/core.model";
import styles from './featureModal.module.scss';
import Modal from "../../../../../../shared/components/popup/popup.component";
import { LevelEntity, Subclass } from "../../../../../../models/class.model";
import useGetFeatures from "../../../../../../shared/customHooks/useGetFeatures";
import { useSearchParams } from "@solidjs/router";
import { Background } from "../../../../../../models";

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
const FeatureModal:Component<FeatureModalProps> = (props) =>{
	const allFullClasses = useGetClasses();
	const allFeatures = useGetFeatures();
	
	const [featureType, setFeatureType] = createSignal<FeatureType>("");
	const [selectedFeature, setSelectedFeature] = createSignal<Feature<string, string>>({} as Feature<string, string>);
	const [newName, setNewName] = createSignal<string>("");
	const [newDesc, setNewDesc] = createSignal<string>("");
	const validate = createMemo(()=> newName().trim().length === 0  || getUnknownToString(newDesc()).trim().length === 0);
	const [classFilter, setClassFilter] = createSignal<string>('');
	const getEditIndex = createMemo(()=>props.editIndex());
	const isEdit = createMemo(()=>getEditIndex() !== -1);
	const allClasses = createMemo(()=> {
		const classes = allFeatures().filter((f)=>!!f?.info?.className);
		const uniqueClasses = new Set<string>();
		classes.forEach((c)=>uniqueClasses.add(c.info.className));
		return Array.from(uniqueClasses);
	});
	const allDisplayFeatures = createMemo(()=>{
		if(classFilter() === '') {
			return allFeatures();
		} else if (classFilter() === 'Background') {
			return allFeatures().filter((f)=>f?.info?.type === FeatureTypes.Background);
		} else if (classFilter() === 'Item') {
			return allFeatures().filter((f)=>f?.info?.type === FeatureTypes.Item);
		} else if (classFilter() === 'Feature') {
			return allFeatures().filter((f)=>f?.info?.type === FeatureTypes.Feat);
		} else {
			return allFeatures().filter((f)=>f?.info?.className === classFilter());
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
	createEffect(()=>{
		if (isEdit()) {
			// -----------------
			let feature: Feature<string, string>;
			if (!!props.currentBackground) {
				feature = {
					name: props.currentBackground.feature[getEditIndex()].name,
					value: props.currentBackground.feature[getEditIndex()].value.join('\n'),
					info: props.currentBackground.feature[getEditIndex()].info,
					choices: (props.currentBackground.feature[getEditIndex()]?.choices?.map((c)=>({...c, 
						choices: c.choices.map(ch=>ch.join('\n'))
					})))
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

	
	return (
		<Modal title="Add Feature" setClose={(value:any)=>{
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
							<FormField name="Feature Name">
								<Input type="text" transparent 
									value={newName()} 
									onInput={(e)=>setNewName(e.currentTarget.value)} />
							</FormField>
							<FormField name="Feature Description">
								<TextArea transparent text={newDesc} setText={setNewDesc} />
							</FormField>
							<Button onClick={()=>saveAndClose()} disabled={validate()}>Save</Button>
						</div>
					</Show>
					<Show when={featureType() === "existing" && !isEdit()}>
					<div class={`${styles.new}`}>
							<span>
								<Select transparent onChange={(e)=>{
									setSelectedFeature(JSON.parse(e.currentTarget.value) as Feature<string, string>)
									const name = selectedFeature().name;
									const desc = selectedFeature().value;
									console.log(name, desc, typeof desc);
									
									setNewName(selectedFeature().name);
									setNewDesc(getUnknownToString(selectedFeature().value));

								}}>
									<For each={allDisplayFeatures()}>{(feature)=>
										<Option value={JSON.stringify(feature)}>
											{feature.name} <i>{getAdditionFeatureText(feature)}</i>
									</Option>}</For>
								</Select>
								<Select transparent disableUnselected onChange={(e)=>setClassFilter(e.currentTarget.value)}>
									<Option value="">All</Option>
									<Option value="Feature">Feats</Option>
									<Option value="Item">Items</Option>
									<Option value="Background">Backgrounds</Option>
									<For each={allClasses()}>{(c)=><Option value={c}>{c}</Option>}</For>
								</Select>
								<Button onClick={()=>saveAndClose()} disabled={validate()}>Save</Button>
							</span>
							<FormField name="Feature Name">
								<Input disabled readOnly type="text" transparent 
									value={newName()} 
									onInput={(e)=>setNewName(e.currentTarget.value)} />
							</FormField>
							<Markdown text={newDesc}/>
						</div>
					</Show>
					<Show when={featureType() === "template" && !isEdit()}>
					<div class={`${styles.new}`}>
							<span>
								<Select transparent disableUnselected onChange={(e)=>{setSelectedFeature(JSON.parse(e.currentTarget.value) as Feature<string, string>)}}>
									<For each={allDisplayFeatures()}>{(feature)=>
										<Option value={JSON.stringify(feature)}>
											{feature.name} <i>{getAdditionFeatureText(feature)}</i>
									</Option>}</For>
								</Select>
								<Select transparent disableUnselected onChange={(e)=>setClassFilter(e.currentTarget.value)}>
									<Option value="">All</Option>
									<Option value="Feature">Feats</Option>
									<For each={allClasses()}>{(c)=><Option value={c}>{c}</Option>}</For>
								</Select>
								<Button onClick={(e)=>{
									setNewName(selectedFeature().name);
									setNewDesc(getUnknownToString(selectedFeature().value));
								}}>Fill Feature</Button>
								<Button onClick={()=>saveAndClose()} disabled={validate()}>Save</Button>
							</span>
							<FormField name="Feature Name">
								<Input type="text" transparent 
									value={newName()} 
									onInput={(e)=>setNewName(e.currentTarget.value)} />
							</FormField>
							<FormField name="Feature Description">
								<TextArea transparent text={newDesc} setText={setNewDesc} />
							</FormField>
							<Button onClick={()=>saveAndClose()} disabled={validate()}>Save</Button>
						</div>
					</Show>
					<Show when={isEdit()}>
						<div class={`${styles.new}`}>
							<FormField name="Feature Name">
								<Input type="text" transparent 
									value={newName()} 
									onInput={(e)=>setNewName(e.currentTarget.value)} />
							</FormField>
							<FormField name="Feature Description">
								<TextArea transparent text={newDesc} setText={setNewDesc} />
							</FormField>
							<Button onClick={()=>saveAndClose()} disabled={validate()}>Save</Button>
						</div>
					</Show>
				</div>
			</div>
		</Modal>
	);
}
export { FeatureModal };
export default FeatureModal;
