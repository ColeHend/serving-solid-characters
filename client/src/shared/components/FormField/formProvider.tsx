import { Accessor, JSX, Component, createSignal, useContext, createContext } from "solid-js";

interface formFieldContext {
	getName: Accessor<string>;
	setName: (name: string) => void;
	getTextInside: Accessor<boolean>;
	setTextInside: (textInside: boolean) => void;
	getFocused: Accessor<boolean>;
	setFocused: (focused: boolean) => any;
	getValue: Accessor<string>;
	setValue: (value: string) => void;
	getFieldType: Accessor<string>;
	setFieldType: (type: string) => void;
}

const FormFieldContext = createContext<formFieldContext>({
	getName: () => "",
	setName: () => {},
	getTextInside: () => true,
	setTextInside: () => {},
	getFocused: () => false,
	setFocused: () => {},
	getValue: () => "",
	setValue: () => {},
	getFieldType: () => "",
	setFieldType: () => {}
});
interface ProviderProps {
	children: JSX.Element;
	name?: string;
	value?: string;
	type?: string;
}
export const Provider: Component<ProviderProps> = (props) => {
	const [getName, setName] = createSignal(props.name ?? "");
	const [getTextInside, setTextInside] = createSignal(false);
	const [getFocused, setFocused] = createSignal(false);
	const [getValue, setValue] = createSignal(props.value ?? "");
	const [getFieldType, setFieldType] = createSignal(props.type ?? "text");
	return (
		<FormFieldContext.Provider 
			value={{
				getName,
				setName,
				getTextInside,
				setTextInside,
				getFocused,
				setFocused,
				getValue,
				setValue,
				getFieldType,
				setFieldType
			}}
			>
			{props.children}
		</FormFieldContext.Provider>
	);
}
export function useFormProvider() {
	const context = useContext(FormFieldContext)
	return context;
};