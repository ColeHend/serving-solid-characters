import { Component, JSX, splitProps } from "solid-js";
import useStyles from "../../../shared/customHooks/utility/style/styleHook";
import style from "./input.module.scss";

interface InputProps extends JSX.InputHTMLAttributes<HTMLInputElement> {
    tooltip?: string;
    transparent?: boolean;
}
const Input: Component<InputProps> = (props)=> {
    const [customProps, normalProps] = splitProps(props, ["tooltip", "transparent"]);
    const noTransparent = (type?: string) => ["checkbox"].includes(type ?? "text");
    return (
        <input
        {...normalProps}
        class={`${style.input} ${customProps.transparent && !noTransparent(normalProps.type) ? style.transparent : ""} ${props.class ?? ""}`}
        title={customProps.tooltip}
        />
    )
}
export { Input };
export default Input;