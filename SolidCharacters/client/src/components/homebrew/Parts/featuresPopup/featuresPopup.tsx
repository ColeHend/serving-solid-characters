import { Button, FormField, Icon, Input, Modal, Container, FormArray, FormGroup, TextArea, Validators, Form } from "coles-solid-library";
import { Accessor, Component, createEffect, createMemo, createSignal, For, onCleanup, onMount, Setter } from "solid-js";
import { MadFeature } from "../../../../shared/customHooks/mads/madModels";
import { FeatureDetail, FeatureMetadata, MadPrerequisite } from "../../../../models/generated";
import { FlatCard } from "../../../../shared/components/flatCard/flatCard";
import { isNullish } from "../../../../shared";
import { MadFeature as GeneratedModel } from "../../../../models/generated";
import styles from "./featuresPopus.module.scss";
import { MadForm } from "../../../../models/data/formModels";
interface popupProps {
    Show: [Accessor<boolean>, Setter<boolean>];
    feature: [Accessor<FeatureDetail|undefined>, Setter<FeatureDetail|undefined>];
    onClose?: (data: FeatureDetail) => void;
}

export const FeaturesPopup: Component<popupProps> = (props) => {
    

    const [show, setShow] = props.Show;
    const [feature, setFeature] = props.feature;
    const [popupRef,setPopupRef] = createSignal<HTMLElement|null>(null);

    const is_edit = createMemo(()=>feature() !== undefined);

    const currentFeatureMetadata = new FormArray<MadForm>([]);
    const currentFeature = new FormGroup<FeatureDetail>({
        "name": ["", []],
        "description": ["", []],
    });

    const currentMadsLength = createMemo(()=>currentFeatureMetadata.get().length);
    
    const featureName = createMemo(() => currentFeature.get("name"));
    const featureDesc = createMemo(() => currentFeature.get("description"));

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

    // let runOnce = true;

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
        const oldValue = show();

        if (oldValue !== show() || (oldValue && !prevOpen)) {
            if (props.feature) {
                const newfeat = structuredClone(feature());
                currentFeature.set("name", newfeat?.name || "");
                currentFeature.set("description", newfeat?.description || "");

                if (newfeat?.metadata?.mads) {
                    newfeat.metadata.mads.forEach(mad => {
                        const newMetadata = new FormGroup<MadForm>({
                            name: [`${currentMadsLength() + 1}`, []],
                            command: [mad.command, []],
                            value: [mad.value, []],
                            type: [mad.type, []],
                            prerequisites: [mad.prerequisites || [], []],
                            group: [mad.group || 0, []]
                        })

                        currentFeatureMetadata.add(newMetadata);
                    });
                }

            } else {
                setFeature(getEmptyFeature());
                clearInputs();
            }
        }        
        
        return show();
    }, false);

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
                                    placeholder="Feature Name..."
                                />
                            </FormField>

                            <FormField name="Feature Desc" formName="description">
                                <TextArea
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