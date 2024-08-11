import { Accessor, Component, createSignal, JSX, onMount, Setter, Show, splitProps } from "solid-js";
import styles from './TextArea.module.scss';
import { effect } from "solid-js/web";
import Button from "../Button/Button";
import Modal from "../popup/popup.component";
import { Camera, useImageToText } from "../..";
import { createFileUploader } from "@solid-primitives/upload";
import FileUploader from "../uploader/fileUploader";

interface Props extends JSX.TextareaHTMLAttributes<HTMLTextAreaElement> {
    text: Accessor<string>,
    setText: Setter<string>,
    class?: string,
    tooltip?: string,
    transparent?: boolean,
    picToTextEnabled?: boolean
}
export const TextArea: Component<Props> = (props) => {
    const [customProps, normalProps] = splitProps(props, ["text", "setText", "class", "tooltip", "transparent", "picToTextEnabled"]);
    const [showPicModal, setShowPicModal] = createSignal(false);
    const [imageSrc, setImageSrc] = createSignal<string>("");
    function OnInput() {
        myElement.style.height = 'auto';
        myElement.style.height = (myElement.scrollHeight) + "px";
        myElement.setAttribute("style", "height:" + (myElement.scrollHeight) + "px;overflow-y:hidden;");
    }
    onMount(()=>{
        if (!!myElement) {
            OnInput();
        }
    });

    effect(async ()=>{
        if (!!imageSrc()) {
            await useImageToText(imageSrc(), customProps.setText);
            OnInput();
        } else {
            console.log("No image to parse", imageSrc());
            
        }
    })
    let myElement!: HTMLTextAreaElement;
    return (
        <>
            <Show when={customProps.picToTextEnabled}>
                <span class={`${!!customProps.transparent ? styles.transparent : ""}`} style={{width: "inherit", "font-size":"1em"}}>
                    <Button class={`${styles.picButton}`} onClick={(e)=>setShowPicModal(old=>!old)}>
                        <Camera width={"30px"} height={"30px"} style={{fill: "white"}}/>
                        <Show when={showPicModal()}>
                            <FileUploader setData={setImageSrc} uploadType="image" />
                        </Show>
                    </Button>
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