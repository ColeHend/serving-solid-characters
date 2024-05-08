// @ts-nocheck
/* use:clickOutside is not actually an error! Solid fixes on compile! */
import { Accessor, Component, JSX, Setter, createSignal } from "solid-js";
import { Portal, effect } from "solid-js/web";
import useStyle from "../../customHooks/utility/style/styleHook";
import clickOutside from "../../customHooks/utility/clickOutside";
type Props = {
    children?: JSX.Element,
    width: string,
    height: string,
    translate?: {
        x?: string,
        y?: string
    },
    translateX?: string,
    translateY?: string,
    backgroundClick?: [ Accessor<boolean>, Setter<boolean>]
}

const Modal:Component<Props> = (props)=>{
    const stylin = useStyle(); 
    const [backClick, setBackClick] = props.backgroundClick ?? createSignal(true);

    return(
        <Portal >
            <div use:clickOutside={()=>setBackClick(!backClick())} style={{
                    width:props.width, 
                    height:props.height,
                    transform: `translate(${props.translate.x ?? "-50%"},${props.translate.y ?? "-50%"})` 
                }} class={`${stylin.popup} ${stylin.primary}`}>
                {props.children}
            </div>
        </Portal>
    );
    
}

export default Modal;