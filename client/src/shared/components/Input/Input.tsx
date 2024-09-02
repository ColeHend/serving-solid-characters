import { Component, JSX, splitProps, createMemo, Show, useContext, onMount } from "solid-js";
import useStyles from "../../../shared/customHooks/utility/style/styleHook";
import style from "./input.module.scss";
import { effect } from "solid-js/web";
import { useFormProvider } from "../FormField/formProvider";

interface InputProps extends JSX.InputHTMLAttributes<HTMLInputElement> {
    tooltip?: string;
    transparent?: boolean;
		onChange?: (e: Event & {currentTarget: HTMLInputElement; target: HTMLInputElement}) => void;
}
const Input: Component<InputProps> = (props)=> {
    const [customProps, normalProps] = splitProps(props, ["tooltip", "transparent", "value", "onChange"]);
    const noTransparent = (type?: string) => ["checkbox"].includes(type ?? "text");
		const context = useFormProvider();
		const inputValue = createMemo(()=> props.value);

		onMount(()=>{
			if (!!context.getName) {
				context.setFieldType(props.type ?? "text");
			}
		})
    return (
			<input
			{...normalProps}
			placeholder={!!context.getName() && context.getTextInside() ? context.getName() : props.placeholder}
			value={inputValue()}
			onFocus={(e)=>{
				if (!!context.getName) {
					context.setFocused(true); 
					context.setTextInside(false);
				}

			}}
			onBlur={(e)=>{
				if (!!context.setFocused) {
					context.setFocused(false)
				}
			}}
			type={context.getFieldType().length > 0 ? context.getFieldType() : props.type}
			onChange={(e)=>{
				if (!!context.getName) {
					if (!!e.currentTarget.value) {
						context.setValue(e.currentTarget.value);
						context.setTextInside(false); 
						context.setFocused(true);
					} else {
						if (e.currentTarget.checked) { 
							context.setValue(e.currentTarget.checked ? "true" : "");
							context.setFocused(true); 
							context.setTextInside(false); 
						} else if (!e.currentTarget.checked) {
							context.setValue(e.currentTarget.checked ? "true" : "");
							context.setFocused(false);
							context.setTextInside(true);
						}
					}
					
				}
				if (!!props.onChange) props.onChange(e);
				
			}}
			class={`${style.input} ${customProps.transparent && !noTransparent(normalProps.type) ? style.transparent : ""} ${props.class ?? ""}`}
			title={customProps.tooltip}
		/>
    )
}
export { Input };
export default Input;