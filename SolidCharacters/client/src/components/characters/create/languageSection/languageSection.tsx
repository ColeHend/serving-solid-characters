import { FormField, Select, Option, FormGroup, Chip } from "coles-solid-library";
import { Component, createMemo, For, Show } from "solid-js";
import { FlatCard } from "../../../../shared/components/flatCard/flatCard";
import styles from "./languageSection.module.scss";
import { CharacterForm } from "../../../../models/character.model";

interface sectionProps {
    group: FormGroup<CharacterForm>
}

export const LanguageSection:Component<sectionProps> = (props) => {

    const form = props.group;

    const languages = createMemo<string[]>(()=>[
        "Undercommon",
        "Abyssal",
        "Infernal",
        "Celestial",
        "Primordial",
        "Draconic",
        "Dwarvish",
        "Elvish",
        "Giant",
        "Gnomish",
        "Goblin",
        "Halfling",
        "Orc",
        "Sylvan",
        "Deep Speech",
    ])

    const hasError = createMemo(()=>form.hasError("languages"));

    const getLanguages = ():string[] => {
        return form.get().languages;
    }

    return <FlatCard icon="chat" headerName={<div>
        Languages: Common<Show when={getLanguages().length > 0}>,</Show> {getLanguages().join(", ")}
    </div>} transparent>
        <div class={`${styles.languageSection}`}>
            <div>
                You know Common and two other languages.    
            </div>
            
            <div class={`${styles.langSelect}`}>
                <FormField name="Languages" formName="languages">
                    <Select disabled={getLanguages().length === 2} multiple>
                        <For each={languages()}>
                            {(lang)=><Option value={lang}>
                                {lang}
                            </Option>}
                        </For>
                    </Select>
                </FormField>
            </div>

            <Show when={hasError()}>
                <div class={`${styles.errorMessage}`}>
                    You can't select more than two additional languages; you already know Common.
                </div>
            </Show>

            <div>
                <For each={getLanguages()}>
                    {lang => <Chip value={lang} remove={() => form.set("languages", getLanguages().filter(old => old !== lang))} />}
                </For>
            </div>

            
        </div>
    </FlatCard>
}