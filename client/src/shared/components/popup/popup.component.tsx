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
import style from "./popup.module.scss";
type Props = {
    title?: string,
    children?: JSX.Element,
    width: string,
    maxHeight?: string,
    maxWidth?: string,
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
 * @param maxWidth {string} {string} - The optional css max-width of the modal.
 * @param height {string} {string} - The css height of the modal.
 * @param maxHeight {string} {string} - The optional css max-height of the modal.
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
            <div 
                use:clickOutside={()=>setBackClick(old => !old)} 
                style={{
                    width:props.width, 
                    height:props.height,
                    "max-height":props.maxHeight,
                    "max-width":props.maxWidth,
                    transform: `translate(${defaultX},${defaultY})`
                }} 
                class={`${stylin()?.popup} ${stylin()?.primary} ${style.wrapper}`}
            >
                <div class={`${stylin()?.accent} ${style.header}`} >
                    <h2>
                        {props.title ?? "Modal"}
                    </h2>
                    <span><Button onClick={()=>setBackClick(old => !old)}><b>X</b></Button></span>
                    
                </div>
                {props.children}
            </div>
        </Portal>
    );
    
}

export default Modal;