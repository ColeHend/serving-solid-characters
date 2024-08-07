import { Component, createMemo, createSignal, For, Show } from "solid-js";
import { Subclass } from "../../../../models/class.model";
import { classFeatureNullCheck } from "../../../customHooks/utility/Tools";
import Modal from "../../popup/popup.component";
import getUserSettings from "../../../customHooks/userSettings";
import useStyle from "../../../customHooks/utility/style/styleHook";

interface Props {
    subclass: Subclass;
}
const SubclassModal:Component<Props> = (props) => {
    const [showModal, setShowModal] = createSignal(false);
    const [userSettings, setUserSettings] = getUserSettings();
    const stylin = createMemo(()=>useStyle(userSettings().theme));
    return (
        <li>
           <span class={`${stylin()?.hover}`} onClick={()=>setShowModal(old=>!old)}>
            {props.subclass.name}
            </span> 
            <Show when={showModal()}>
                <Modal width="50vw" height="max-content" backgroundClick={[showModal, setShowModal]} >
                    <div>
                    <h3>{props.subclass.name}</h3>
                    <span>
                        {props.subclass.desc?.join(" \n")}
                    </span>
                    <br />
                    <span>
                        {props.subclass.subclassFlavor}
                    </span>
                    <br />
                    <Show when={props.subclass.spells?.length >= 1}>
                        <h4>Spells Gained</h4>
                        <span>{
                            props.subclass.spells?.join("\n")
                        }</span>
                        <br />
                    </Show>
                    <span>
                        <For each={props.subclass.features}>{(feature) =>
                            <>
                                <h5> {feature.name} </h5>
                                <span> {classFeatureNullCheck(feature?.value)} </span>
                            </>
                        }</For>
                    </span>
                </div>
                </Modal>
            </Show>
        </li>
    )
}
export default SubclassModal;