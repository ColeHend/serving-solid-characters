import { Component, JSX } from "solid-js";
import { Portal } from "solid-js/web";
import useStyle from "../../customHooks/utility/style/styleHook";

type Props = {
    children?: JSX.Element,
    width: string,
    height: string,
    translateX?: string,
    translateY?: string,
}
const Modal:Component<Props> = (props)=>{
    const stylin = useStyle(); 

    return(
        <Portal>
            <div style={{
                    width:props.width, 
                    height:props.height,
                    transform: `translate(${props.translateX ?? "-50%"},${props.translateY ?? "-50%"})` 
                }} class={`${stylin.popup} ${stylin.primary}`}>
                {props.children}
            </div>
        </Portal>
    );
    
}

export default Modal;