import { FormGroup, Chip } from "coles-solid-library";
import { Accessor, Component, createMemo, For, Show } from "solid-js";
import { BackgroundForm } from "../../../../../../models/data/formModels";
import { FlatCard } from "../../../../../../shared/components/flatCard/flatCard";

interface SectionProps {
    abilityScores: Accessor<string[]>;
    formGroup: FormGroup<BackgroundForm>;
}

export const AbilityScore: Component<SectionProps> = (props) => {

    const formGroup = props.formGroup;

    const abilityScores = createMemo(() => props.abilityScores());

    return <FlatCard headerName="Ability Choices" icon="electric_bolt" transparent>
        <Show when={abilityScores().length > 0} fallback={<Chip value="None" />}> 
            <For each={abilityScores()}>
                {(score) => <Chip value={score} />}
            </For>
        </Show>
    </FlatCard>
}