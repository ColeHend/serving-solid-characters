import { Button, FormField, Input, Modal } from "coles-solid-library";
import { Accessor, Component, createEffect, createMemo, createSignal, Setter } from "solid-js";
import { MadFeature } from "../../../../shared/customHooks/mads/madModels";
import { FeatureDetail, FeatureMetadata } from "../../../../models/generated";
import { FlatCard } from "../../../../shared/components/flatCard/flatCard";
import { TextArea } from "coles-solid-library"
import { isNullish } from "../../../../shared";
import { MadFeature as GeneratedModel } from "../../../../models/generated";

interface popupProps {
    Show: [Accessor<boolean>, Setter<boolean>];
    feature: [Accessor<FeatureDetail | null>, Setter<FeatureDetail | null>];
}

export const featuresPopup: Component<popupProps> = (props) => {
    const [show, setShow] = props.Show;
    const [feature, setFeature] = props.feature;

    const is_edit = createMemo(()=>!isNullish(feature()));

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

        setFeature(newFeature);
        setShow(false);
    }

    const clearInputs = () => {
        setFeatureName("");
        setFeatureDesc("");
        setCharChanges([]); 
    }

    createEffect(() => {
        if (!show()) {
            clearInputs();
        } else if (is_edit() && feature()) {
            setFeatureName(feature()!.name);
            setFeatureDesc(feature()!.description);
            setCharChanges(feature()!.metadata?.mads as MadFeature[] ?? []);
        }
    })

    return <Modal show={[show, setShow]} title={`${is_edit() ? "Edit" : "Add"} Feature`}>
        <div>
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

            <div>
                <Button onClick={() => setShow(false)}>
                    Cancel
                </Button>
                
                <Button onClick={save}>
                    {is_edit() ? "Update" : "Create"}
                </Button>
            </div>
        </div>
    </Modal>
}