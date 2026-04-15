import { Button, FormField, Input, Modal, FormArray, FormGroup, TextArea, Form, Option, Select } from "coles-solid-library";
import { Accessor, Component, createEffect, createMemo, createSignal, For, Match, onCleanup, Setter, Show, Switch } from "solid-js";
import { MadFeature, MadType } from "../../../../shared/customHooks/mads/madModels";
import { FeatureDetail, FeatureMetadata } from "../../../../models/generated";
import { FlatCard } from "../../../../shared/components/flatCard/flatCard";
import { MadFeature as GeneratedModel } from "../../../../models/generated";
import styles from "./featuresPopus.module.scss";
import { MadForm } from "../../../../models/data/formModels";
import { SpellFeature } from "./parts/spellFeature/spellFeature";
import { useDnDSpells } from "../../../../shared/customHooks/dndInfo/info/all/spells";
import { DebugConsole } from "../../../../shared/customHooks/DebugConsole";
import { Clone } from "../../../../shared";
interface popupProps {
    Show: [Accessor<boolean>, Setter<boolean>];
    feature: [Accessor<FeatureDetail>, Setter<FeatureDetail>];
    onClose?: (data: FeatureDetail) => void;
    isEdit: Accessor<boolean>;
}

export const FeaturesPopup: Component<popupProps> = (props) => {
    const [show, setShow] = props.Show;
    const [feature, setFeature] = props.feature;
    const [popupRef,setPopupRef] = createSignal<HTMLElement|null>(null);

    const is_edit = createMemo(()=>props.isEdit());
    const allSpells = useDnDSpells();

    const currentFeatureMetadata = new FormArray<MadForm>([]);

    const currentMadsLength = createMemo(()=>currentFeatureMetadata.get().length);

    const addNewMetadata = () => {
        const newMetadata = new FormGroup<MadForm>({
            name: [`change ${currentMadsLength() + 1}`, []],
            command: ['', []],
            value: [{}, []],
            type: [0, []],
            prerequisites: [[], []],
            group: [0, []],
            commandCategory: ['', [ ]],
            commandType: ['', []]
        })

        currentFeatureMetadata.add(newMetadata);
    }

    const save = () => {
        const name = getFeatureValue('name')();
        const desc = getFeatureValue('description')();

        const madsData:MadFeature[] = currentFeatureMetadata.get().flatMap(metadata => {
            return {
                command: metadata.command,
                value: metadata.value,
                type: metadata.type,
                prerequisites: metadata.prerequisites,
                group: metadata.group
            }
        });
        
        const newFeature: FeatureDetail = {
            name: name,
            description: desc,
            metadata: {
                uses: 0,
                recharge: "",
                spells: [],
                category: "",
                mads: madsData as GeneratedModel[],
            }
        }

        setFeature(newFeature);
        clearInputs();
        setShow(false);
        if (props.onClose) {
            props.onClose(newFeature);
        }
    }

    const clearInputs = () => {
        setFeature({
            name: "",
            description: ""
        })
        currentFeatureMetadata.reset();
    }

    const getFeatureValue = <T extends keyof FeatureDetail >(key: T): Accessor<FeatureDetail[T]> => {
        const Feature = feature();
        
        const clone = structuredClone(Feature);

        return createMemo(() => clone[key]);
    }

    const setFeatureValue = <T extends keyof FeatureDetail >(key: T, value: FeatureDetail[T]) => {
        const Feature = feature();
        
        if (typeof value === "string") {
            Feature[key] = value;
        } else if (typeof value === "object" && key === "metadata") {
            const val: FeatureMetadata = value;

            Feature['metadata'] = val;
        }

        setFeature(structuredClone(Feature));
    }

    const getMadFeature = <T extends keyof MadForm>(key: T, index: number) => {
        const MadFeature = currentFeatureMetadata.getGroup(index);

        console.trace("getMadFeature ran at index: ", index, " for key: ", key);

        if (MadFeature) {
            return Clone(MadFeature.get()[key]);
        } else {
            return undefined;
        }
    }

    const setMadFeature = <T extends keyof MadForm>(key: T, index: number, value: MadForm[T]) => {
        const MadFeature = currentFeatureMetadata.getGroup(index);
        console.trace("setMadFeature ran with value: ", value, " at index: ", index, " for key: ", key);
        if (!MadFeature) {
            return;
        }
        
        MadFeature.set(key, value);
    }

    const getType = (index: number) => {
        const MadFeature = currentFeatureMetadata.getGroup(index);

        if (!MadFeature) return null;

        const type = MadType[MadFeature.get("type")];

        console.log("type: ", type);
        
        return type;
    }

    const featureName = createMemo(() => getFeatureValue('name')());
    const featureDesc = createMemo(() => getFeatureValue("description")());

    const [showCards, setShowCards] = createSignal<Record<string, boolean>>({});

    const setShowCard = (name: string, value: boolean) => {
        setShowCards(old => ({...old, [name]: value}));
    }
    
    const getShowCard = (name: string) => {
        return showCards()[name];
    }

    const MadCommands = [
        'Spells',
        'Items',
        'Proficiencies',
        'Features',
        'Currency',
        'ArmorClass',
        'Expertise',
        'Feats',
        'Languages',
        'Resistances',
        'Vulnerabilities',
        'Immunities',
        'SavingThrows',
        'Stats',
        'Speed',
        'AllProficiencies',
    ]

    const getSpellFeature = (index: number) => {
        return createMemo(() => getMadFeature("value", index) ?? {})
    }

    const getMadType = (index: number) => {
        const type = getMadFeature("type", index);

        if (type === undefined) return null;

        return createMemo(() => type);
    }

    const getMaDCommand = (index: number) => {
        const commandType = getMadFeature("commandType", index);
        const commandCategory = getMadFeature("commandCategory", index);
        
        if (commandType === undefined || commandCategory === undefined) return null;

        return createMemo(() => `${commandType}${commandCategory}`);
    }

    const getMadCommandCategory = (index: number) => {
        const commandCategory = getMadFeature("commandCategory", index);

        if (commandCategory === undefined) return null;

        return createMemo(() => commandCategory);
    }

    const getMadCommandType = (index: number) => {
        const commandType = getMadFeature("commandType", index);

        if (commandType === undefined) return null;

        return createMemo(() => commandType);
    }

    const getMadPrerequisites = (index: number) => {
        const prerequisites = getMadFeature("prerequisites", index);

        if (prerequisites === undefined) return null;

        return createMemo(() => prerequisites);
    }

    const getMadGroup = (index: number) => {
        const group = getMadFeature("group", index);

        if (group === undefined) return null;

        return createMemo(() => group);
    }

    const getMadValue = (index: number) => {
        const value = getMadFeature("value", index);

        if (value === undefined) return null;
        
        return createMemo(() => value);
    }

    createEffect(()=>{ 
        if (popupRef()) {
            const parentEL = popupRef()!.parentElement;
            
            if (parentEL) {
                const parent = parentEL.parentElement;

                if (parent) parent.style.setProperty("padding-bottom","0","important")
            }
        }
    })

    createEffect(() => {
        if (!show()) {
            clearInputs();
        } else if (is_edit() && feature().name !== "") {
            setFeatureValue('name', feature().name);
            setFeatureValue('description', feature().description);
        }   

    });

    onCleanup(() => {
        clearInputs();
    })

    return <Modal ref={popupRef} show={[show, setShow]} title={`${is_edit() ? "Edit" : "Add"} Feature`}>
        <div class={`${styles.wrapper}`} ref={(e)=>setPopupRef(e)}>
            <div class={`${styles.featureBody}`}>
                <div class={`${styles.featureHeader}`}>
                    <div>
                        <h3>Feature: {featureName()}</h3>
                    </div>
                </div>
                <div class={`${styles.scrollBox}`}>

                    <FlatCard headerName="Identity" icon="identity_platform" startOpen>
                        <FormField name="Feature Name" formName="Feature name">
                            <Input
                                value={featureName()}
                                onInput={(e)=>setFeatureValue('name', e.currentTarget.value)}
                                placeholder="Feature Name..."
                            />
                        </FormField>

                        <FormField name="Feature Desc" formName="Feature description">
                            <TextArea
                                text={featureDesc}
                                setText={(e)=>setFeatureValue('description', e.toString())}
                                placeholder="What does the feature do..."
                            />
                        </FormField>
                    </FlatCard>

                    <FlatCard headerName="Character Changes" icon="key">
                        <div>
                            <div>
                                <Button onClick={addNewMetadata}>
                                    Add Change
                                </Button>
                            </div>

                            <div>
                                <For each={currentFeatureMetadata.get()}>
                                    {(metadata, i) => {
                                        const key = metadata.name;
                                        const cardShow = () => getShowCard(key);
                                        const setCard = (val: boolean) => setShowCard(key, val); 

                                        return <FlatCard show={[cardShow, setCard as Setter<boolean>]} headerName={<div style={{display:"flex", "flex-direction": 'column', "align-content": 'flex-start',"text-align": "left"}}>
                                            <div style={{"text-align": "left", width: "100%"}}>
                                                {metadata.name}
                                            </div>
                                            <div style={{display: 'flex', "flex-direction": "row"}}>
                                                <span style={{"text-align": "center", width: "4vw"}}>
                                                    <span>group: </span>
                                                    <span>0</span>
                                                </span>
                                                <span style={{"text-align": "center", width: "7vw"}}>
                                                    <span>Type: </span> 
                                                    <span>{getType(i()) ?? ""}</span>
                                                </span>
                                            </div>
                                        </div>}>
                                        <div style={{display: 'flex', "flex-direction": "row","margin-bottom": "20px"}}>
                                            <Select value={getMadCommandType(i())?.()} onSelect={(value) => setMadFeature('commandType' ,i() ,value)}> 
                                                <Option value={"Add"}>Add</Option>
                                                <Option value={"Remove"}>Remove</Option>
                                            </Select>

                                            <Select value={getMadCommandCategory(i())?.()} onSelect={(value) => setMadFeature("commandCategory" ,i() ,value)}>
                                                <For each={MadCommands}>
                                                    {command => <Option value={command}>{command}</Option>}
                                                </For>
                                            </Select>

                                        </div>

                                        <Select value={getMadType(i())?.()} onSelect={(val) => setMadFeature("type", i(), val)}>
                                            <Option value={MadType.Character}>{MadType[0]}</Option>
                                            <Option value={MadType.Info}>{MadType[1]}</Option>
                                        </Select>

                                        <div style={{width: "100%", "text-align": "left"}}>
                                            <Switch>
                                                <Match when={getMadType(i())?.() === MadType.Character}>
                                                    changes the character on the character viewer
                                                </Match>
                                                <Match when={getMadType(i())?.() === MadType.Info}>
                                                    Not a character sheet change but more detailed information about the feat/feature like numberOFUses, recharge info, etc.
                                                </Match>
                                            </Switch>
                                        </div>

                                        <Switch>
                                            <Match when={getMaDCommand(i())?.() === "AddSpells" || getMaDCommand(i())?.() === "RemoveSpells"}>
                                                <SpellFeature allSpells={allSpells} GetMadFeature={getSpellFeature(i())} toggleSpell={(id) => {
                                                        setMadFeature("value", i(), {"ID": id})
                                                        setCard(false);
                                                    }} />
                                            </Match>
                                        </Switch>
                                        
                                        
                                    </FlatCard>
                                    }}
                                </For>
                            </div>
                        </div>
                    </FlatCard>
                </div>

                <div class={`${styles.actionBtns}`}>
                    {/* <Button>
                        Duplicate
                    </Button> */}

                    <Button onClick={() => { clearInputs(); setShow(false); }}>
                        Cancel
                    </Button>
                    
                    <Button onClick={save}>
                        {is_edit() ? "Update" : "Save"}
                    </Button>
                </div>
            </div>

        </div>
    </Modal>
}