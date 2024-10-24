import { useSearchParams } from "@solidjs/router";
import { Component } from "solid-js";
import { Weapon } from "../../../../../../../shared";
import { SetStoreFunction } from "solid-js/store";

interface props {
    newWeapon: Weapon,
    setNewWeapon: SetStoreFunction<Weapon>
}

const CreateWeapon:Component<props> = (props)=> {

    const [searchParam,setSearchParam] = useSearchParams();
     

    return <div>
    <p>damage</p>
    <p>properties</p>
    <p>description</p>
    <p>cost</p>
    <p>weight</p>
    <p>description</p>
</div>
}
export default CreateWeapon;