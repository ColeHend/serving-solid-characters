import { Accessor, Component, JSX, onMount, Setter, Show, splitProps } from "solid-js";
import styles from './TextArea.module.scss';
import { effect } from "solid-js/web";
import Button from "../Button/Button";

interface Props extends JSX.TextareaHTMLAttributes<HTMLTextAreaElement> {
    text: Accessor<string>,
    setText: Setter<string>,
    class?: string,
    tooltip?: string,
    transparent?: boolean,
    picToTextEnabled?: boolean
}
const TextArea: Component<Props> = (props) => {
    const [customProps, normalProps] = splitProps(props, ["text", "setText", "class", "tooltip", "transparent", "picToTextEnabled"]);

    function OnInput() {
        myElement.style.height = 'auto';
        myElement.style.height = (myElement.scrollHeight) + "px";
        myElement.setAttribute("style", "height:" + (myElement.scrollHeight) + "px;overflow-y:hidden;");
    }
    onMount(()=>{
        if (!!myElement) {
            OnInput();
        }
    })
    
    let myElement!: HTMLTextAreaElement;
    return (
        <>
            <Show when={customProps.picToTextEnabled}>
                <span class={`${!!customProps.transparent ? styles.transparent : ""}`} style={{width: "inherit", "font-size":"1em"}}>
                    <Button>PiC</Button>
                </span>
            </Show>
            <textarea
                {...normalProps}
                ref={myElement}
                class={`${styles.areaStyle} ${customProps.class ?? ""} ${!!customProps.transparent ? styles.transparent : ""}`}
                value={customProps.text()}
                onInput={(e) => {
                    customProps.setText(e.currentTarget.value);
                    OnInput();
                }}
                title={customProps.tooltip}
            />
        </>
    )
}
export default TextArea;