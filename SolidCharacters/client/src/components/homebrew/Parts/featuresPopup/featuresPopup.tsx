import { Button, FormField, Icon, Input, Modal, Container, FormArray, FormGroup, Form } from "coles-solid-library";
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

    const theFeatures = createMemo(() => currentFeatures.get());

    const  [currentIndex, setCurrentIndex] = createSignal(0);

    const [featureName, setFeatureName] = createSignal("");
    const [featureDesc, setFeatureDesc] = createSignal("");
    const [charChanges, setCharChanges] = createSignal<MadFeature[]>([]);

    const currentFeature = createMemo(()=>{
        const features = theFeatures();
        const selectedIndex = currentIndex();
        
        const toReturn = features.find((value, i) => i === selectedIndex);

        if (!toReturn) return null;

        return toReturn;
    })

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

    const setInputs = (name: string, desc: string) => {
        clearInputs();
        setFeatureName(name);
        setFeatureDesc(desc);
    }

    createEffect(()=>{ 
        if (popupRef()) {
            const parentEL = popupRef()!.parentElement;

            if (parentEL) {
                const parent = parentEL.parentElement;

                if (parent) parent.style.setProperty("padding-bottom","0","important")
            }
        }
        const current = currentFeature();

        if (current) {
            setInputs(current.name, current.description);
        }
    })


    return <Modal ref={popupRef} show={[show, setShow]} title={`${is_edit() ? "Edit" : "Add"} Feature`}>
        <div class={`${styles.wrapper}`} ref={(e)=>setPopupRef(e)}>
            <div class={`${styles.sideBar}`}> 
                <div class={`${styles.newFeatureBox}`}>
                    <Button onClick={()=>{
                    }}>New Feature +</Button>
                </div>

                <div>
                    <For each={theFeatures()}>
                        {(feature, i) => <div class={`${styles.selectBox}`} onClick={() => setCurrentIndex(i())}>
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
                        {is_edit() ? "Update" : "Save"}
                    </Button>
                </div>
            </div>

        </div>
    </Modal>
}