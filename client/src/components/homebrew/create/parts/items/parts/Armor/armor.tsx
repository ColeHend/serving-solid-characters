import { Component } from "solid-js";
import { Armor } from "../../../../../../../shared";
import { SetStoreFunction } from "solid-js/store";

interface props {
    newArmor: Armor,
    setNewArmor: SetStoreFunction<Armor>
}

const CreateArmor:Component<props> = (props)=>{

    return <div>
        <p>armor class</p>
        <p>strength requirement</p>
        <p>stealth disadvantage</p>
        <p>description</p>
        <p>cost</p>
        <p>weight</p>
    </div>
}
export default CreateArmor;