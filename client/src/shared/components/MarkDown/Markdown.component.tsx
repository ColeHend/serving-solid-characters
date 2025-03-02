import { Accessor, Component, createSignal, JSX, onMount, Setter, splitProps } from "solid-js";
import { marked } from "marked";
import DOMPurify from "dompurify"
import style from "./Markdown.module.scss";
interface Props extends JSX.HTMLAttributes<HTMLDivElement> {
    text: Accessor<string>;
    class?: string;
    tooltip?: string;
}
const Markdown:Component<Props> = (props) => {
  const [customProps, normalProps] = splitProps(props, ["text", "tooltip", "class"]);
  const [markElement, setMarkElement] = createSignal<JSX.Element>();

  return (
    <div class={`${style.markStyle} ${customProps.class ?? ""}`} ref={setMarkElement} innerHTML={DOMPurify.sanitize(marked.parse(customProps.text(), { async: false, gfm: true }))} title={customProps.tooltip} {...normalProps} />
  )
}
export { Markdown };
export default Markdown;