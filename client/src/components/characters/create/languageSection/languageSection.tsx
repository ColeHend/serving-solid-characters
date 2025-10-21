import { FormField, Select, Option, FormGroup } from "coles-solid-library";
import { Component, createMemo, For, Show } from "solid-js";
import { FlatCard } from "../../../../shared/components/flatCard/flatCard";
import styles from "./languageSection.module.scss";
import { CharacterForm } from "../../../../models/character.model";

interface sectionProps {
    group: FormGroup<CharacterForm>
}

export const LanguageSection:Component<sectionProps> = (props) => {

    const lanugaes = createMemo<string[]>(()=>[
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

    const getLanguages = ():string[] => {
        return props.group.get("languages");
    }

    return <FlatCard icon="chat" headerName={<div>
        Languages: Common<Show when={getLanguages().length > 0}>,</Show> {getLanguages().join(", ")}
    </div>}>
        <div class={`${styles.languageSection}`}>
            <div>
                You know Common and two other languages.    
            </div>
            
            <div class={`${styles.langSelect}`}>
                <FormField name="Languages" formName="languages">
                    <Select multiple>
                        <For each={lanugaes()}>
                            {(lang)=><Option value={lang}>
                                {lang}
                            </Option>}
                        </For>
                    </Select>
                </FormField>
            </div>
        </div>
    </FlatCard>
}