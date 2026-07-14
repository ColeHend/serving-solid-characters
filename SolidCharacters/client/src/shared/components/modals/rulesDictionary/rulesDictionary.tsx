import { Modal } from "coles-solid-library";
import { Accessor, Component, Setter } from "solid-js";

interface RulesDictProps {
    show: Accessor<boolean>;
    setShow: Setter<boolean>;
}
export const RulesDictionary: Component<RulesDictProps> = (props) => {

    return (
        <Modal title="Rules Dictionary" show={[props.show, props.setShow]}>Rules Dictionary</Modal>
    )
}