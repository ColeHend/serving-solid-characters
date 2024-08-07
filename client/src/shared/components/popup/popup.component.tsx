// @ts-nocheck
/* use:clickOutside is not actually an error! Solid fixes on compile! */
import { Accessor, Component, JSX, Setter, createMemo, createSignal, useContext } from "solid-js";
import { Portal, effect } from "solid-js/web";
import clickOutside from "../../../shared/customHooks/utility/clickOutside";
import Button from "../Button/Button";
import { SharedHookContext } from "../../../components/rootApp";
import userSettings from "../../customHooks/userSettings";
import useStyles from "../../customHooks/utility/style/styleHook";
import getUserSettings from "../../customHooks/userSettings";
type Props = {
    title?: string,
    children?: JSX.Element,
    width: string,
    height: string,
    translate?: {
        x?: string,
        y?: string
    }
    backgroundClick?: [ Accessor<boolean>, Setter<boolean>]
}

/**
 * 
 * @param width {string} {string} - The css width of the modal.
 * @param height {string} {string} - The css height of the modal.
 * @param translate {x{x: string, y: string} - Override the default x and y coordinates of the modal.
 * @param backgroundClick [Accessor <bool>, Setter <bool>] - A signal and setter for enabling the background click.
 * @returns - A Modal component.
 */
const Modal:Component<Props> = (props)=>{
    const [userSettings, setUserSettings] = getUserSettings();
    const sharedHooks = useContext(SharedHookContext);
    const stylin = createMemo(()=>useStyles(userSettings().theme)); 
    const [backClick, setBackClick] = props.backgroundClick ?? createSignal(true);
    const defaultX = props.translate?.x ?? "-50%";
    const defaultY = props.translate?.y ?? "-50%";
    return(
        <Portal >
            <div use:clickOutside={()=>setBackClick(old => !old)} style={{
                    width:props.width, 
                    height:props.height,
                    transform: `translate(${defaultX},${defaultY})`,
                    padding: "0px",
                    "padding-bottom": "5px" 
                }} class={`${stylin()?.popup} ${stylin()?.primary}`}>
                <div class={stylin()?.accent} style="display:flex; justify-content:space-between;">
                    <h2 style="margin-left: 5%">
                        {props.title ?? "Modal"}
                    </h2>
                    <Button onClick={()=>setBackClick(old => !old)}><b>X</b></Button>
                </div>
                {props.children}
            </div>
        </Portal>
    );
    
}

export default Modal;