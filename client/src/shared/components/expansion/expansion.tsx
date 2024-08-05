import {type Component, For, Show, createSignal, JSX, Accessor,Setter} from "solid-js";
import useStyle from "../../../shared/customHooks/utility/style/styleHook";
import styles from './expansion.module.scss';
import Button from "../Button/Button";
import { DownArrow, UpArrow } from "../../svgs/arrows";

type Props = {
    children: [JSX.Element, JSX.Element],
    styles?: CSSModuleClasses,
    extraLogic?: () => void,
    startOpen?: boolean,
    [key:string]: any
}
const ExpansionPanel: Component<Props> = (props)=>{
    const[open, setOpen] = createSignal(!!props.startOpen);
    const stylin = useStyle();
    return (
        <div class={`${styles.totalPanel} ${props.styles}`} {...props}>
            <div class={`${stylin.accent} ${styles.header}`}>
                <span>
                    {props.children[0]}
                </span>
                <Button onClick={()=>{
                    setOpen(old =>!old);
                    !!props.extraLogic ? props.extraLogic() : null 
                }} class={`${stylin.hover}`}>
                    <Show when={!open()}>
                        <DownArrow />
                    </Show>
                    <Show when={open()}>
                        <UpArrow />
                    </Show>
                </Button>
            </div>
            <Show when={open()}>
                <div class={`${stylin.accent} ${styles.body}`}>
                    {props.children[1]}
                </div>
            </Show>
        </div>
    )
}
export { ExpansionPanel };
export default ExpansionPanel;