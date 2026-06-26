import { Component, For, Show, createEffect, createSignal, onMount } from "solid-js";
import { Button, Icon } from "coles-solid-library";
import { ArrowDownward, Refresh } from "coles-solid-library/icons";
import { aiAssistant } from "../../../shared/customHooks/aiAssistant";
import ChatBubble from "./ChatBubble";
import StreamingBubble from "./StreamingBubble";
import HomebrewPreviewCard from "../homebrew/HomebrewPreviewCard";
import HomebrewDiffCard from "../homebrew/HomebrewDiffCard";
import InteractionCard from "../homebrew/InteractionCard";
import styles from "../SparkSidebar.module.scss";

const ChatMessageList: Component = () => {
    let scroller: HTMLDivElement | undefined;
    let pinned = true;        // whether the user is parked at (near) the bottom — only then do we auto-follow
    let lastLen = 0;          // message count last seen, to detect a fresh user send vs. a streaming update
    const NEAR_PX = 80;
    const [showJump, setShowJump] = createSignal(false);

    const atBottom = () => !scroller || scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight < NEAR_PX;
    const toBottom = () => { if (scroller) { scroller.scrollTop = scroller.scrollHeight; pinned = true; setShowJump(false); } };
    const onScroll = () => { pinned = atBottom(); setShowJump(!pinned); };

    onMount(toBottom);
    // Follow new content ONLY when the user is already at the bottom, so scrolling up to read history
    // mid-stream isn't yanked back on every token. A fresh user send always re-pins (they want the reply).
    createEffect(() => {
        const msgs = aiAssistant.messages();
        aiAssistant.streamingText();
        aiAssistant.streamingThinking();
        aiAssistant.pendingPreviews();
        aiAssistant.pendingInteractions();
        const grew = msgs.length > lastLen;
        const last = msgs[msgs.length - 1];
        lastLen = msgs.length;
        if (grew && last?.role === "user") pinned = true;
        if (pinned) queueMicrotask(toBottom);
        else setShowJump(true);
    });

    return (
        <div class={styles.messageListWrap}>
            <div class={styles.messageList} ref={el => (scroller = el)} onScroll={onScroll} role="log" aria-live="polite" aria-relevant="additions text">
                <Show when={aiAssistant.messages().length === 0 && aiAssistant.status() !== "streaming"}>
                    <div class={styles.empty}>
                        <p>Ask Grimoire about D&D rules, or switch to <strong>Homebrew</strong> to generate spells, items, and more.</p>
                        <div class={styles.starterPrompts}>
                            <button type="button" class={styles.starterChip} onClick={() => aiAssistant.send("Explain how concentration works in 5e.")}>
                                Explain concentration
                            </button>
                            <button type="button" class={styles.starterChip} onClick={() => { aiAssistant.setMode("homebrew"); aiAssistant.send("Create a homebrew spell: a 3rd-level fire spell for wizards."); }}>
                                Generate a homebrew spell
                            </button>
                        </div>
                        <Show when={aiAssistant.mode() !== "homebrew"}>
                            <button type="button" class={styles.starterChip} onClick={() => aiAssistant.setMode("homebrew")}>
                                Switch to Homebrew mode
                            </button>
                        </Show>
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
                <Show when={aiAssistant.status() === "error"}>
                    <div class={styles.errorActions}>
                        <Button theme="primary" title="Retry the last message" aria-label="Retry the last message" onClick={() => aiAssistant.retryLast()}>
                            <Icon icon={Refresh} size="small" /> Retry
                        </Button>
                    </div>
                </Show>
            </div>
            <Show when={showJump()}>
                <button type="button" class={styles.jumpLatest} title="Jump to latest" aria-label="Jump to latest message" onClick={toBottom}>
                    <Icon icon={ArrowDownward} size="small" /> Latest
                </button>
            </Show>
        </div>
    );
};

export default ChatMessageList;
