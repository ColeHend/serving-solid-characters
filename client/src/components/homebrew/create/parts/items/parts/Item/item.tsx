import { Component } from "solid-js";
import { Item } from "../../../../../../../models";
import { SetStoreFunction } from "solid-js/store";
import { useSearchParams } from "@solidjs/router";

interface props {
    newItem: Item,
    setNewItem: SetStoreFunction<Item>,
}

const CreateItem:Component<props> = (props) => {

    const [searchParams,setSearchParams] = useSearchParams();

    return <div>
        <p>description</p>
        <p>cost</p>
        <p>weight</p>
        <p>consumable</p>
    </div>
}
export default CreateItem;