import { Component, Show, createEffect, createSignal, onCleanup } from "solid-js";
import { Portal } from "solid-js/web";
import { Button, Container, Icon, registerWindowManager, unregisterWindowManager, type WindowManagerEntry } from "coles-solid-library";
import { Add, Close, Lock, LockOpen } from "coles-solid-library/icons";
import SparkIcon from "../../shared/components/aiSpark/sparkIcon";
import { aiAssistant } from "../../shared/customHooks/aiAssistant";
import ConversationMenu from "./menus/ConversationMenu";
import ChatMessageList from "./chat/ChatMessageList";
import ChatInput from "./chat/ChatInput";
import ImageLightbox from "./chat/ImageLightbox";
import DecisionLog from "./menus/DecisionLog";
import SessionUsageChip from "./menus/SessionUsageChip";
import styles from "./SparkSidebar.module.scss";

const PANEL_ID = "spark-sidebar-panel";

/**
 * Slide-out chat sidebar for the Grimoire assistant. Mirrors SideMenu's Portal + shouldRender +
 * 300ms open/close animation so it can animate out before unmounting. By default an outside click
 * closes it (via the coles window manager) — on mobile it covers the screen with a tap-to-dismiss
 * scrim, on desktop a click anywhere in the app closes it. A lock toggle (top-left corner) pins the
 * panel open so you can use the app alongside it. Escape always closes. Closing never aborts the turn
 * (the stream keeps running in the background).
 */
const SparkSidebar: Component = () => {
    const [shouldRender, setShouldRender] = createSignal(false);
    const [isOpening, setIsOpening] = createSignal(false);
    const [isClosing, setIsClosing] = createSignal(false);
    const [locked, setLocked] = createSignal(false);
    let timer: ReturnType<typeof setTimeout> | undefined;
    let restoreFocus: HTMLElement | null = null;

    // Single reusable entry (removal is by identity); `element` is patched in when we register.
    // Don't close on an outside click while a native file/camera picker is in flight (the iOS "phantom
    // click" on return) or while the image lightbox is open (its overlay sits outside the panel).
    const entry: WindowManagerEntry = {
        element: undefined!,
        onClickOutside: () => { if (!aiAssistant.filePicking() && !aiAssistant.lightboxImage()) aiAssistant.close(); },
    };

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
    // But not while the lightbox is open (it handles its own Escape) or a file picker is in flight.
    createEffect(() => {
        if (!aiAssistant.isOpen()) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key !== "Escape") return;
            if (aiAssistant.lightboxImage() || aiAssistant.filePicking()) return;
            aiAssistant.close();
        };
        document.addEventListener("keydown", onKey);
        onCleanup(() => document.removeEventListener("keydown", onKey));
    });

    // Register with the coles window manager so an outside click (capture-phase) closes the panel —
    // unless it's locked open. The manager only ever closes the topmost entry and auto-unregisters it.
    createEffect(() => {
        if (!aiAssistant.isOpen() || locked()) return;   // not open, or pinned → don't register
        let registered = false;
        // Defer past the click that opened the panel so it isn't immediately seen as an outside click.
        const id = setTimeout(() => {
            const el = document.getElementById(PANEL_ID);   // reuse the existing id-lookup (also used for focus)
            if (!el) return;
            entry.element = el;
            registerWindowManager(entry);
            registered = true;
        }, 0);
        onCleanup(() => {
            clearTimeout(id);                               // open→close before the defer fired: cancel
            if (registered) unregisterWindowManager(entry); // no-op if the manager already popped it
        });
    });

    return (
        <Show when={shouldRender()}>
            <Portal>
                {/* Visual dim only (mobile); the window manager owns tap-to-dismiss and respects the lock. */}
                <div class={styles.scrim} aria-hidden="true" />
                <Container
                    id={PANEL_ID}
                    role="dialog"
                    aria-label="Grimoire assistant"
                    tabindex={-1}
                    theme="container"
                    class={`${styles.sidebar} ${isOpening() ? styles.opening : ""} ${isClosing() ? styles.closing : ""}`}
                >
                    {/* Lock toggle: pins the panel open (disables close-on-outside-click). A DOM child of the
                        panel, so clicking it is never an "outside" click regardless of where it's painted. */}
                    <button
                        type="button"
                        class={styles.lockBtn}
                        classList={{ [styles.lockBtnActive]: locked() }}
                        aria-pressed={locked()}
                        title={locked() ? "Unlock (closes on outside click)" : "Lock open"}
                        aria-label={locked() ? "Unlock Grimoire" : "Lock Grimoire open"}
                        onClick={() => setLocked((v) => !v)}
                    >
                        <Icon icon={locked() ? Lock : LockOpen} size="small" />
                    </button>
                    <div class={styles.header}>
                        <div class={styles.title}>
                            <SparkIcon size={22} />
                            <span>Grimoire</span>
                        </div>
                        <div class={styles.headerActions}>
                            <SessionUsageChip />
                            <ConversationMenu />
                            <DecisionLog />
                            <Button transparent title="New chat" aria-label="New chat" onClick={() => aiAssistant.newConversation()}>
                                <Icon icon={Add} size="small" />
                            </Button>
                            <Button transparent title="Close" aria-label="Close Grimoire" onClick={() => aiAssistant.close()}>
                                <Icon icon={Close} size="large" />
                            </Button>
                        </div>
                    </div>
                    <ChatMessageList />
                    <ChatInput />
                </Container>
                <ImageLightbox />
            </Portal>
        </Show>
    );
};

export default SparkSidebar;
