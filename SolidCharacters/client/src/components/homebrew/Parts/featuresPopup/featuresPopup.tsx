import { Button, FormField, Icon, Input, Modal, Container, FormArray, FormGroup } from "coles-solid-library";
import { Accessor, Component, createEffect, createMemo, createSignal, For, Setter } from "solid-js";
import { MadFeature } from "../../../../shared/customHooks/mads/madModels";
import { FeatureDetail, FeatureMetadata } from "../../../../models/generated";
import { FlatCard } from "../../../../shared/components/flatCard/flatCard";
import { TextArea } from "coles-solid-library"
import { isNullish } from "../../../../shared";
import { MadFeature as GeneratedModel } from "../../../../models/generated";
import styles from "./featuresPopus.module.scss";

interface popupProps {
    Show: [Accessor<boolean>, Setter<boolean>];
    features: [Accessor<FeatureDetail[]>, Setter<FeatureDetail[]>];
}

export const FeaturesPopup: Component<popupProps> = (props) => {
    
    const [show, setShow] = props.Show;
    const [features, setFeatures] = props.features;
    const [popupRef,setPopupRef] = createSignal<HTMLElement|null>(null);

    const is_edit = createMemo(()=>features().length > 0);

    const currentFeatures = new FormArray<FeatureDetail>([[], []]);

    

    const [featureName, setFeatureName] = createSignal("");
    const [featureDesc, setFeatureDesc] = createSignal("");
    const [charChanges, setCharChanges] = createSignal<MadFeature[]>();

    const save = () => {
        const newMetadata: FeatureMetadata = {
            uses: 0,
            recharge: "",
            spells: [],
            category: "",
            mads: charChanges() as GeneratedModel[],
        }

        const newFeature:FeatureDetail = {
            name: featureName(),
            description: featureDesc(),
            metadata: newMetadata,
        };

        setFeatures(old => [...old, newFeature]);
    }

    const clearInputs = () => {
        setFeatureName("");
        setFeatureDesc("");
        setCharChanges([]); 
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

    return <Modal ref={popupRef} show={[show, setShow]} title={`${is_edit() ? "Edit" : "Add"} Feature`}>
        <div class={`${styles.wrapper}`} ref={(e)=>setPopupRef(e)}>
            <div class={`${styles.sideBar}`}> 
                <div class={`${styles.newFeatureBox}`}>
                    <Button>New Feature +</Button>
                </div>

                <div>
                    <For each={features()}>
                        {feature => <div class={`${styles.selectBox}`}>
                            <Icon name="hexagon" size={"small"}/> 

                            <span>
                                {feature.name}
                            </span>
                        </div>}
                    </For>
                </div>
            </div>
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
                    <FlatCard headerName="Identity" icon="identity_platform">
                        <FormField name="Feature Name" formName="featureName">
                            <Input 
                                value={featureName()} 
                                onInput={(e)=>setFeatureName(e.currentTarget.value)} 
                                placeholder="Feature Name..."
                            />
                        </FormField>

                        <FormField name="Feature Desc" formName="featureDesc">
                            <TextArea
                                text={featureDesc}
                                setText={setFeatureDesc}
                                placeholder="What does the feature do..."
                            />
                        </FormField>
                    </FlatCard>

                    <FlatCard headerName="Character Changes" icon="key">
                        Placeholder Text
                    </FlatCard>
                </div>

                <div class={`${styles.actionBtns}`}>
                    <Button>
                        Duplicate
                    </Button>

                    <Button onClick={() => setShow(false)}>
                        Delete
                    </Button>
                    
                    <Button onClick={save}>
                        {is_edit() ? "Update" : "Create"}
                    </Button>
                </div>
            </div>

        </div>
    </Modal>
}