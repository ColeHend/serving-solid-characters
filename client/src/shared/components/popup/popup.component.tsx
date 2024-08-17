/* use:clickOutside is not actually an error! Solid fixes on compile! */
import { Accessor, Component, JSX, Setter, createMemo, createSignal, useContext } from "solid-js";
import { Portal, effect } from "solid-js/web";
import clickOutside from "../../../shared/customHooks/utility/clickOutside";
import Button from "../Button/Button";
import { SharedHookContext } from "../../../components/rootApp";
import userSettings from "../../customHooks/userSettings";
import useStyles from "../../customHooks/utility/style/styleHook";
import getUserSettings from "../../customHooks/userSettings";
import { useInjectServices } from "../..";
import useClickOutside from "solid-click-outside";
type Props = {
    title?: string,
    children?: JSX.Element,
    width?: string,
    height?: string,
    translate?: {
        x?: string,
        y?: string
    }
    backgroundClick?: [ Accessor<boolean>, Setter<boolean>]
}

const Modal:Component<Props> = (props)=>{
    const [userSettings, setUserSettings] = getUserSettings();
    const sharedHooks = useContext(SharedHookContext);
    const stylin = createMemo(()=>useStyles(userSettings().theme)); 
    const [backClick, setBackClick] = props.backgroundClick ?? createSignal(true);
    const services = useInjectServices();
    const defaultX = props.translate?.x ?? "-50%";
    const defaultY = props.translate?.y ?? "-50%";
		const [popupRef, setPopupRef] = createSignal<HTMLDivElement>();
		useClickOutside(popupRef, ()=>{
			setBackClick(old => !old);
		})
    return(
        <Portal >
            <div ref={setPopupRef} style={{
                    width: !!props.width ? props.width : services.isMobile() ? "90vw":"45vw", 
                    height: !!props.height ? props.height : services.isMobile() ? "90vh":"60vh",
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
declare module "solid-js" {
    namespace JSX {
      interface Directives {
        clickOutside: () => void;
      }
    }
  }
export default Modal;