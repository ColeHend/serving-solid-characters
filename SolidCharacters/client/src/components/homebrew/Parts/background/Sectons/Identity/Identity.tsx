import { FormField, Select, Input, TextArea, Option, FormGroup } from "coles-solid-library"
import { Component } from "solid-js"
import { FlatCard } from "../../../../../../shared/components/flatCard/flatCard"
import { BackgroundForm } from "../../../../../../models/data/formModels"

interface SectionProps {
    formGroup: FormGroup<BackgroundForm>;
}

export const Identity: Component<SectionProps> = (props) => {

    const formGroup = props.formGroup;

    return <FlatCard headerName="Identity" icon="identity_platform" transparent startOpen>
        <FormField name="Select Background" formName="name" required>
            <Select>
                <Option value="+ New Background">+ New Background</Option>
            </Select>
        </FormField>

        <FormField name="Background Name" formName="newName" required>
            <Input placeholder="Write an name..." />
        </FormField>

        <FormField name="Background Description" formName="desc">
            <TextArea placeholder="Describe the background..." />
        </FormField>
    </FlatCard>

}