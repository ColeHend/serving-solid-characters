import { Component, JSX } from "solid-js";
import useStyles from "../../../shared/customHooks/utility/style/styleHook";
import style from "./input.module.scss";

const Input: Component<JSX.InputHTMLAttributes<HTMLInputElement>> = (props)=> {
    return (
        <input
        {...props}
        class={`${style.input} ${props.class ?? ""}`}
        />
    )
}
export { Input };
export default Input;