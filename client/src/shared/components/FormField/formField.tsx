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
	const haveInsideText = createMemo(()=> !!!context.getValue() && !context.getFocused() && context.getTextInside());

	// -- context -- 
	
	const theChildren = children(()=>props.children);
	const [fieldRef, setFieldRef] = createSignal<HTMLFieldSetElement>();
	useClickOutside(fieldRef, () => {
		context.setTextInside(!!context.getValue() || !context.getFocused());
	});
	effect(()=>{
		context.setName(props.name);
	});
	const [fieldMargin, setFieldMargin] = createSignal<string>("10px");
	const [fieldPadding, setFieldPadding] = createSignal<string>("25px");
	effect(()=>{
		if (haveInsideText()) {
			setFieldMargin("10px");
			if (context.getFieldType() !== "textarea") setFieldPadding("25px");
			if (context.getFieldType() === "textarea") setFieldPadding("15px");
		} else {
			setFieldMargin("0px");
			if (context.getFieldType() !== "textarea") setFieldPadding("15px");
			if (context.getFieldType() === "textarea") setFieldPadding("8px");
		}
	})

	return (
		<fieldset {...others}
			  ref={setFieldRef}
				style={{
					"margin-top": fieldMargin(),
					"padding-bottom": fieldPadding()
				}}
				onClick={() => context.setTextInside(false)}
				class={`${themeStyle()[local.styleType ?? "accent"]} ${style.formField} ${local.class ?? ''}`}>
				<legend class={`${haveInsideText() ? `${style.moveLegendInside}` : ``}`}>{!!context.getName() ? context.getName() : ``}</legend>
					{theChildren()}
			</fieldset>
	);
};

export { FormField };
export default FormField;