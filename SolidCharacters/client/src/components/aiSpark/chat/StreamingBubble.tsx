import { Component, Show } from "solid-js";
import { Button, Icon } from "coles-solid-library";
import { Stop } from "coles-solid-library/icons";
import { Markdown } from "../../../shared/components/MarkDown/MarkDown";
import { aiAssistant } from "../../../shared/customHooks/aiAssistant";
import getUserSettings from "../../../shared/customHooks/userSettings";
import { DEFAULT_AI_SHOW_THINKING } from "../../../models/userSettings";
import ThinkingBlock from "./ThinkingBlock";
import StatusTicker from "./StatusTicker";
import styles from "../SparkSidebar.module.scss";

/** Live assistant bubble shown while a turn is streaming. Empty until the first token arrives. */
const StreamingBubble: Component = () => {
    const [userSettings] = getUserSettings();
    const showThoughts = () => userSettings().ai?.showThinking ?? DEFAULT_AI_SHOW_THINKING;
    return (
        <div class={`${styles.bubbleRow} ${styles.bubbleRowAssistant}`}>
            <div class={`${styles.bubble} ${styles.bubbleAssistant}`}>
                <Show when={showThoughts() && aiAssistant.streamingThinking()}>
                    <ThinkingBlock text={aiAssistant.streamingThinking()} live />
                </Show>
                <Show
                    when={aiAssistant.streamingText()}
                    fallback={
                        <Show when={!(showThoughts() && aiAssistant.streamingThinking())}>
                            <StatusTicker />
                        </Show>
                    }
                >
                    <Markdown text={aiAssistant.streamingText()} />
                </Show>
                <div class={styles.streamActions}>
                    <Button transparent title="Stop generating" onClick={() => aiAssistant.cancel()}>
                        <Icon icon={Stop} size="small" /> Stop
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default StreamingBubble;
