import { JSX, Component, useContext, children, onMount } from "solid-js";
import { effect } from "solid-js/web";
import { getTabContext } from "./tabs";

interface TabProps {
    children: JSX.Element;
    name: string;
}
const Tab: Component<TabProps> = (props) => {
    const {tabs, setTabs} = getTabContext();
    onMount(()=>{
        if (props.name !== undefined) {
            setTabs(old => ({...old, [props.name]: props.children }));
        }
        
    })

    return (
        <>
            {props.children}
        </>
    );
}
export { Tab };