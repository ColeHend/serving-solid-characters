import { Component, JSX, splitProps, createMemo, onMount, createEffect } from "solid-js";
import { useFormProvider } from "../FormField/formProvider";
import style from "./input.module.scss";
import { isNullish } from "../..";

interface InputProps extends JSX.InputHTMLAttributes<HTMLInputElement> {
    tooltip?: string;
    transparent?: boolean;
		onChange?: (e: Event & {currentTarget: HTMLInputElement; target: HTMLInputElement}) => void;
}
const Input: Component<InputProps> = (props)=> {
  const [customProps, normalProps] = splitProps(props, ["tooltip", "transparent", "value", "onChange"]);
  const noTransparent = (type?: string) => "checkbox" !== (type ?? "text");
  const context = useFormProvider();
  const inputValue = createMemo(()=> props.value);
  const hasTrasparent = createMemo(() => {
    return Object.keys(customProps).includes("transparent");
  });

  createEffect(() => {
    if (Object.keys(props).includes("required") || props?.required === true) {
      context.setName((old) => `${old} *`);
    } else {
      context.setName((old) => old);
    }
  });

  onMount(()=>{
    if (!isNullish(context.getName)) {
      context.setFieldType(props.type ?? "text"); 
    }
  });
  return (
    <input
      {...normalProps}
      placeholder={!!context.getName() && !context.getTextInside() && !context.getFocused() ? context.getName() : props.placeholder}
      value={inputValue()}
      onFocus={(e)=>{
        if (!isNullish(context.getName)) {
          context.setFocused(true); 
        }

      }}
      onBlur={(e)=>{
        if (!isNullish(context.getName)) {
          context.setFocused(false)
        }
      }}
      type={context.getFieldType().length > 0 ? context.getFieldType() : props.type}
      onChange={(e)=>{
        if (!isNullish(context.getName)) {
          if (e.currentTarget.value.trim()) {
            context.setValue(e.currentTarget.value);
            context.setTextInside(true); 
          } else {
            if (props.type === "checkbox") {
              context.setValue(e.currentTarget.checked ? "true" : "");
              context.setTextInside(e.currentTarget.checked);
            } else {
              context.setValue("");
              context.setTextInside(false);
            }
          }
					
        }
        if (props.onChange) props.onChange(e);
				
      }}
      class={`${style.input} ${hasTrasparent() && noTransparent(normalProps.type) ? style.transparent : ""} ${props.class ?? ""}`}
      title={customProps.tooltip}
    />
  )
}
export { Input };
export default Input;