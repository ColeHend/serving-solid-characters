import { FormField, Input, TextArea, FormGroup, Button, addSnackbar } from "coles-solid-library"
import { Accessor, Component, createMemo, Show } from "solid-js"
import { FlatCard } from "../../../../../../shared/components/flatCard/flatCard"
import { BackgroundForm } from "../../../../../../models/data/formModels"
import { Background } from "../../../../../../models/generated";
import styles from "../../Background.module.scss";

type event = MouseEvent & {
    currentTarget: HTMLButtonElement;
    target: Element;
}

interface SectionProps {
    formGroup: FormGroup<BackgroundForm>;
    existingBackgrounds: Accessor<Background[]>;
    srdBackgrounds: Accessor<Background[]>;
    clone: (e:event) => void;
    fill: (e:event) => void;
    delete: (e:event) => void;
}

export const Identity: Component<SectionProps> = (props) => {

    // const [userSettings,] = getUserSettings();
    
    // const dndSystem = createMemo(() => userSettings().dndSystem);

    const formGroup = props.formGroup;

    const homebrewBackgrounds = createMemo(() => props.existingBackgrounds());
    const srdBackgrounds = createMemo(()=> props.srdBackgrounds());

    const backgroundName = createMemo(()=> formGroup.get().name);

    const is_Exist = () => {
        const id = SelectBackgroundID();

        if (!id) return;

        return srdBackgrounds().some(x => x.id === id);
    }

    const isHomebrew = () => {
        const id = SelectBackgroundID();

        if (!id) return;

        return homebrewBackgrounds().some(x => x.id === id);
    }

    const SelectBackgroundID = () => {
        const BackgroundName = backgroundName();

        if (BackgroundName === "") return;

        const background = srdBackgrounds().find(x => x.name.toLowerCase().trim() === BackgroundName.toLowerCase().trim());

        if (!background) {
            return;
        }

        return background.id;
    }

    return <FlatCard headerName="Identity" icon="identity_platform" transparent startOpen>

        <div class={`${styles.NameBox}`}>
            <FormField name="Background Name" formName="name" required>
                <Input placeholder="Write an name..." />
            </FormField>
            
            <Show when={!isHomebrew() && is_Exist()}>
                <Button onClick={props.clone}>Clone</Button>
            </Show>

            <Show when={isHomebrew()}>
                <Button onClick={props.fill}>Fill</Button>
                <Button onClick={props.delete}>Delete</Button>
            </Show>
        </div>

        <div class={`${styles.descBox}`}>
            <FormField name="Background Description" formName="desc">
                <TextArea placeholder="Describe the background..." />
            </FormField>
        </div>
    </FlatCard>
}