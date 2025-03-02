import { Component, createMemo, JSX, splitProps } from "solid-js";
import style from './body.module.scss';
import getUserSettings from "../../customHooks/userSettings";
import { useInjectServices } from "../../customHooks/injectServices";
import useStyle from "../../customHooks/utility/style/styleHook";

interface Props extends JSX.HTMLAttributes<HTMLDivElement> {
    children: JSX.Element | JSX.Element[];
    class?: CSSModuleClasses[string];
}
export const Body: Component<Props> = (props) => {
  const [customProps, normalProps] = splitProps(props, ["children", "class"]);
  const [userSettings, setUserSettings] = getUserSettings();
  const sharedHooks = useInjectServices();
  const stylin = createMemo(()=>useStyle(userSettings().theme)); ;  
  return (
    <div {...normalProps} class={`${stylin().primary} ${style.compBody} ${customProps.class ?? ""}`}>
      {customProps.children}
    </div>
  )
}