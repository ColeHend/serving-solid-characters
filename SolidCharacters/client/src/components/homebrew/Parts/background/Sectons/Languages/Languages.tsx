import { Accessor, Component, createMemo, createSignal, For, Setter, Show } from "solid-js";
import { FlatCard } from "../../../../../../shared/components/flatCard/flatCard";
import { Chip, FormField, FormGroup, Select, Option, Input, Button, addSnackbar } from "coles-solid-library";
import { BackgroundForm } from "../../../../../../models/data/formModels";
import styles from "../../Background.module.scss";

interface SectionProps {
    languages: [Accessor<string[]>, Setter<string[]>];
    form: FormGroup<BackgroundForm>;
    allLangs: string[];
}

export const Languages: Component<SectionProps> = (props) => {
    // const formGroup = props.form;
    const [languages, setLanguages] = props.languages;
    const allLangs = createMemo(() => props.allLangs);

    const [langSelect, setLangSelect] = createSignal("");
    const [customLang, setCustomLang] = createSignal("");


    const handleClick = () => {
        const language = langSelect() === "Other/Text" ? customLang() : langSelect();

        if (languages().includes(language)) {
            addSnackbar({
                severity: "warning",
                message: "Language already added!"
            })
            setCustomLang("");
            return;
        }

        setLanguages(old => [...old, language]);

        if (langSelect() === "Other/Text") setCustomLang("");
    }

    return <FlatCard headerName={<div>
        <span>
            Languages<Show when={languages().length > 0}>: {languages().join(", ")}</Show>
        </span>
    </div>} icon="chat" transparent>
        <div class={`${styles.LangSelectBox}`}>
            <FormField name="Select Language" form="langSelect">
                <Select value={langSelect()} onChange={(e) => setLangSelect(e)}>
                    <For each={allLangs().filter(lang => !languages().includes(lang))}>
                        {lang => <Option value={lang}>{lang}</Option>}
                    </For>
                    <Option value="Other/Text">Other/Text</Option>
                </Select>
            </FormField>

            <FormField name="Choice Amount" formName="langChoiceAmount">
                <Input type="number" min={1} value={1}/>
            </FormField>
        </div>

        <div class={`${styles.LangSelectBox}`}>
            <Show when={langSelect() === "Other/Text"}>
                <FormField name="Custom Language" formName="customLang">
                    <Input value={customLang()} oninput={(e) => setCustomLang(e.currentTarget.value)} />
                </FormField>
            </Show>

            <Button onClick={handleClick}>Add Language</Button>
        </div>
        
        <div class={`${styles.LangSelectBox}`}>
            <Show when={languages().length > 0} fallback={<Chip value="None"/>}>
                <For each={languages()}>
                    {language => <Chip value={language} remove={() => setLanguages(old => old.filter(lang => lang !== language))}/> }
                </For>
            </Show>
        </div>
    </FlatCard>
}