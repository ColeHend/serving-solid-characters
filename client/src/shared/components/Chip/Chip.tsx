import { Component, createMemo, JSX, Show } from "solid-js";
import useStyles from "../../customHooks/utility/style/styleHook";
import style from "./Chip.module.scss";
import getUserSettings from "../../customHooks/userSettings";
import Button from "../Button/Button";


interface Props {
    class?: string;
    key: string;
    value: string;
    remove?: ()=> any;
}
const Chip: Component<Props> = (props)=> {
    const [userSettings, setUserSettings] = getUserSettings();
    const stylin = createMemo(()=>useStyles(userSettings().theme));
    //  const stylin = createMemo(()=>useStyles(userSettings().theme));
    //  
    return (
        <span class={`${stylin()?.accent} ${style.Chip} ${props.class ?? ""}`}>
            <span>{props.key}</span>
            <span>:</span>
            <span>{'  '+props.value}</span>
            <Show when={!!props.remove}>
                <Button class={`${stylin()?.hover} ${style.removeChipButton}`} onClick={props.remove}>
                    X
                </Button>
            </Show>
        </span>
    )
}
export { Chip };
export default Chip;