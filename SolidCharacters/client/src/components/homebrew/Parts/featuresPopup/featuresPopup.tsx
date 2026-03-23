import { Button, FormField, Icon, Input, Modal, Container, FormArray, FormGroup, TextArea, Validators } from "coles-solid-library";
import { Accessor, Component, createEffect, createMemo, createSignal, For, onCleanup, Setter } from "solid-js";
import { MadFeature } from "../../../../shared/customHooks/mads/madModels";
import { FeatureDetail, FeatureMetadata } from "../../../../models/generated";
import { FlatCard } from "../../../../shared/components/flatCard/flatCard";
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

    const [currentIndex, setCurrentIndex] = createSignal(0);

    const is_edit = createMemo(()=>features().length > 0);

    const currentFeatures = new FormArray<FeatureDetail>([], [Validators.minLength(0)]);
    
    const getFeatureValue =  <T extends keyof FeatureDetail,>(index: number, field: T): FeatureDetail[T]|undefined => {
        const feature = currentFeatures.getGroup(index);
        if (feature) {
            return feature.get(field);
        }
        return undefined;
    };
    const setFeatureValue = <T extends keyof FeatureDetail,>(index: number, field: T, value: FeatureDetail[T]) => {
        const feature = currentFeatures.getGroup(index);
        if (feature) {
            feature.set(field, value);
        }
    };
    const currentFeatureLength = createMemo(()=>currentFeatures.get().length);
    const addNewFeature = ()=>{
        const newFeature =  new FormGroup<FeatureDetail>({
            name: [`New Feature ${currentFeatureLength() + 1}`, []],
            description: ['', []],
        })
        

        currentFeatures.add(newFeature);
        const length = currentFeatureLength() -1;
        setCurrentIndex(length);
    }

    const featureName = createMemo(() => getFeatureValue(currentIndex(), "name") ?? "");
    const featureDesc = createMemo(() => {
        const desc = getFeatureValue(currentIndex(), "description");
        return isNullish(desc) ? "" : desc as string;
    })
    const [charChanges, setCharChanges] = createSignal<MadFeature[]>();

    const clearInputs = () => {
        setCharChanges([]); 
        currentFeatures.reset();
    }

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
            <div class={`${styles.sideBar}`}> 
                <div class={`${styles.newFeatureBox}`}>
                    <Button onClick={addNewFeature}>New Feature +</Button>
                </div>

                <div>
                    <For each={currentFeatures.get()}>
                        {(feature, i) => <div class={`${styles.selectBox}`} onClick={() => setCurrentIndex(i())}>
                            <Icon name="star_rate" size={"small"}/> 

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
                    
                    <Button onClick={() => {}}>
                        {is_edit() ? "Update" : "Create"}
                    </Button>
                </div>
            </div>

        </div>
    </Modal>
}