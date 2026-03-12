import { FormField, Select, Chip, Option } from "coles-solid-library";
import { Accessor, Component, createMemo, For, Show } from "solid-js";
import { FlatCard } from "../../../../../../shared/components/flatCard/flatCard";
import { Feat } from "../../../../../../models/generated";
import { Markdown } from "../../../../../../shared";

interface SectionProps {
    featID: Accessor<string>;
    getSelectedFeat:  (id: string) => Feat | null;
    originFeats: Accessor<Feat[]>;
}

export const OriginFeat:Component<SectionProps> = (props) => {

    const featID = createMemo(() => props.featID());
    const originFeats = createMemo(() => props.originFeats());

    return <FlatCard headerName="Origin Feat" icon='stars_2' transparent>
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