import { Accessor, Component, Setter, useContext } from "solid-js";
import Modal from "../../popup/popup.component";
import { SharedHookContext } from "../../../../components/rootApp";
import style from "./damageCalculator.module.scss"
import Tabs, { Tab } from "../../Tabs/tabs";
import Button from "../../Button/Button";

interface Props {
    setter: Setter<boolean>;
    accssor: Accessor<boolean>;

}

const DamageCalulator:Component<Props> = (props) => {
    const sharedHooks = useContext(SharedHookContext);

    return <Modal 
    title="Damage Calculator"
    width={sharedHooks.isMobile() ? "100%" : "50%"} // fuck with it
    height={sharedHooks.isMobile() ? "100%" : "50%"}
    backgroundClick={[props.accssor,props.setter]}>
        <div class={`${style.wrapper}`}>
            <div class={`${style.header}`}>
                


            </div>


        </div>
    </Modal>
}
export default DamageCalulator;