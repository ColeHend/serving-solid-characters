import { Accessor, Component, createEffect, createMemo, Show } from "solid-js";
import { Clone, FeatureDetail } from "../../../../../../shared";
import { Button, Cell, Column, Header, Table } from "coles-solid-library";
import styles from "./existingFeature.module.scss";

interface props {
    toggleFeature: (featureID: string) => void;
    allFeatures: Accessor<FeatureDetail[]>;
    getValue: Accessor<Record<string, string> | undefined>;
}

export const ExistingFeature: Component<props> = (props) => {

    const allFeatures = createMemo(() => props.allFeatures());
    const madValue = createMemo(() => props.getValue());

    const getMadValue = (key: string) => {
        const toReturn = madValue()?.[key];

        if (toReturn) {
            return Clone(toReturn);
        } else {
            return null;
        }
    };

    const featureID = createMemo(() => getMadValue("ID") ?? "");

    const isCurrent = (ID: string) => featureID() === ID;

    const getFeature = (ID: string) => allFeatures().find((feature) => feature.id === ID);

    const currentFeature = createMemo(() => getFeature(featureID()));

    const columns = ["name","short desc","action"]
    
    const shortDesc = (desc: string): string|null => {
        let splitDesc = desc.substring(0, 45);

        if (splitDesc) {
            const toReturn = splitDesc += "...";

            return toReturn;
        }

        return null;
    } 

    createEffect((() => {
        console.log("features: ", allFeatures());
    }))

    return <div style={{display: "flex", "flex-direction": "row", gap: "1rem"}}>
        <div class={`${styles.FeatureTable}`}>
            <Table data={allFeatures} columns={columns}>
                <Column name="name">
                    <Header>Header</Header>
                    <Cell<FeatureDetail>>
                        {feature => <span>
                            {feature.name}
                        </span>}
                    </Cell>
                </Column>

                <Column name="short desc">
                    <Header>Short Desc</Header>

                    <Cell<FeatureDetail>>
                        {feature => <span>
                            {shortDesc(feature.description)}
                        </span>}
                    </Cell>
                </Column>

                <Column name="action">
                    <Header><></></Header>
                    <Cell<FeatureDetail>>
                        {feature => <Button onClick={()=>props.toggleFeature(feature.id)}>{!isCurrent(feature.id) ? "learn" : "unlearn"}</Button>}
                    </Cell>
                </Column>
            </Table>
        </div>
        <div>
            <p>
                <strong>Name: </strong>
                {currentFeature()?.name}
            </p>

            <p>
                <strong>Description: </strong>
            </p>
            <p>
                {currentFeature()?.description}
            </p>

            <Show when={currentFeature()?.metadata?.mads} fallback={<p><strong>Character Changes:</strong> None</p>}>
                <p>
                    <strong>Character Changes:</strong>
                    {currentFeature()?.metadata?.mads?.map(mad => {
                        const keys = Object.keys(mad.value);
                        
                        return <span>
                            {mad.command} {keys.map(key => `${key}: ${mad.value[key]}`).join(", ")}
                        </span>
                    })}
                </p>
            </Show>
        </div>
    </div>
} 
