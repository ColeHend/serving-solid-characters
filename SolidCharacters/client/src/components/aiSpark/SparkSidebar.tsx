import { Component, Show, createEffect, createSignal, onCleanup } from "solid-js";
import { Portal } from "solid-js/web";
import { Button, Container, Icon } from "coles-solid-library";
import { Add, Close } from "coles-solid-library/icons";
import SparkIcon from "../../shared/components/aiSpark/sparkIcon";
import { aiAssistant } from "../../shared/customHooks/aiAssistant";
import ConversationMenu from "./menus/ConversationMenu";
import ChatMessageList from "./chat/ChatMessageList";
import ChatInput from "./chat/ChatInput";
import DecisionLog from "./menus/DecisionLog";
import styles from "./SparkSidebar.module.scss";

const PANEL_ID = "spark-sidebar-panel";

/**
 * Slide-out chat sidebar for the Spark assistant. Mirrors SideMenu's Portal + shouldRender +
 * 300ms open/close animation so it can animate out before unmounting. On desktop it sits beside the
 * app (no scrim, app stays usable). On mobile it covers the screen, so a tap-to-dismiss scrim and
 * Escape are provided. Closing never aborts the turn (the stream keeps running in the background).
 */
const SparkSidebar: Component = () => {
    const [shouldRender, setShouldRender] = createSignal(false);
    const [isOpening, setIsOpening] = createSignal(false);
    const [isClosing, setIsClosing] = createSignal(false);
    let timer: ReturnType<typeof setTimeout> | undefined;
    let restoreFocus: HTMLElement | null = null;

    createEffect(() => {
        // Clear any in-flight animation timer first so a rapid close-then-reopen (<300ms) can't fire a
        // stale close-timeout that unmounts the freshly reopened panel.
        if (timer) { clearTimeout(timer); timer = undefined; }
        if (aiAssistant.isOpen()) {
            restoreFocus = document.activeElement as HTMLElement | null;   // to restore on close
            setShouldRender(true);
            setIsClosing(false);
            setIsOpening(true);
            timer = setTimeout(() => setIsOpening(false), 300);
            queueMicrotask(() => document.getElementById(PANEL_ID)?.focus());
        } else if (shouldRender()) {
            setIsClosing(true);
            setIsOpening(false);
            timer = setTimeout(() => { setShouldRender(false); setIsClosing(false); }, 300);
            restoreFocus?.focus?.();
            restoreFocus = null;
        }
    });

    onCleanup(() => { if (timer) clearTimeout(timer); });

    // Escape closes the sidebar from anywhere (deliberate, non-destructive: the turn keeps streaming).
    createEffect(() => {
        if (!aiAssistant.isOpen()) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") aiAssistant.close(); };
        document.addEventListener("keydown", onKey);
        onCleanup(() => document.removeEventListener("keydown", onKey));
    });

    // Scrim tap dismisses — but not mid-stream, so an accidental tap can't hide a reply being written.
    const dismiss = () => { if (aiAssistant.status() !== "streaming") aiAssistant.close(); };

    return (
        <Show when={shouldRender()}>
            <Portal>
                <button type="button" class={styles.scrim} aria-label="Close Spark" tabindex={-1} onClick={dismiss} />
                <Container
                    id={PANEL_ID}
                    role="dialog"
                    aria-label="Spark assistant"
                    tabindex={-1}
                    theme="container"
                    class={`${styles.sidebar} ${isOpening() ? styles.opening : ""} ${isClosing() ? styles.closing : ""}`}
                >
                    <div class={styles.header}>
                        <div class={styles.title}>
                            <SparkIcon size={22} />
                            <span>Spark</span>
                        </div>
                        <div class={styles.headerActions}>
                            <ConversationMenu />
                            <DecisionLog />
                            <Button transparent title="New chat" aria-label="New chat" onClick={() => aiAssistant.newConversation()}>
                                <Icon icon={Add} size="small" />
                            </Button>
                            <Button transparent title="Close" aria-label="Close Spark" onClick={() => aiAssistant.close()}>
                                <Icon icon={Close} size="large" />
                            </Button>
                        </div>
                    </div>
                    <ChatMessageList />
                    <ChatInput />
                </Container>
            </Portal>
        </Show>
    );
};

export default SparkSidebar;
