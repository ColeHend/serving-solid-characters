import { Component, createMemo, JSX } from "solid-js"
import style from "./Select.module.scss";
import { useInjectServices } from "../../customHooks/injectServices";
import getUserSettings from "../../customHooks/userSettings";
import useStyle from "../../customHooks/utility/style/styleHook";

const Option: Component<JSX.OptionHTMLAttributes<HTMLOptionElement>> = (props)=> {
  const sharedHooks = useInjectServices();
  const [userSettings, setUserSettings] = getUserSettings();

  const stylin = createMemo(()=>useStyle(userSettings().theme));

  return (
    <option
      {...props}
      class={`${stylin().primary} ${props.class ?? ""}`}
    />
  )
}
export { Option };
export default Option;