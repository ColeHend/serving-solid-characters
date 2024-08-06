import { Component, JSX, Show, splitProps } from "solid-js";
import useStyles from "../../../shared/customHooks/utility/style/styleHook";
import style from "./Select.module.scss";
import Option from "./Option";
interface SelectProps extends JSX.InputHTMLAttributes<HTMLSelectElement> {
    disableUnselected?: boolean;
    transparent?: boolean;
}
const Select: Component<SelectProps> = (props)=> {
    const [customProps, normalProps] = splitProps(props, ["disableUnselected", "class", "transparent"]);
    return (
        <select {...normalProps} class={`${style.select} ${!!customProps.transparent ? style.transparent : ""} ${customProps.class ?? ""}`}>
            <Show when={!!!customProps.disableUnselected}>
                <Option>--------</Option>
            </Show>
            {props.children}
        </select>
    )
}
export { Select, Option };
export default Select;