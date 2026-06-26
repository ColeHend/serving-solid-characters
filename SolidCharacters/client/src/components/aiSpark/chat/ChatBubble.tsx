import { Component, Show } from "solid-js";
import { Markdown } from "../../../shared/components/MarkDown/MarkDown";
import getUserSettings from "../../../shared/customHooks/userSettings";
import { DEFAULT_AI_SHOW_THINKING } from "../../../models/userSettings";
import { ChatMessage } from "../aiSpark.shared";
import ThinkingBlock from "./ThinkingBlock";
import EditableUserBubble from "./EditableUserBubble";
import styles from "../SparkSidebar.module.scss";

const ChatBubble: Component<{ message: ChatMessage }> = (props) => {
    const isUser = () => props.message.role === "user";
    const [userSettings] = getUserSettings();
    const showThoughts = () => userSettings().ai?.showThinking ?? DEFAULT_AI_SHOW_THINKING;
    const hasText = () => !!props.message.text?.trim();
    const showThinkBlock = () => !isUser() && showThoughts() && !!props.message.thinking;
    // User prompts get the inline edit/rewind affordance (own component). Assistant turns often emit
    // reasoning (or nothing) but no answer prose, so skip the bubble entirely when there's nothing to show
    // — but keep it when the user has opted to see thoughts and this turn produced some.
    return (
        <Show when={isUser()} fallback={
            <Show when={hasText() || showThinkBlock()}>
                <div class={`${styles.bubbleRow} ${styles.bubbleRowAssistant}`}>
                    <div class={`${styles.bubble} ${styles.bubbleAssistant}`}>
                        <Show when={showThinkBlock()}>
                            <ThinkingBlock text={props.message.thinking!} />
                        </Show>
                        <Show when={hasText()}><Markdown text={props.message.text} /></Show>
                    </div>
                </div>
            </Show>
        }>
            <EditableUserBubble message={props.message} />
        </Show>
    );
};

export default ChatBubble;
