import { FormField, Select, Option } from "coles-solid-library";
import { Component, createMemo, For } from "solid-js";
import { FlatCard } from "../../../../shared/components/flatCard/flatCard";
import styles from "./languageSection.module.scss";

interface sectionProps {

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

    return <FlatCard icon="chat" headerName="Languages">
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