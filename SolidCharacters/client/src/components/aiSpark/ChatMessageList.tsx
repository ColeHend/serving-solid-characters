import { Component, For, Show, createEffect, onMount } from "solid-js";
import { aiAssistant } from "../../shared/customHooks/aiAssistant";
import ChatBubble from "./ChatBubble";
import StreamingBubble from "./StreamingBubble";
import HomebrewPreviewCard from "./HomebrewPreviewCard";
import HomebrewDiffCard from "./HomebrewDiffCard";
import InteractionCard from "./InteractionCard";
import styles from "./SparkSidebar.module.scss";

const ChatMessageList: Component = () => {
    let scroller: HTMLDivElement | undefined;
    const toBottom = () => { if (scroller) scroller.scrollTop = scroller.scrollHeight; };

    onMount(toBottom);
    // Keep pinned to the latest content as messages/stream/previews change.
    createEffect(() => {
        aiAssistant.messages();
        aiAssistant.streamingText();
        aiAssistant.streamingThinking();
        aiAssistant.pendingPreviews();
        aiAssistant.pendingInteractions();
        queueMicrotask(toBottom);
    });

    return (
        <div class={styles.messageList} ref={el => (scroller = el)}>
            <Show when={aiAssistant.messages().length === 0 && aiAssistant.status() === "idle"}>
                <div class={styles.empty}>
                    Ask a question, or switch to <strong>Homebrew</strong> to generate spells, items, and more.
                </div>
            </Show>
            <For each={aiAssistant.messages()}>{(m) => <ChatBubble message={m} />}</For>
            <Show when={aiAssistant.status() === "streaming"}><StreamingBubble /></Show>
            <For each={aiAssistant.pendingPreviews()}>{(p) => (
                <Show when={p.mode === "edit"} fallback={<HomebrewPreviewCard preview={p} />}>
                    <HomebrewDiffCard preview={p} />
                </Show>
            )}</For>
            <For each={aiAssistant.pendingInteractions()}>{(i) => <InteractionCard interaction={i} />}</For>
        </div>
    );
};

export default ChatMessageList;
