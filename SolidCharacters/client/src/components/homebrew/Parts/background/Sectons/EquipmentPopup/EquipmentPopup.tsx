import { FormField, Input, Modal } from "coles-solid-library";
import { Accessor, Component, Setter } from "solid-js";
import { srdItem } from "../../../../../../models/data/generated";

interface PopupProps {
    show: [Accessor<boolean>, Setter<boolean>];
    startItemKeys: Accessor<string[]>;
    startingEquipment: [Accessor<Record<string, string>>,Setter<Record<string, string>>];
    allItems: Accessor<srdItem[]>;
}

export const EquipmentPopup: Component<PopupProps> = (props) => {
    const [show, setShow] = props.show;

    return <Modal show={[show, setShow]} title="Add A Choice!">
        <div>
            <FormField name="Opiton key">
                <Input />
            </FormField>

            

        </div>
    </Modal>
}