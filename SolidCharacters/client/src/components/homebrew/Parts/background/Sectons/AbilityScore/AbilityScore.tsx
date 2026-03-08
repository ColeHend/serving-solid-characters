import { FormGroup, Chip, FormField, Select, Option } from "coles-solid-library";
import { Accessor, Component, createMemo, For, Show } from "solid-js";
import { BackgroundForm } from "../../../../../../models/data/formModels";
import { FlatCard } from "../../../../../../shared/components/flatCard/flatCard";

interface SectionProps {
    abilityScores: Accessor<string[]>;
    formGroup: FormGroup<BackgroundForm>;
    allStats: string[];
}

export const AbilityScore: Component<SectionProps> = (props) => {

    const formGroup = props.formGroup;

    const abilityScores = createMemo(() => props.abilityScores());
    const allStats = createMemo(() => props.allStats);

    const remove = (value: string) => {
        formGroup.set("abilityOptions",abilityScores().filter(stat => stat !== value));
    }

    return <FlatCard headerName={`Ability Choices (${abilityScores().length}/3)`} icon="electric_bolt" transparent>
        <FormField name="Add Ability" formName="abilityOptions">
            <Select disabled={abilityScores().length >= 3} multiple onChange={() => {
                if (abilityScores().length >= 3) {
                    return;
                }
            }}>
                <For each={allStats()}>
                    {stat => <Option value={stat}>{stat}</Option>}
                </For>
            </Select>
        </FormField>

        <Show when={abilityScores().length > 0} fallback={<Chip value="None" />}> 
            <For each={abilityScores()}>
                {(score) => <Chip value={score} remove={()=>remove(score)} />}
            </For>
        </Show>
    </FlatCard>
}