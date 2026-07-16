import { Button, FormField, Input, Modal, FormArray, FormGroup, TextArea,   Option, Select, TabBar, Chip } from "coles-solid-library";
import { Accessor, Component, createEffect, createMemo, createSignal, For, Match, on, onCleanup, Setter, Show, Switch, untrack } from "solid-js";
import { MadCommands, MadType } from "../../../../shared/customHooks/mads/madModels";
import { FeatureDetail, FeatureMetadata, MadPrerequisite } from "../../../../models/generated";
import { FlatCard } from "../../../../shared/components/flatCard/flatCard";
import styles from "./featuresPopus.module.scss";
import { MadForm, MadPrereqForm } from "../../../../models/data/formModels";
import { SpellFeature } from "./parts/spellFeature/spellFeature";
import { useDnDSpells } from "../../../../shared/customHooks/dndInfo/info/all/spells";
import { Clone, useUserStyles } from "../../../../shared";
import { useDnDItems } from "../../../../shared/customHooks/dndInfo/info/all/items";
import { ItemFeature } from "./parts/itemFeature/ItemFeature";
import { CurrencyFeature } from "./parts/currencyFeature/currencyFeature";
import { ACFeature } from "./parts/acFeature/acFeature";
import { ProficienciesFeature } from "./parts/proficienciesFeature/proficienciesFeature";
import { ExistingFeature } from "./parts/existingFeature/existingFeature";
import { useDndFeature } from "../../../../shared/customHooks/dndInfo/useDndFeatures";
import { LanguagesFeature } from "./parts/languagesFeature/languagesFeature";
import { ResistanceFeature } from "./parts/resistanceFeature/resistanceFeature";
import { SavingThrow } from "./parts/savingThrow/savingThrow";
import { StatFeature } from "./parts/statFeature/StatFeature";
import { SpeedFeature } from "./parts/speedFeature/speedFeature";
import { MovementFeature } from "./parts/movementFeature/movementFeature";
import { SensesFeature } from "./parts/sensesFeature/sensesFeature";
import { HitPointsFeature } from "./parts/hitPointsFeature/hitPointsFeature";
import { AllProfsFeature } from "./parts/allProfsFeature/allProfsFeature";
import { FeatFeature } from "./parts/featFeature/featFeature";
import { useDnDFeats } from "../../../../shared/customHooks/dndInfo/info/all/feats";
import { FeaturePrerequisites } from "./parts/featurePrerequisites/featurePrerequisites";
import { ClassFeature } from "./parts/classFeature/classFeature";
import { AdvantageFeature } from "./parts/advantageFeature/advantageFeature";
import { RollBonusFeature } from "./parts/rollBonusFeature/rollBonusFeature";
import { ActionsFeature } from "./parts/actionsFeature/actionsFeature";
import { AttacksFeature } from "./parts/attacksFeature/attacksFeature";
import { UsesFeature } from "./parts/usesFeature/usesFeature";

interface popupProps {
    Show: [Accessor<boolean>, Setter<boolean>];
    feature: [Accessor<FeatureDetail>, Setter<FeatureDetail>];
    onClose?: (data: FeatureDetail) => void;
    isEdit: Accessor<boolean>;
}

