import { Accessor, JSX, Setter } from "solid-js";
import { Style } from "../shared/customHooks/utility/style/styleHook";

export interface HookContext {
    isMobile: Accessor<boolean>;
    showList: [Accessor<boolean>, Setter<boolean>];
    useStyle: (styleType?: string) => Style;
		getMouse: () => {x: number, y: number};
}

export interface ProviderProps<T> {
    children: JSX.Element;
    value: T;
}