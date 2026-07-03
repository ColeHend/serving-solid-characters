import { Accessor, Component, createMemo, createSignal } from "solid-js";
import { Button, FormField, Input, TextArea } from "coles-solid-library";

interface props {
    toggleValue: (name: string, description: string, category: string) => void;
    getValue: Accessor<Record<string, string> | undefined>;
}

export const ClassFeature: Component<props> = (props) => {
    const madValue = createMemo(() => props.getValue());

    const GetMadValue = (key: string): string => {
        return madValue()?.[key] || "";
    }

    const [name, setName] = createSignal(GetMadValue("name"));
    const [description, setDescription] = createSignal(GetMadValue("description"));
    const [category, setCategory] = createSignal(GetMadValue("category"));

    return <div>
        <FormField name="Feature Name">
            <Input
                value={name()}
                onInput={(e) => setName(e.currentTarget.value)}
                placeholder="e.g. Agonizing Blast, Archery, Cleave..."
            />
        </FormField>

        <FormField name="Description">
            <TextArea
                text={description}
                setText={(e) => setDescription(e.toString())}
                placeholder="The rules text of this pick."
            />
        </FormField>

        <FormField name="Category">
            <Input
                value={category()}
                onInput={(e) => setCategory(e.currentTarget.value)}
                placeholder="e.g. Eldritch Invocation, Fighting Style, Weapon Mastery..."
            />
        </FormField>

        <Button onClick={() => props.toggleValue(name().trim(), description(), category().trim())}>
            Set Feature
        </Button>
    </div>
}
