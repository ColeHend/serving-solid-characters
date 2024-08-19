import { JSX, Component, useContext, children } from "solid-js";
import { effect } from "solid-js/web";
import { tabContext } from "./tabs";

interface TabProps {
    children: JSX.Element;
    name: string;
}
const Tab: Component<TabProps> = (props) => {
    const [tabStore, setTabStore] = useContext(tabContext);
    const child = children(()=>props.children);
    effect(()=>{
        if (props.name !== undefined) {
            setTabStore(old => ({...old, [props.name]: child() }));
        }
        
    })

    return (
        <>
            {props.children}
        </>
    );
}
export { Tab };