export const FeaturesPopup: Component<popupProps> = (props) => {
    const [show, setShow] = props.Show;
    const [feature, setFeature] = createSignal<FeatureDetail|null>(null);
    // const [features] = props.features;
    const [popupRef,setPopupRef] = createSignal<HTMLElement|null>(null);
    const [prerequisites, setPrerequisites] = createSignal<Record<string, MadPrerequisite>>({});
    const [activeTab, setActiveTab] = createSignal(0);

    const is_edit = createMemo(()=>props.isEdit());
    const allSpells = useDnDSpells();
    const allItems = useDnDItems();
    const {allFeatures} = useDndFeature();
    const AllFeats = useDnDFeats();

    const currentFeatureMetadata = new FormArray<MadForm>([]);
    const currentFeaturePrerequisites = new FormArray<MadPrereqForm>([]);

    const currentMadsLength = createMemo(()=>currentFeatureMetadata.get().length);

    // const themeStyles = useUserStyles()


    const addNewMetadata = () => {
        const newMetadata = new FormGroup<MadForm>({
            name: [`${currentMadsLength() + 1}`, []],
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
        const name = getFeatureValue('name')?.() ?? "";
        const desc = getFeatureValue('description')?.() ?? "";

        const madsData = currentFeatureMetadata.get().flatMap(metadata => {
            return {
                command: metadata.command,
                value: metadata.value,
                type: metadata.type,
                prerequisites: metadata.prerequisites,
                group: metadata.group
            }
        });

        console.log("endData: ", madsData, name, desc);
        
        
        const newFeature: FeatureDetail = {
            id: "",
            name: name,
            description: desc,
            metadata: {
                uses: 0,
                recharge: "",
                spells: [],
                category: "",
                mads: madsData,
            }
        }

        setShow(false);
        if (props.onClose) {
            props.onClose(newFeature);
            clearInputs();
        }
    }

    const clearInputs = () => {
        setFeature(null);
        setPrerequisites({});
        currentFeatureMetadata.reset();
    }

    const getFeatureValue = <T extends keyof FeatureDetail >(key: T): Accessor<FeatureDetail[T]>|null => {
        const Feature = feature();

        if (!Feature) return null; 
        
        const clone = structuredClone(Feature);

        return createMemo(() => clone[key]);
    }

    const setFeatureValue = <T extends keyof FeatureDetail >(key: T, value: FeatureDetail[T]) => {
        const Feature = feature();
        
        if (!Feature) return;

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
        if (MadFeature) {
            return Clone(MadFeature.get()[key]);
        } else {
            return undefined;
        }
    }

    const setMadFeature = <T extends keyof MadForm>(key: T, index: number, value: MadForm[T]) => {
        const MadFeature = currentFeatureMetadata.getGroup(index);
        if (!MadFeature) {
            return;
        }
        
        MadFeature.set(key, value);
    }

    const getType = (index: number) => {
        const MadFeature = currentFeatureMetadata.getGroup(index);

        if (!MadFeature) return null;

        const type = MadType[MadFeature.get("type")];
        
        return type;
    }

    const featureName = createMemo(() => getFeatureValue('name')?.() ?? "");
    const featureDesc = createMemo(() => getFeatureValue("description")?.() ?? "");

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
        'ClassFeature',
        'Advantage',
        'Attacks',
        'Uses',
        'Movement',
        'Senses',
        'HitPoints',
        'RollBonus',
        'Actions',
    ]

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

    const fillForm = () => {
        const [feature,] = props.feature;

        setFeatureValue('name', feature().name);
        setFeatureValue('description', feature().description);
        setFeatureValue("metadata", feature().metadata);

        const mads = feature().metadata?.mads ?? [];

        // fillForm runs from a tracked effect: reading currentMadsLength() / growing the
        // FormArray in tracking scope makes that effect depend on the array it mutates,
        // re-running until the script times out. Hydrate untracked, and reset first so a
        // re-fill replaces the rows instead of appending duplicates.
        untrack(() => {
            currentFeatureMetadata.reset();
            mads.forEach((mad, index) => {
                const formGroup = new FormGroup<MadForm>({
                    group: [ mad.group, []],
                    type: [mad.type, []],
                    value: [mad.value, []],
                    name: [`${index + 1}`, []],
                    prerequisites: [mad.prerequisites, []],
                    commandCategory: [``, []],
                    commandType: [``, []],
                    command: [mad.command, []],
                })


                currentFeatureMetadata.add(formGroup);
            })
        })
    }

    const prettyCommand = (command: string) => {
        const split = command.split(/(?=[A-Z])/).join(" ");

        return split;
    }

    // Hydrate the internal form only when the PARENT feature changes. on() runs its
    // callback untracked, so the setFeature writes inside fillForm() can't re-trigger
    // this effect — that tracked read+write cycle was the "too much recursion" loop
    // on the edit path. Callers must pass a fresh object reference on every open
    // (openAddFeature/openEditFeature both do) or the hydration won't re-fire.
    createEffect(on(() => props.feature[0](), (parent) => {
        if (feature() === null) {
            setFeature({
                id: "",
                name: "",
                description: "",
                metadata: {
                    mads: [],
                }
            })
        }

        if (parent.name !== "") {
            fillForm()
        } else {
            // Add mode (blank feature): drop any rows left over from a previous edit.
            currentFeatureMetadata.reset();
        }
    }))

    // DOM-only side effect: strip the modal wrapper's bottom padding once it mounts.
    createEffect(() => {
        const popup = popupRef();
        if (!popup) return;
        const parent = popup.parentElement?.parentElement;
        if (parent) {
            parent.style.setProperty("padding-bottom","0","important")
        }
    })

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
                <div class={`${styles.scrollBox} ${styles.changePopup}`}>

                    <TabBar tabs={["Core Details", `Character Changes ${currentFeatureMetadata.get().length}`]} activeTab={activeTab()} onTabChange={(label, i) => setActiveTab(i)}/>

                    <Switch>
                        <Match when={activeTab() === 0}>
                            <div class={`${styles.coreDetails}`}>
                                <label class={`${styles.label}`}>Feature Name *</label>

                                <FormField name="Feature Name" formName="Feature name">
                                    <Input
                                        value={featureName()}
                                        onInput={(e)=>setFeatureValue('name', e.currentTarget.value)}
                                        placeholder="e.g. Darkvision, Second Wind, Spellcasting..."
                                    />
                                </FormField>

                                <label class={`${styles.label}`}>Description</label>

                                <FormField name="Feature Desc" formName="Feature description">
                                    <TextArea
                                        text={featureDesc}
                                        setText={(e)=>setFeatureValue('description', e.toString())}
                                        placeholder="Describe what this feature does."
                                    />
                                </FormField>
                            </div>
                        </Match>
                        <Match when={activeTab() === 1}>
                            <div>
                                <Show when={currentFeatureMetadata.get().length >= 1}>
                                    <div class={`${styles.instructions}`}>
                                        <span>↕ Same group number → OR (player picks one) </span> 
                                        <span>✕ Different numbers → AND (all required)</span>
                                    </div>
                                </Show>

                                <div class={`${styles.changePopup}`}>
                                    <For each={currentFeatureMetadata.get()}>
                                        {(metadata, i) => {
                                            const key = metadata.name;
                                            const cardShow = () => getShowCard(key);
                                            const setCard = (val: boolean) => setShowCard(key, val); 

                                            const isLast = createMemo(() => i() === currentFeatureMetadata.get().length);
                                            const isFirst = createMemo(()=>i() === 0);

                                            const check = createMemo(()=> !isFirst() && !isLast());                                   

                                            return <FlatCard show={[cardShow, setCard as Setter<boolean>]} startOpen={isFirst()} getRidOfTopBorder={check()} 
                                            headerName={<div class={`${styles.changeHeader}`}>
                                                    {/* <div class={`${styles.changeHeaderTitle}`}>
                                                        <strong>Change </strong>{metadata.name}
                                                    </div>
                                                    <div class={`${styles.changeSubheader}`}>
                                                        <span class={`${styles.changeGroupTitle}`}>
                                                            <span><strong>Group:</strong> </span>
                                                            <span>{getMadGroup(i())?.() ?? 0}</span>
                                                        </span>
                                                        <span class={`${styles.changeTypeTitle}`}>
                                                            <span><strong>Type:</strong> </span> 
                                                            <span>{}</span>
                                                        </span>
                                                    </div> */}
                                                    <Chip value={`G${getMadGroup(i())?.() ?? 0}`} /> 
                                                    <Show when={getMaDCommand(i())?.() !== ""}>
                                                        <span class={`${styles.commandTitle}`}>
                                                            {prettyCommand(getMaDCommand(i())?.() ?? "No Command Selected")}
                                                        </span>
                                                    </Show>
                                                    <span>
                                                        {getType(i()) ?? ""}
                                                    </span>
                                                </div>}>

                                            {/* command */}
                                            <h2 class={`${styles.leftAlignText}`}>Command</h2>
                                            <div class={`${styles.commandDesc}`}>
                                                Pick whether this change should add or remove something, and choose the category of thing being changed.
                                            </div>
                                            <div class={`${styles.commandSelectionBox}`}>
                                                <Select value={getMadCommandType(i())?.()} onSelect={(value) => setMadFeature('commandType' ,i() ,value)}> 
                                                    <Option value={"Add"}>Add</Option>
                                                    <Option value={"Remove"}>Remove</Option>
                                                </Select>

                                                <Select value={getMadCommandCategory(i())?.()} onSelect={(value) => {
                                                        setMadFeature("commandCategory" ,i() ,value)
                                                        setMadFeature("value", i(), {});
                                                    }}>
                                                    <For each={MadCommands}>
                                                        {command => <Option value={command}>{command}</Option>}
                                                    </For>
                                                </Select>

                                            </div>
                                            
                                            <div style={{display:"flex", "flex-direction": "row","justify-content":"center", "align-content": "center"}}>
                                                <div style={{width: "75%"}}>
                                                    {/* type */}
                                                    <h2 class={`${styles.leftAlignText}`}>type</h2>

                                                    <Select value={getMadType(i())?.()} onSelect={(val) => setMadFeature("type", i(), val)}>
                                                        <Option value={MadType.Character}>{MadType[0]}</Option>
                                                        <Option value={MadType.Info}>{MadType[1]}</Option>
                                                    </Select>

                                                    <div class={`${styles.typeDesc}`}>
                                                        <Switch>
                                                            <Match when={getMadType(i())?.() === MadType.Character}>
                                                                This change updates the visible character sheet values in the viewer.
                                                            </Match>
                                                            <Match when={getMadType(i())?.() === MadType.Info}>
                                                                This is extra feature information, like uses or recharge details, and is not a direct character stat change.
                                                            </Match>
                                                        </Switch>
                                                    </div>

                                                </div>

                                                <div style={{width: "25%"}}>
                                                    <h2 class={`${styles.leftAlignText}`}>Feature Group</h2>

                                                    <div>

                                                    </div>

                                                    <FormField formName="MadFeatureGroup" name="change group">
                                                        <Input min={0} type="number" value={getMadGroup(i())?.()} onInput={(e) => setMadFeature("group",i(), +e.currentTarget.value)}/>
                                                    </FormField>
                                                </div>

                                            </div>



                                            <FeaturePrerequisites prereqForm={currentFeaturePrerequisites} prereqs={[prerequisites, setPrerequisites]} Submit={() => {
                                                // const requisites = prerequisites();
                                                // const objKeys = Object.keys(prerequisites());

                                                // const arr:MadPrerequisite[] = [];
                                                // const toAdd = objKeys.reduce((updated, key)=>{
                                                //     updated.push(requisites[key]);

                                                //     return updated;
                                                // },arr);

                                                // setMadFeature("prerequisites", i(), toAdd);
                                                // return false;
                                            }} />

                                            <h2>{prettyCommand(getMaDCommand(i())?.() ?? "")}</h2>
                                            
                                            <Switch>
                                                <Match when={getMaDCommand(i())?.() === "AddSpells" || getMaDCommand(i())?.() === "RemoveSpells"}>
                                                    <SpellFeature allSpells={allSpells} getValue={getMadValue?.(i()) ?? (() => undefined)} toggleSpell={(id) => {
                                                            const old = getMadValue(i())?.();

                                                            if (old?.["ID"] === id) {
                                                                setMadFeature("value", i(), {"ID": ""})
                                                            } else {
                                                                setMadFeature("value", i(), {"ID": id})
                                                            }

                                                            setMadFeature("command", i(), getMaDCommand(i())?.() as MadCommands);

                                                            setCard(false);
                                                        }} />
                                                </Match>
                                                <Match when={getMaDCommand(i())?.() === "AddItems" || getMaDCommand(i())?.() === "RemoveItems"}>
                                                    <ItemFeature 
                                                        allItems={allItems}
                                                        getValue={getMadValue?.(i()) ?? (() => undefined)}
                                                        toggleItem={(id: string) => {
                                                            const old = getMadValue(i())?.();

                                                            if (old?.["ID"] === id) {
                                                                setMadFeature("value", i(), {"ID": ""})
                                                            } else {
                                                                setMadFeature("value", i(), {"ID": id})
                                                            }

                                                            setMadFeature("command", i(), getMaDCommand(i())?.() as MadCommands);

                                                            setCard(false);
                                                        }}
                                                    />
                                                </Match>
                                                <Match when={getMaDCommand(i())?.() === "AddCurrency" || getMaDCommand(i())?.() === "RemoveCurrency"}>
                                                    <CurrencyFeature getValue={getMadValue?.(i()) ?? (() => undefined)} setCurrecy={(type, amount) => {
                                                        const old = getMadValue(i())?.();

                                                        let amt = +(old?.["amount"] ?? '0');

                                                        if (old?.["type"] === type) {
                                                            setMadFeature("value", i(), {"type": type, "amount": (amt += amount).toString()})
                                                        } else {
                                                            setMadFeature("value", i(), {"type": type, "amount": amount.toString()});
                                                        }

                                                        setMadFeature("command", i(), getMaDCommand(i())?.() as MadCommands);

                                                        setCard(false);
                                                    }}/>
                                                </Match>
                                                <Match when={getMaDCommand(i())?.() === "AddArmorClass" || getMaDCommand(i())?.() === "RemoveArmorClass"}>
                                                    <ACFeature getValue={getMadValue?.(i()) ?? (() => undefined)} toggleAC={(bonus, stats, condition)=>{
                                                        const next: Record<string, string> = {"bonus": bonus.toString()};
                                                        if (stats.length) next["stats"] = stats.join(",");
                                                        if (condition) next["condition"] = condition;
                                                        setMadFeature("value", i(), next);
                                                        setMadFeature("command", i(), getMaDCommand(i())?.() as MadCommands);
                                                        setCard(false);
                                                    }} />
                                                </Match>
                                                <Match when={getMaDCommand(i())?.() === "AddProficiencies" || getMaDCommand(i())?.() === "RemoveProficiencies" || getMaDCommand(i())?.() === "AddExpertise" || getMaDCommand(i())?.() === "RemoveExpertise"} >
                                                    <ProficienciesFeature
                                                        getValue={getMadValue?.(i()) ?? (() => undefined)}
                                                        allowChoice={getMaDCommand(i())?.() === "AddProficiencies"}
                                                        toggleProf={(prof, extra) => {
                                                            const next: Record<string, string> = {"proficiency": prof};
                                                            if (prof === "choice" && extra?.options) {
                                                                next["options"] = extra.options;
                                                                next["count"] = extra.count ?? "1";
                                                            }
                                                            setMadFeature("command", i(), getMaDCommand(i())?.() as MadCommands);
                                                            setMadFeature("value", i(), next);
                                                            setCard(false);
                                                        }}/>
                                                </Match>
                                                <Match when={getMaDCommand(i())?.() === "AddFeatures" || getMaDCommand(i())?.() === "RemoveFeatures"}>
                                                    <ExistingFeature 
                                                        getValue={getMadValue?.(i()) ?? (() => undefined)}
                                                        allFeatures={allFeatures}
                                                        toggleFeature={(featureID) => {
                                                            const old = getMadValue(i())?.();
                                                            console.log("id: ", featureID);
                                                            
                                                            if (old?.["ID"] === featureID) {
                                                                setMadFeature("value", i(), {"ID": ""})
                                                            } else {
                                                                setMadFeature("value", i(), {"ID": featureID})
                                                            }
                                                            setMadFeature("command", i(), getMaDCommand(i())?.() as MadCommands);
                                                            
                                                            setCard(false);
                                                        }}
                                                    />
                                                </Match>
                                                <Match when={getMaDCommand(i())?.() === "AddLanguages" || getMaDCommand(i())?.() === "RemoveLanguages"}>
                                                    <LanguagesFeature 
                                                        toggleValue={(language) => {
                                                            const old = getMadValue(i())?.();
                                                            
                                                            if (old?.["name"] === language) {
                                                                setMadFeature("value", i(), {"name": ""})
                                                            } else {
                                                                setMadFeature("value", i(), {"name": language})
                                                            }
                                                            setMadFeature("command", i(), getMaDCommand(i())?.() as MadCommands);
                                                            setCard(false);
                                                        }}
                                                        getValue={getMadValue?.(i()) ?? (() => undefined)}
                                                    />
                                                </Match>
                                                <Match when={getMaDCommand(i())?.() === "AddResistances" || getMaDCommand(i())?.() === "RemoveResistances" || getMaDCommand(i())?.() === "AddVulnerabilities" || getMaDCommand(i())?.() === "RemoveVulnerabilities" || getMaDCommand(i())?.() === "AddImmunities" || getMaDCommand(i())?.() === "RemoveImmunities"}>
                                                    <ResistanceFeature 
                                                        toggleValue={(dmgType) => {
                                                            const old = getMadValue(i())?.();
                                                            
                                                            if (old?.["damageType"] === dmgType) {
                                                                setMadFeature("value", i(), {"damageType": ""})
                                                            } else {
                                                                setMadFeature("value", i(), {"damageType": dmgType})
                                                            }
                                                            setMadFeature("command", i(), getMaDCommand(i())?.() as MadCommands);
                                                            setCard(false);
                                                        }}
                                                        getValue={getMadValue?.(i()) ?? (() => undefined)}
                                                        getCommandCategory={getMadCommandCategory(i())}
                                                    />
                                                </Match>
                                                <Match when={getMaDCommand(i())?.() === "AddSavingThrows" || getMaDCommand(i())?.() === "RemoveSavingThrows"}>
                                                    <SavingThrow 
                                                        toggleValue={(stat) => {
                                                            const old = getMadValue(i())?.();
                                                            
                                                            if (old?.["stat"] === stat) {
                                                                setMadFeature("value", i(), {"stat": ""})
                                                            } else {
                                                                setMadFeature("value", i(), {"stat": stat})
                                                            }
                                                            setMadFeature("command", i(), getMaDCommand(i())?.() as MadCommands);
                                                            setCard(false);
                                                        }}
                                                        getValue={getMadValue?.(i()) ?? (() => undefined)}
                                                    
                                                    />
                                                </Match>
                                                <Match when={getMaDCommand(i())?.() === "AddStats" || getMaDCommand(i())?.() === "RemoveStats"}>
                                                    <StatFeature
                                                        toggleValue={(stat, value, extra) => {
                                                            const next: Record<string, string> = {"stat": stat, "statValue": value.toString()};
                                                            if (extra?.options) next["options"] = extra.options;
                                                            if (extra?.mode) next["mode"] = extra.mode;
                                                            setMadFeature("value", i(), next);
                                                            setMadFeature("command", i(), getMaDCommand(i())?.() as MadCommands);
                                                            setCard(false);
                                                        }}
                                                        getValue={getMadValue?.(i()) ?? (() => undefined)}
                                                    
                                                    />
                                                </Match>
                                                <Match when={getMaDCommand(i())?.() === "AddSpeed" || getMaDCommand(i())?.() === "RemoveSpeed"}>
                                                    <SpeedFeature
                                                        toggleValue={(speed, mode) => {
                                                            const next: Record<string, string> = {"speed": speed.toString()};
                                                            if (mode === "set") next["mode"] = "set";
                                                            setMadFeature("value", i(), next);
                                                            setMadFeature("command", i(), getMaDCommand(i())?.() as MadCommands);
                                                            setCard(false);
                                                        }}
                                                        getValue={getMadValue?.(i()) ?? (() => undefined)}
                                                    />
                                                </Match>
                                                <Match when={getMaDCommand(i())?.() === "AddAllProficiencies" || getMaDCommand(i())?.() === "RemoveAllProficiencies"}>
                                                    <AllProfsFeature 
                                                        toggleValue={(value, pbChoice) => {
                                                            const old = getMadValue(i())?.();
                                                            
                                                            if (old?.["allProficiencies"] === value) {
                                                                setMadFeature("value", i(), {"allProficiencies": ""})
                                                                setMadFeature("value", i(), {"proficiencyBonusChoice": ""})
                                                            } else {
                                                                setMadFeature("value", i(), {"allProficiencies": value})
                                                                setMadFeature("value", i(), {"proficiencyBonusChoice": pbChoice})
                                                            }
                                                            setMadFeature("command", i(), getMaDCommand(i())?.() as MadCommands);
                                                            setCard(false);
                                                        }}
                                                        getValue={getMadValue?.(i()) ?? (() => undefined)}
                                                    />
                                                </Match>
                                                <Match when={getMaDCommand(i())?.() === "AddFeats" || getMaDCommand(i())?.() === "RemoveFeats" }>
                                                    <FeatFeature 
                                                        toggleValue={(value) => {
                                                            const old = getMadValue(i())?.();

                                                            if (old?.["ID"] === value) {
                                                                setMadFeature("value", i(), {"featID": ""})
                                                            } else {
                                                                setMadFeature("value", i(), {"featID": value});
                                                            }
                                                            setMadFeature("command", i(), getMaDCommand(i())?.() as MadCommands);
                                                            setCard(false);
                                                        }}
                                                        getValue={getMadValue?.(i()) ?? (() => undefined)}
                                                        allFeats={AllFeats}
                                                    />
                                                </Match>
                                                <Match when={getMaDCommand(i())?.() === "AddClassFeature" || getMaDCommand(i())?.() === "RemoveClassFeature"}>
                                                    <ClassFeature
                                                        toggleValue={(name, description, category) => {
                                                            setMadFeature("value", i(), {"name": name, "description": description, "category": category});
                                                            setMadFeature("command", i(), getMaDCommand(i())?.() as MadCommands);
                                                            setCard(false);
                                                        }}
                                                        getValue={getMadValue?.(i()) ?? (() => undefined)}
                                                    />
                                                </Match>
                                                <Match when={getMaDCommand(i())?.() === "AddAdvantage" || getMaDCommand(i())?.() === "RemoveAdvantage"}>
                                                    <AdvantageFeature
                                                        toggleValue={(rollType, mode, stat, condition) => {
                                                            setMadFeature("value", i(), {"rollType": rollType, "mode": mode, "stat": stat, "condition": condition});
                                                            setMadFeature("command", i(), getMaDCommand(i())?.() as MadCommands);
                                                            setCard(false);
                                                        }}
                                                        getValue={getMadValue?.(i()) ?? (() => undefined)}
                                                    />
                                                </Match>
                                                <Match when={getMaDCommand(i())?.() === "AddRollBonus" || getMaDCommand(i())?.() === "RemoveRollBonus"}>
                                                    <RollBonusFeature
                                                        toggleValue={(rollType, bonus, proficiencyBonus, stat, condition) => {
                                                            const next: Record<string, string> = {"rollType": rollType};
                                                            if (bonus) next["bonus"] = bonus;
                                                            if (proficiencyBonus) next["proficiencyBonus"] = proficiencyBonus;
                                                            if (stat) next["stat"] = stat;
                                                            if (condition) next["condition"] = condition;
                                                            setMadFeature("value", i(), next);
                                                            setMadFeature("command", i(), getMaDCommand(i())?.() as MadCommands);
                                                            setCard(false);
                                                        }}
                                                        getValue={getMadValue?.(i()) ?? (() => undefined)}
                                                    />
                                                </Match>
                                                <Match when={getMaDCommand(i())?.() === "AddActions" || getMaDCommand(i())?.() === "RemoveActions"}>
                                                    <ActionsFeature
                                                        toggleValue={(name, actionType, description) => {
                                                            const next: Record<string, string> = {"name": name, "actionType": actionType};
                                                            if (description) next["description"] = description;
                                                            setMadFeature("value", i(), next);
                                                            setMadFeature("command", i(), getMaDCommand(i())?.() as MadCommands);
                                                            setCard(false);
                                                        }}
                                                        getValue={getMadValue?.(i()) ?? (() => undefined)}
                                                    />
                                                </Match>
                                                <Match when={getMaDCommand(i())?.() === "AddAttacks" || getMaDCommand(i())?.() === "RemoveAttacks"}>
                                                    <AttacksFeature
                                                        toggleValue={(amount) => {
                                                            setMadFeature("value", i(), {"amount": amount.toString()});
                                                            setMadFeature("command", i(), getMaDCommand(i())?.() as MadCommands);
                                                            setCard(false);
                                                        }}
                                                        getValue={getMadValue?.(i()) ?? (() => undefined)}
                                                    />
                                                </Match>
                                                <Match when={getMaDCommand(i())?.() === "AddUses" || getMaDCommand(i())?.() === "RemoveUses"}>
                                                    <UsesFeature
                                                        toggleValue={(amount, recharge) => {
                                                            setMadFeature("value", i(), {"amount": amount.toString(), "recharge": recharge});
                                                            setMadFeature("command", i(), getMaDCommand(i())?.() as MadCommands);
                                                            // Uses describes its owning feature (uses/recharge), not a sheet change.
                                                            setMadFeature("type", i(), MadType.Info);
                                                            setCard(false);
                                                        }}
                                                        getValue={getMadValue?.(i()) ?? (() => undefined)}
                                                    />
                                                </Match>
                                                <Match when={getMaDCommand(i())?.() === "AddMovement" || getMaDCommand(i())?.() === "RemoveMovement"}>
                                                    <MovementFeature
                                                        toggleValue={(movementType, speed) => {
                                                            const next: Record<string, string> = {"movementType": movementType};
                                                            if (speed !== undefined) next["speed"] = speed.toString();
                                                            setMadFeature("value", i(), next);
                                                            setMadFeature("command", i(), getMaDCommand(i())?.() as MadCommands);
                                                            setCard(false);
                                                        }}
                                                        getValue={getMadValue?.(i()) ?? (() => undefined)}
                                                    />
                                                </Match>
                                                <Match when={getMaDCommand(i())?.() === "AddSenses" || getMaDCommand(i())?.() === "RemoveSenses"}>
                                                    <SensesFeature
                                                        toggleValue={(sense, range) => {
                                                            setMadFeature("value", i(), {"sense": sense, "range": range.toString()});
                                                            setMadFeature("command", i(), getMaDCommand(i())?.() as MadCommands);
                                                            setCard(false);
                                                        }}
                                                        getValue={getMadValue?.(i()) ?? (() => undefined)}
                                                    />
                                                </Match>
                                                <Match when={getMaDCommand(i())?.() === "AddHitPoints" || getMaDCommand(i())?.() === "RemoveHitPoints"}>
                                                    <HitPointsFeature
                                                        toggleValue={(amount, perLevel) => {
                                                            const next: Record<string, string> = {"amount": amount.toString()};
                                                            if (perLevel) next["perLevel"] = "true";
                                                            setMadFeature("value", i(), next);
                                                            setMadFeature("command", i(), getMaDCommand(i())?.() as MadCommands);
                                                            setCard(false);
                                                        }}
                                                        getValue={getMadValue?.(i()) ?? (() => undefined)}
                                                    />
                                                </Match>
                                            </Switch>
                                        </FlatCard>
                                        }}
                                    </For>
                                </div>

                                <div>
                                    <Button onClick={addNewMetadata} class={`${styles.addChangeBtn}`}>
                                        + Add Character Change
                                    </Button>
                                </div>

                            </div>
                        </Match>
                    </Switch>

                </div>


                <div class={`${styles.actionBtns}`}>
                    {/* <Button>
                        Duplicate
                    </Button> */}

                    <Button onClick={() => { clearInputs(); setShow(false); }}>
                        Cancel
                    </Button>
                    
                    <Button onClick={save} class={`${styles.saveBtn}`}>
                        {is_edit() ? "Update Feature" : "Save Feature"}
                    </Button>
                </div>
            </div>

        </div>
    </Modal>
}