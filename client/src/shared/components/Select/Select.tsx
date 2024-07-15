import { Component, JSX, Show } from "solid-js";
import useStyles from "../../../shared/customHooks/utility/style/styleHook";
import style from "./Select.module.scss";
import Option from "./Option";
interface SelectProps extends JSX.InputHTMLAttributes<HTMLSelectElement> {
    disableUnselected?: boolean;
}
const Select: Component<SelectProps> = (props)=> {

    return (
        <select {...props} class={`${style.select} ${props.class ?? ""}`}>
            <Show when={!!!props.disableUnselected}>
                <Option>--------</Option>
            </Show>
            {props.children}
        </select>
    )
}
export { Select };
export default Select;