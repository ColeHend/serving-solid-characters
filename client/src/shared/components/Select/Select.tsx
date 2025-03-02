import { Component, JSX, Show, splitProps } from "solid-js";
import useStyles from "../../../shared/customHooks/utility/style/styleHook";
import style from "./Select.module.scss";
import Option from "./Option";
interface SelectProps extends JSX.InputHTMLAttributes<HTMLSelectElement> {
    disableUnselected?: boolean;
    transparent?: boolean;
		tooltip?: string;
}
const Select: Component<SelectProps> = (props)=> {
  const [customProps, normalProps] = splitProps(props, ["disableUnselected", "class", "transparent", "tooltip"]);
  return (
    <select title={customProps.tooltip} {...normalProps} class={`${style.select} ${Object.keys(customProps).includes("transparent") || !!customProps.transparent ? style.transparent : ""} ${customProps.class ?? ""}`}>
      <Show when={!Object.keys(customProps).includes('disableUnselected') || !customProps.disableUnselected}>
        <Option value={''}>--------</Option>
      </Show>
      {props.children}
    </select>
  )
}
export { Select, Option };
export default Select;