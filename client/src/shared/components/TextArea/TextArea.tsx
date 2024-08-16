import { Accessor, Component, createSignal, JSX, onMount, Setter, Show, splitProps } from "solid-js";
import styles from './TextArea.module.scss';
import { effect } from "solid-js/web";
import Button from "../Button/Button";
import Modal from "../popup/popup.component";
import { Camera, useImageToText } from "../..";
import { createFileUploader } from "@solid-primitives/upload";
import FileUploader from "../uploader/fileUploader";
import addSnackbar from "../Snackbar/snackbar";

interface Props extends JSX.TextareaHTMLAttributes<HTMLTextAreaElement> {
    text: Accessor<string>,
    setText: Setter<string>,
    class?: string,
    tooltip?: string,
    transparent?: boolean,
    picToTextEnabled?: boolean
    minSize?: {width?: number, height?: number}
    buttons?: {
        styleType?: "primary" | "accent" | "tertiary",
    }
}
export const TextArea: Component<Props> = (props) => {
    let myElement!: HTMLTextAreaElement;
    const [customProps, normalProps] = splitProps(props, ["buttons","minSize","text", "setText", "class", "tooltip", "transparent", "picToTextEnabled"]);
    const [showPicModal, setShowPicModal] = createSignal(false);
    const [imageSrc, setImageSrc] = createSignal<string>("");
    function OnInput() {
        if (!!myElement) {
            myElement.style.height = 'auto';
            const minHeight = customProps.minSize?.height ?? 100;
            const currentHeight = (myElement.scrollHeight < minHeight ? minHeight : myElement.scrollHeight);
            myElement.style.height = `${currentHeight}px`;
            myElement.setAttribute("style", "height:" + currentHeight + "px;overflow-y:hidden;");
        }
    }
    onMount(()=>{
        OnInput();
    });
    effect(()=>{
        OnInput();
        customProps.text();
    })

    effect(()=>{
        if (!!imageSrc()) {
            addSnackbar({message: "Parsing text from image...", closeTimeout: 2000});
            useImageToText(imageSrc(), customProps.setText, ()=>{
                OnInput();
                addSnackbar({message: "Text parsed from image successfully.", closeTimeout: 2000});
            });
        };
    });
    return (
        <>
            <Show when={customProps.picToTextEnabled}>
                <span class={`${!!customProps.transparent ? styles.transparent : ""}`} style={{width: "inherit", "font-size":"1em"}}>
                    <Button styleType={customProps.buttons?.styleType ?? "accent"} class={`${styles.picButton}`} onClick={(e)=>setShowPicModal(old=>!old)}>
                        <Camera width={"30px"} height={"30px"} style={{fill: "white"}}/>
                        <Show when={showPicModal()}>
                            <FileUploader setData={setImageSrc} uploadType="image" />
                        </Show>
                    </Button>
                </span>
            </Show>
            <textarea
                {...normalProps}
                ref={(el)=>{
                    myElement = el;
                    OnInput();
                }}
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