import { Accessor, Component, createMemo } from "solid-js";
import { Clone, FeatureDetail } from "../../../../../../shared";
import { Button, Cell, Column, Header, Table } from "coles-solid-library";
import { DebugConsole } from "../../../../../../shared/customHooks/DebugConsole";

interface props {
    toggleFeature: (featureName: string) => void;
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
        const splitDesc = desc.substring(0, 35).split("\n");
        
        if (splitDesc) {
            const toReturn = splitDesc[0] += "...";

            return toReturn;
        }

        return null;
    } 

    return <div>
        <div>
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
                        {feature => <Button>{!isCurrent(feature.id) ? "learn" : "unlearn"}</Button>}
                    </Cell>
                </Column>
            </Table>
        </div>
    </div>
} 