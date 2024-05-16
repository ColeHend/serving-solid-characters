import { Component } from "solid-js";
import styles from "./chip.module.scss";
import useStyle from "../../../../customHooks/utility/style/styleHook";

type Props = {
    key: string;
    value: string;
    clear: () => void;
};

const Chip: Component<Props> = (props) => {
    const stylin = useStyle();

    return (<span class={`${stylin.tertiary} ${styles.chip}`}>{props.key} : {props.value} <button onClick={props.clear}>x</button></span>);
}
export default Chip;