import { Component, JSX, splitProps, createMemo, Show, useContext, onMount, createEffect } from "solid-js";
import useStyles from "../../../shared/customHooks/utility/style/styleHook";
import style from "./input.module.scss";
import { effect } from "solid-js/web";
import { useFormProvider } from "../FormField/formProvider";
import { c } from "@vite-pwa/assets-generator/shared/assets-generator.5e51fd40";

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

		onMount(()=>{
			if (!!context.getName) {
				context.setFieldType(props.type ?? "text"); 
				if (Object.keys(props).includes("required") && props.required !== false) {
					context.setName(`${context.getName()} *`);
				}
			}
		});
    return (
			<input
			{...normalProps}
			placeholder={!!context.getName() && !context.getTextInside() && !context.getFocused() ? context.getName() : props.placeholder}
			value={inputValue()}
			onFocus={(e)=>{
				if (!!context.getName) {
					context.setFocused(true); 
				}

			}}
			onBlur={(e)=>{
				if (!!context.getName) {
					context.setFocused(false)
				}
			}}
			type={context.getFieldType().length > 0 ? context.getFieldType() : props.type}
			onChange={(e)=>{
				if (!!context.getName) {
					if (!!e.currentTarget.value.trim()) {
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
				if (!!props.onChange) props.onChange(e);
				
			}}
			class={`${style.input} ${hasTrasparent() && noTransparent(normalProps.type) ? style.transparent : ""} ${props.class ?? ""}`}
			title={customProps.tooltip}
		/>
    )
}
export { Input };
export default Input;