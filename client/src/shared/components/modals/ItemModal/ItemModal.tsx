import { Modal } from "coles-solid-library";
import { Component,Accessor, Setter } from "solid-js";
import { Item } from "../../../../models/data";

interface modalProps {
    item: Accessor<Item>;
    show: [Accessor<boolean>, Setter<boolean>];
}

const itemPopup:Component<modalProps> = (props) => {
    const currentItem = props.item();

    
    return <Modal title={`${currentItem.name}`} show={props.show}>
        <div>Item Popup</div>
    </Modal>
}