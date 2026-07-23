import { Button, Checkbox, FormField, Input, Option, Select } from "coles-solid-library";
import { Accessor, Component, createMemo, createSignal, For, Show } from "solid-js";
import { ALL_LANGUAGES } from "../../../../../../shared/customHooks/mads/languagePool";

interface props {
    toggleValue: (name: string, extra?: { options?: string; count?: string }) => void;
    getValue: Accessor<Record<string, string> | undefined>;
    /** Enables the "player chooses" form (AddLanguages only — Remove has no choice form). */
    allowChoice?: boolean;
}

export const LanguagesFeature: Component<props> = (props) => {

    const madValue = createMemo(() => props.getValue());

    const getMadValue = (key: string) => {
        return madValue()?.[key];
    }

    const name = createMemo(() => getMadValue("name") ?? "");

    const [currLanguage, setLanguage] = createSignal<string>(name() === "choice" ? "" : name());
    const [isChoice, setIsChoice] = createSignal(name() === "choice");
    const [options, setOptions] = createSignal<string[]>((getMadValue("options") ?? "").split(",").map(s => s.trim()).filter(Boolean));
    const [curated, setCurated] = createSignal(options().length > 0);
    const [count, setCount] = createSignal(+(getMadValue("count") ?? "1") || 1);

    const toggleOption = (language: string) => {
        setOptions(old => old.includes(language) ? old.filter(o => o !== language) : [...old, language]);
    };

    const commit = () => {
        if (!isChoice()) {
            props.toggleValue(currLanguage().trim());
        } else if (curated()) {
            props.toggleValue("choice", { options: options().join(","), count: `${count()}` });
        } else {
            props.toggleValue("choice", { count: `${count()}` });
        }
    };

    return <div>
        <Show when={props.allowChoice}>
            <Checkbox
                label="Let the player choose the language(s)"
                checked={isChoice()}
                onChange={() => setIsChoice(v => !v)}
            />
        </Show>

        <Show when={!isChoice()}>
            <FormField name="Selected Language">
                <Select value={currLanguage()} onChange={(val) => setLanguage(val)}>
                    <For each={ALL_LANGUAGES}>
                        {(lang) => <Option value={lang}>{lang}</Option>}
                    </For>
                </Select>
            </FormField>
        </Show>

        <Show when={isChoice()}>
            <Checkbox
                label="Limit to a curated list"
                checked={curated()}
                onChange={() => setCurated(v => !v)}
            />

            <Show when={curated()} fallback={<p>The player may pick any language.</p>}>
                <FormField name="Allowed languages">
                    <div>
                        <For each={ALL_LANGUAGES}>
                            {(lang) => (
                                <Checkbox
                                    label={lang}
                                    checked={options().includes(lang)}
                                    onChange={() => toggleOption(lang)}
                                />
                            )}
                        </For>
                    </div>
                </FormField>
            </Show>

            <FormField name="How many the player picks">
                <Input value={count()} type="number" min={1} onChange={(e) => setCount(Math.max(1, +e.currentTarget.value || 1))} />
            </FormField>
        </Show>

        <Button
            disabled={isChoice() ? (curated() && options().length === 0) : !currLanguage().trim()}
            onClick={commit}
        >
            Set Languages
        </Button>
    </div>
}
