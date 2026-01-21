import { Accessor, Component, JSX } from "solid-js";
import { Item } from "../../../../../models/data";

interface props {
    children: JSX.Element;
    allItems: Accessor<Item[]>;
}

export const AddItem: Component<props> = (props) => {
    

    return <div>
        {props.children};
    </div>
}