import { Accessor, Component, createEffect, createMemo, createSignal, For, Setter, Show, untrack } from "solid-js";
import { Button, Input, Tabs, Tab, FormField, TextArea, Select, Option, Markdown } from "../../../../../../shared";
import { Feature } from "../../../../../../models/core.model";
import styles from './featureModal.module.scss';
import Modal from "../../../../../../shared/components/popup/popup.component";
import { LevelEntity } from "../../../../../../models/class.model";
import useGetFeatures from "../../../../../../shared/customHooks/useGetFeatures";

type FeatureTypes = 'new' | 'existing' | 'template' | '';

interface FeatureModalProps {
	addFeature: (level: number, feature: Feature<unknown, string>) => void;
	replaceFeature: (level: number, index: number, feature: Feature<unknown, string>) => void;
	currentLevel: LevelEntity;
	showFeature: Accessor<boolean>;
	setShowFeature: Setter<boolean>;
	editIndex: Accessor<number>;
	setEditIndex: Setter<number>;
}
const FeatureModal:Component<FeatureModalProps> = (props) =>{
	const allFeatures = useGetFeatures();
	const [featureType, setFeatureType] = createSignal<FeatureTypes>("");
	const [selectedFeature, setSelectedFeature] = createSignal<Feature<unknown, string>>({} as Feature<unknown, string>);
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
		if (isEdit()) {
			props.replaceFeature(props.currentLevel.level, getEditIndex(), {
				name: untrack(newName),
				value: untrack(newDesc),
				info: {
					className: props.currentLevel.info.className,
					subclassName: props.currentLevel.info.subclassName,
					level: props.currentLevel.info.level,
					type: 'Feature',
					other: ''
				}
			});
		} else {
			props.addFeature(props.currentLevel.info.level, {
				name: untrack(newName),
				value: untrack(newDesc),
				info: {
					className: props.currentLevel.info.className,
					subclassName: props.currentLevel.info.subclassName,
					level: props.currentLevel.info.level,
					type: 'Feature',
					other: ''
				}
			});
		}
		props.setShowFeature(false);
		props.setEditIndex(-1);
	}
	console.log(props.currentLevel);
	const getUnknownToString = (value: unknown) => {
		if (typeof value === 'string') {
			return value;
		} else if (Array.isArray(value)) {
			return value.join('\n');
		} else {
			return '';
		}
	}
	const getAdditionFeatureText = (feature: Feature<unknown, string>) => {
		const featureInfo = feature.info;
		if (!!featureInfo) {
			if (!!featureInfo.subclassName && !!featureInfo.className) {
				return `(${feature.info.subclassName} ${featureInfo.className})`;
			} else if (!!featureInfo.className) {
				return `(${featureInfo.className})`;
			} else if (!!featureInfo.type) {
				return `(${featureInfo.type})`;
			}
		};
		return '';
	};
	createEffect(()=>{
		if (isEdit()) {
			const feature = props.currentLevel.features[getEditIndex()];
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
								<Select transparent disableUnselected onChange={(e)=>{
									setSelectedFeature(JSON.parse(e.currentTarget.value) as Feature<unknown, string>)
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
								<Select transparent disableUnselected onChange={(e)=>{setSelectedFeature(JSON.parse(e.currentTarget.value) as Feature<unknown, string>)}}>
									<For each={allDisplayFeatures()}>{(feature)=>
										<Option value={JSON.stringify(feature)}>
											{feature.name} <i>{getAdditionFeatureText(feature)}</i>
									</Option>}</For>
								</Select>
								<Select transparent disableUnselected onChange={(e)=>setClassFilter(e.currentTarget.value)}>
									<Option value="">All</Option>
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
