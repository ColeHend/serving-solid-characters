import { Component, JSX, Show } from "solid-js";
import useStyles from "../../../shared/customHooks/utility/style/styleHook";
import style from "./Chip.module.scss";
interface Props {
    class?: string;
    key: string;
    value: string;
    remove?: ()=> any;
}
const Chip: Component<Props> = (props)=> {
    const stylin = useStyles();
    return (
        <span class={`${stylin.tertiary} ${style.Chip} ${props.class ?? ""}`}>{props.key} : {props.value}<Show when={!!props.remove}><button class={`${stylin.hover} ${style.removeChipButton}`}
        onClick={props.remove}>X</button></Show></span>
    )
}
export { Chip };
export default Chip;