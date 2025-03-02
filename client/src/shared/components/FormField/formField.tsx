import { Component, createSignal, createMemo, JSX, splitProps, createContext, useContext, Accessor, Setter, children, Show } from "solid-js";
import { useStyle, getUserSettings } from "../..";
import style from "./formfield.module.scss";
import { effect } from "solid-js/web";
import useClickOutside from "solid-click-outside";
import { Provider, useFormProvider } from "./formProvider";

interface Props extends JSX.FieldsetHTMLAttributes<HTMLFieldSetElement> {
	children: JSX.Element;
	styleType?: "primary" | "accent" | "tertiary";
	name: string;
	class?: string;
	value?: string;
}

const FormField: Component<Props> = (props)=>{
  return (
    <Provider name={props.name}>
      <FormField2 {...props}/>
    </Provider>
  )
}

const FormField2: Component<Props> = (props) => {
  const [local, others] = splitProps(props, ["children", "styleType", "name", "class", "value"]);
  const context = useFormProvider();
  const [userSettings] = getUserSettings();
  const themeStyle = createMemo(() => useStyle(userSettings().theme));
  const hasInsideText = createMemo(()=> !context.getValue() && !context.getFocused() && !context.getTextInside());

  // -- context -- 
	
  const theChildren = children(()=>props.children);
  const [fieldRef, setFieldRef] = createSignal<HTMLFieldSetElement>();
  useClickOutside(fieldRef, () => {
    context.setTextInside(!!context.getValue().trim());
    context.setFocused(false);
  });
  effect(()=>{
    context.setName(props.name);
  });

  return (
    <fieldset {...others}
      ref={setFieldRef}
      onClick={()=>context.setFocused(true)}
      class={`${themeStyle()[local.styleType ?? "accent"]} ${style.formField} ${local.class ?? ''}`}>
      <legend class={`${themeStyle()[local.styleType ?? "accent"]} ${hasInsideText() ? `${style.moveLegendInside}` : ``}`}>
        {context.getName() ? context.getName() : ``}
      </legend>
      {theChildren()}
    </fieldset>
  );
};

export { FormField };
export default FormField;