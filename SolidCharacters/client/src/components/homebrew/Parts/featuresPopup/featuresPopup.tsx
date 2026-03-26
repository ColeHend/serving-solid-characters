import { Button, FormField, Input, Modal, FormArray, FormGroup, TextArea, Form } from "coles-solid-library";
import { Accessor, Component, createEffect, createMemo, createSignal, For, onCleanup, Setter } from "solid-js";
import { MadFeature } from "../../../../shared/customHooks/mads/madModels";
import { FeatureDetail, FeatureMetadata } from "../../../../models/generated";
import { FlatCard } from "../../../../shared/components/flatCard/flatCard";
import { MadFeature as GeneratedModel } from "../../../../models/generated";
import styles from "./featuresPopus.module.scss";
import { MadForm } from "../../../../models/data/formModels";
import { DebugConsole } from "../../../../shared/customHooks/DebugConsole";
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

    const currentFeatureMetadata = new FormArray<MadForm>([]);
    const currentFeature = new FormGroup<FeatureDetail>({
        "name": ["", []],
        "description": ["", []],
    });

    const currentMadsLength = createMemo(()=>currentFeatureMetadata.get().length);

    const addNewMetadata = () => {
        const newMetadata = new FormGroup<MadForm>({
            name: [`change ${currentMadsLength() + 1}`, []],
            command: ['', []],
            value: [{}, []],
            type: ['', []],
            prerequisites: [[], []],
            group: [0, []]
        })

        currentFeatureMetadata.add(newMetadata);
    }

    const save = () => {
        const name = featureName();
        const desc = featureDesc();
        const madsData:MadFeature[] = currentFeatureMetadata.get();

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

        setFeature(structuredClone(newFeature));
        clearInputs();
        setShow(false);
        if (props.onClose) {
            props.onClose(newFeature);
        }
    }

    const clearInputs = () => {
        currentFeature.reset();
        currentFeatureMetadata.reset();
    }

    const getFeatureValue = <T extends keyof FeatureDetail >(key: T): FeatureDetail[T]|undefined => {
        const Feature = feature();
        
        if (!Feature) {
            DebugConsole.error("Couldn't Find The Feature for 'GetFeatureValue' function in 'FeaturePopup' @ line '83'");
            return;
        }

        return Feature[key];
    }

    const setFeatureValue = <T extends keyof FeatureDetail >(key: T, value: FeatureDetail[T]) => {
        const Feature = feature();

        if (Feature) {
            if (typeof value === "string") {
                Feature[key] = value;
            } else if (typeof value === "object" && key === "metadata") {
                const val: FeatureMetadata = value;

                Feature['metadata'] = val;
            }

            console.log(
                Feature
            );
            
            setFeature(Feature);
        }
    }

    const featureName = createMemo(() => getFeatureValue('name') ?? '');
    const featureDesc = createMemo(() => getFeatureValue('description') ?? '');

    const getEmptyFeature = (): FeatureDetail => {
        return {
            name: "",
            description: "",
            metadata: {
                uses: 0,
                recharge: "",
                spells: [],
                category: "",
                mads: [],
            }
        }
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

    createEffect((prevOpen) => {

        if (show() && !prevOpen) {
            if (props.feature) {
                const newfeat = structuredClone(feature());
                
                
                if (newfeat) {
                    setFeature(newfeat);

                } 
                
            } else if (!props.feature) {
                setFeature(getEmptyFeature());    
            }
        }        
        return show();
    }, false);

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
                    <div>
                        <span>
                            group: 0
                        </span>
                        <span class={`${styles.divider}`} />
                        <span>
                            Type: Character Effects
                        </span>
                    </div>
                </div>
                <div class={`${styles.scrollBox}`}>

                    <Form data={currentFeature} onSubmit={()=>{}}>
                        <FlatCard headerName="Identity" icon="identity_platform">
                            <FormField name="Feature Name" formName="name">
                                <Input
                                    value={featureName()}
                                    onInput={(e)=>setFeatureValue('name', e.currentTarget.value)}
                                    placeholder="Feature Name..."
                                />
                            </FormField>

                            <FormField name="Feature Desc" formName="description">
                                <TextArea
                                    text={featureDesc}
                                    setText={(e)=>setFeatureValue('description', e.toString())}
                                    placeholder="What does the feature do..."
                                />
                            </FormField>
                        </FlatCard> 
                    </Form>

                    <FlatCard headerName="Character Changes" icon="key">
                        <div>
                            <div>
                                <Button onClick={addNewMetadata}>
                                    Add Change
                                </Button>
                            </div>

                            <div>
                                <For each={currentFeatureMetadata.get()}>
                                    {metadata => <FlatCard headerName={`${metadata.name}`}>
                                        x
                                    </FlatCard>}
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