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
    },
    backgroundClick?: [ Accessor<boolean>, Setter<boolean>],
		setClose?: Setter<boolean>,
		ref?: Accessor<HTMLDivElement | undefined>
}

/**
 * 
 * @param title {string} {string} - The title of the modal.
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
    const services = useInjectServices();
    const defaultX = props.translate?.x ?? "-50%";
    const defaultY = props.translate?.y ?? "-50%";
		const [popupRef, setPopupRef] = createSignal<HTMLDivElement>();
		useClickOutside(() => !!props.ref ? props.ref(): popupRef(), ()=>{
			setBackClick(old => !old);
		})
    return(
        <Portal ref={(el) => setPopupRef(el)}>
            <div style={{
                    width: !!props.width ? props.width : services.isMobile() ? "90vw":"45vw", 
                    height: !!props.height ? props.height : services.isMobile() ? "90vh":"60vh",
                    transform: `translate(${defaultX},${defaultY})`,
                    padding: "0px",
                    "padding-bottom": "5px",
										'padding-top': '3.8rem',
										overflow: 'hidden'
                }} class={`${stylin()?.popup} ${stylin()?.primary}`}>
                <div class={stylin()?.accent} style={{
										display:'flex', 
										'justify-content':'space-between',
										'position':'fixed',
										top:0, left:0, right:0
									}
								}>
                    <h2 style="margin-left: 5%">
                        {props.title ?? "Modal"}
                    </h2>
                    <span><Button onClick={()=>props.setClose ? props.setClose(old => !old) : setBackClick(old => !old)}><b>X</b></Button></span>
                    
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