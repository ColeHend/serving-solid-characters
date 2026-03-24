import { Button, FormField, Icon, Input, Modal, Container, FormArray, FormGroup, TextArea, Validators } from "coles-solid-library";
import { Accessor, Component, createEffect, createMemo, createSignal, For, onCleanup, Setter } from "solid-js";
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
}

export const FeaturesPopup: Component<popupProps> = (props) => {
    
    const [show, setShow] = props.Show;
    const [feature, setFeature] = props.feature;
    const [popupRef,setPopupRef] = createSignal<HTMLElement|null>(null);

    const [currentIndex, setCurrentIndex] = createSignal(0);

    const is_edit = createMemo(()=>feature() !== undefined);

    const currentFeatureMetadata = new FormArray<MadForm>([]);

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

    // const featureName = createMemo(() => getFeatureValue(currentIndex(), "name") ?? "");
    // const featureDesc = createMemo(() => {
    //     const desc = getFeatureValue(currentIndex(), "description");
    //     return isNullish(desc) ? "" : desc as string;
    // })
    // const featureMetadata = createMemo(() => {
    //     return getFeatureValue(currentIndex(), "metadata") ?? {};
    // })


    createEffect(()=>{ 
        if (popupRef()) {
            const parentEL = popupRef()!.parentElement;
            if (parentEL) {
                const parent = parentEL.parentElement;

                if (parent) parent.style.setProperty("padding-bottom","0","important")
            }
        }

        if (!show()) {
            console.log("ran");
        }
    })

    return <Modal ref={popupRef} show={[show, setShow]} title={`${is_edit() ? "Edit" : "Add"} Feature`}>
        <div class={`${styles.wrapper}`} ref={(e)=>setPopupRef(e)}>
            <div class={`${styles.featureBody}`}>
                <div class={`${styles.featureHeader}`}>
                    <div>
                        {/* <h3>Feature: {featureName()}</h3> */}
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
                    {/* <FlatCard headerName="Identity" icon="identity_platform">
                        <FormField name="Feature Name" formName="featureName">
                            <Input 
                                value={getFeatureValue(currentIndex(), "name") ?? ""} 
                                onInput={(e)=>setFeatureValue(currentIndex(), "name", e.currentTarget.value)} 
                                placeholder="Feature Name..."
                            />
                        </FormField>

                        <FormField name="Feature Desc" formName="featureDesc">
                            <TextArea
                                text={featureDesc}
                                setText={(e)=>setFeatureValue(currentIndex(), "description", e as string)}
                                placeholder="What does the feature do..."
                            />
                        </FormField>
                    </FlatCard>  */}

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
                    <Button>
                        Duplicate
                    </Button>

                    <Button onClick={() => setShow(false)}>
                        Delete
                    </Button>
                    
                    <Button onClick={() => {}}>
                        {is_edit() ? "Update" : "Save"}
                    </Button>
                </div>
            </div>

        </div>
    </Modal>
}