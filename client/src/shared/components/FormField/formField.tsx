import { Component, createSignal, createMemo, JSX, splitProps, children } from "solid-js";
import { Provider, useFormProvider } from "./formProvider";
import useClickOutside from "solid-click-outside";
import style from "./formfield.module.scss";
import { effect } from "solid-js/web";

interface Props extends JSX.FieldsetHTMLAttributes<HTMLFieldSetElement> {
	children: JSX.Element;
	styleType?: "primary" | "accent" | "tertiary";
	name: string;
	class?: string;
	value?: string;
  legendClass?: string;
}

const FormField: Component<Props> = (props)=>{
  return (
    <Provider name={props.name}>
      <FormField2 {...props}/>
    </Provider>
  )
}

const FormField2: Component<Props> = (props) => {
  const [local, others] = splitProps(props, ["children", "styleType", "name", "class", "value", "legendClass"]);
  const context = useFormProvider();
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
      class={`${style[local.styleType ?? "accent"]} ${style.formField} ${local.class ?? ''}`}>
      <legend class={`${hasInsideText() ? `${style.moveLegendInside}` : ``} ${local?.legendClass ?? ''}`}>
        {context.getName() ? context.getName() : ``}
      </legend>
      {theChildren()}
    </fieldset>
  );
};

export { FormField };
export default FormField;