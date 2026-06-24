import { Component, Show } from "solid-js";
import { Markdown } from "../../shared/components/MarkDown/MarkDown";
import { ChatMessage } from "./aiSpark.shared";
import styles from "./SparkSidebar.module.scss";

const ChatBubble: Component<{ message: ChatMessage }> = (props) => {
    const isUser = () => props.message.role === "user";
    return (
        <div class={`${styles.bubbleRow} ${isUser() ? styles.bubbleRowUser : styles.bubbleRowAssistant}`}>
            <div class={`${styles.bubble} ${isUser() ? styles.bubbleUser : styles.bubbleAssistant}`}>
                <Show when={isUser()} fallback={<Markdown text={props.message.text} />}>
                    {props.message.text}
                </Show>
            </div>
        </div>
    );
};

export default ChatBubble;
