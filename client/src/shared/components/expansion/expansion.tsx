import {type Component, For, Show, createSignal, JSX} from "solid-js";
import useStyle from "../../../../customHooks/utility/style/styleHook";
import styles from './expansion.module.scss';

type Props = {
    children: [JSX.Element, JSX.Element],
    styles?: CSSModuleClasses,
    [key:string]: any
}
const ExpansionPanel: Component<Props> = (props)=>{
    const[open, setOpen] = createSignal(false);
    const stylin = useStyle();
    return (
        <div class={`${styles.totalPanel} ${props.styles}`} {...props}>
            <div class={`${stylin.accent} ${styles.header}`}>
                <span>
                    {props.children[0]}
                </span>
                <span onClick={()=>setOpen(old =>!old)} class={`${stylin.hover}`}>
                    <Show when={!open()}>
                        ↓
                    </Show>
                    <Show when={open()}>
                        ↑
                    </Show>
                </span>
            </div>
            <Show when={open()}>
                <div class={`${stylin.accent} ${styles.body}`}>
                    {props.children[1]}
                </div>
            </Show>
        </div>
    )
}
export default ExpansionPanel;