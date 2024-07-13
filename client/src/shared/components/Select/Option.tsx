import { Component, JSX } from "solid-js"
import style from "./Select.module.scss";

const Option: Component<JSX.OptionHTMLAttributes<HTMLOptionElement>> = (props)=> {
    return (
        <option
        {...props}
        class={`${style.option} ${props.class ?? ""}`}
        />
    )
}

export default Option;