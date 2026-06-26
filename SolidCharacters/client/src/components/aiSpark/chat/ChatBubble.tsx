import { Component, Show } from "solid-js";
import { Markdown } from "../../../shared/components/MarkDown/MarkDown";
import getUserSettings from "../../../shared/customHooks/userSettings";
import { DEFAULT_AI_SHOW_THINKING } from "../../../models/userSettings";
import { ChatMessage } from "../aiSpark.shared";
import ThinkingBlock from "./ThinkingBlock";
import styles from "../SparkSidebar.module.scss";

const ChatBubble: Component<{ message: ChatMessage }> = (props) => {
    const isUser = () => props.message.role === "user";
    const [userSettings] = getUserSettings();
    const showThoughts = () => userSettings().ai?.showThinking ?? DEFAULT_AI_SHOW_THINKING;
    const hasText = () => !!props.message.text?.trim();
    const showThinkBlock = () => !isUser() && showThoughts() && !!props.message.thinking;
    // Tool-use turns often emit reasoning (or nothing) but no answer prose. Skip the bubble entirely
    // when there's nothing to show so we don't leave an empty pill — but keep it when the user has
    // opted to see thoughts and this turn produced some.
    return (
        <Show when={isUser() || hasText() || showThinkBlock()}>
            <div class={`${styles.bubbleRow} ${isUser() ? styles.bubbleRowUser : styles.bubbleRowAssistant}`}>
                <div class={`${styles.bubble} ${isUser() ? styles.bubbleUser : styles.bubbleAssistant}`}>
                    <Show when={showThinkBlock()}>
                        <ThinkingBlock text={props.message.thinking!} />
                    </Show>
                    <Show when={isUser()} fallback={<Show when={hasText()}><Markdown text={props.message.text} /></Show>}>
                        {props.message.text}
                    </Show>
                </div>
            </div>
        </Show>
    );
};

export default ChatBubble;
