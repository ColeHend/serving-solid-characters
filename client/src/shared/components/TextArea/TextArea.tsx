import { Accessor, Component, createEffect, createSignal, JSX, onMount, Setter, Show, splitProps } from "solid-js";
import styles from './TextArea.module.scss';
import { effect } from "solid-js/web";
import Button from "../Button/Button";
import Modal from "../popup/popup.component";
import { Camera, isNullish, useImageToText } from "../..";
import { createFileUploader } from "@solid-primitives/upload";
import FileUploader from "../uploader/fileUploader";
import addSnackbar from "../Snackbar/snackbar";
import { useFormProvider } from "../FormField/formProvider";

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
  const context = useFormProvider();
  /**
     * Function to set the height of the textarea based on the content
     */
  function OnInput() {
    if (myElement) {
      myElement.style.height = 'auto';
      const minHeight = customProps.minSize?.height ?? 100;
      const currentHeight = (myElement.scrollHeight < minHeight ? minHeight : myElement.scrollHeight);
      myElement.style.height = `${currentHeight}px`;
      myElement.setAttribute("style", "height:" + currentHeight + "px;overflow-y:hidden;");
    }
  }

  // sets the field type on mount and sets the height of the textarea
  onMount(()=>{
    OnInput();
    context.setFieldType("textarea");
  });

  // updates height of textarea when text is changed
  effect(()=>{
    OnInput();
    customProps.text();
  })

  // if the imageSrc is changed, parse the image to text
  effect(()=>{
    if (imageSrc()) {
      addSnackbar({message: "Parsing text from image...", closeTimeout: 2000});
      useImageToText(imageSrc(), customProps.setText, () =>
      {
        OnInput();
        addSnackbar({message: "Text parsed from image successfully.", closeTimeout: 2000});
      });
    };
  });

  createEffect(() => {
    if (Object.keys(props).includes("required") || props?.required === true) {
      context.setName((old) => `${old} *`);
    } else {
      context.setName((old) => old);
    }
  })

  return (
    <>
      <Show when={customProps.picToTextEnabled}>
        <span class={`${customProps.transparent ? styles.transparent : ""}`} style={{width: "inherit", "font-size":"1em"}}>
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
        onFocus={(e)=>{
          if (!isNullish(context.getName)) {
            context.setFocused(true); 
          }
        }}
        onBlur={(e)=>{
          if (context.setFocused) {
            context.setFocused(false)
          }
        }}
        placeholder={!!context.getName && !context.getTextInside() && !context.getFocused() ? context.getName() : props.placeholder}
        class={`${styles.areaStyle} ${customProps.class ?? ""} ${customProps.transparent ? styles.transparent : ""}`}
        value={customProps.text()}
        onInput={(e) => {
          customProps.setText(e.currentTarget.value);
          OnInput();
          if (!!context.getName && !!e.currentTarget.value.trim()) {
            context.setValue(e.currentTarget.value);
            context.setTextInside(true); 
          } else if (!!context.getName && !e.currentTarget.value.trim()) {
            context.setValue("");
            context.setTextInside(false); 
          }
        }}
        title={customProps.tooltip}
      />
    </>
  )
}
export default TextArea;