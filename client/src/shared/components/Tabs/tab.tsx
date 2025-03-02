import { JSX, Component, useContext, children, onMount, Show, Accessor, createEffect } from "solid-js";
import { effect } from "solid-js/web";
import { getTabContext } from "./tabs";

interface TabProps {
    children: JSX.Element;
    name: string;
    hidden?: Accessor<boolean>;
}
const Tab: Component<TabProps> = (props) => {
    const {tabs, setTabs} = getTabContext();
    createEffect(() => {
        if (props.hidden) {
            if (props.hidden()) {
                setTabs(old => {
                    const newTabs = {...old};
                    delete newTabs[props.name];
                    return newTabs;
                });
            } else {
                if (!!props.name && !Object.keys(tabs()).includes(props.name)) {
                    setTabs(old => ({...old, [props.name]: props.children }));
                }
            }
        }
    })
    onMount(()=>{
        if (props.name !== undefined ) {
            if (!props.hidden || props.hidden && !props.hidden()) {
                setTabs(old => ({...old, [props.name]: props.children }));
            }
        }
        
    })

    return (
        <Show when={!props.hidden || props.hidden()}>
            {props.children}
        </Show>
    );
}
export { Tab };