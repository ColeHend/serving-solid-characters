import { FormField, Select, Chip, Option } from "coles-solid-library";
import { Accessor, Component, createMemo, For, Show } from "solid-js";
import { FlatCard } from "../../../../../../shared/components/flatCard/flatCard";
import { Feat } from "../../../../../../models/generated";
import { Markdown } from "../../../../../../shared";
import { Stars2 } from "coles-solid-library/icons";

interface SectionProps {
    featID: Accessor<string>;
    getSelectedFeat:  (id: string) => Feat | null;
    originFeats: Accessor<Feat[]>;
}

export const OriginFeat:Component<SectionProps> = (props) => {

    const featID = createMemo(() => props.featID());
    const originFeats = createMemo(() => props.originFeats());

    return <FlatCard headerName={<div>
        <span>
            Origin Feat<Show when={featID() !== ""}>: {props.getSelectedFeat(featID())?.details.name}</Show>
        </span>
    </div>} icon={Stars2} transparent getRidOfTopBorder>
        <FormField name="Select Feat" formName="feat">
            <Select>
                <For each={originFeats()}>
                    {(feat)=> <Option value={feat.id}>
                        {feat.details.name}
                    </Option>}
                </For>
            </Select>
        </FormField>

        <Show when={featID() !== ""}>
            <Chip value={`${props.getSelectedFeat(featID())?.details.name}`} />
            
            <Markdown text={props.getSelectedFeat(featID())?.details.description ?? ''} />  
        </Show>
    </FlatCard>
}