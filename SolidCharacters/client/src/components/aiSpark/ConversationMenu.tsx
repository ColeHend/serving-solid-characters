import { Component, For, Show, createSignal } from "solid-js";
import { Button, Icon } from "coles-solid-library";
import { Add, Delete, History } from "coles-solid-library/icons";
import useClickOutside from "solid-click-outside";
import { aiAssistant } from "../../shared/customHooks/aiAssistant";
import { relativeTime } from "./aiSpark.shared";
import styles from "./SparkSidebar.module.scss";

/**
 * Header dropdown listing saved conversations (from the dnd_chatHistory IndexedDB). Lets the user
 * start a new chat, load a past one, or delete any of them. The list is refreshed each time it opens.
 *
 * Hand-rolled popover (not the coles Menu) for the same reason as ModeMenu: the coles Menu portals to
 * <body> with its own ~999 z-index, which renders BEHIND the z-index:1200 Spark sidebar. A popover
 * inside the sidebar shares its stacking context and stays visible.
 */
const ConversationMenu: Component = () => {
    const [show, setShow] = createSignal(false);
    const [rootRef, setRootRef] = createSignal<HTMLDivElement>();

    useClickOutside(rootRef, () => setShow(false));

    const toggle = () => {
        if (!show()) void aiAssistant.loadConversations();
        setShow(o => !o);
    };

    return (
        <div class={styles.convMenu} ref={setRootRef}>
            <Show when={show()}>
                <div class={styles.convPopover} role="menu">
                    <button
                        type="button"
                        class={styles.convOption}
                        role="menuitem"
                        onClick={() => { aiAssistant.newConversation(); setShow(false); }}
                    >
                        <Icon icon={Add} size="small" /> New chat
                    </button>
                    <For each={aiAssistant.conversations()}>{(c) => (
                        <div
                            class={styles.convOption}
                            role="menuitem"
                            onClick={() => { void aiAssistant.loadConversation(c.id); setShow(false); }}
                        >
                            <span class={styles.convTitle}>{c.title}</span>
                            <span class={styles.convTime}>{relativeTime(c.updatedAt)}</span>
                            <Button
                                transparent
                                title="Delete conversation"
                                onClick={(e) => { e.stopPropagation(); void aiAssistant.deleteConversation(c.id); }}
                            >
                                <Icon icon={Delete} size="small" />
                            </Button>
                        </div>
                    )}</For>
                </div>
            </Show>
            <Button transparent title="Conversations" onClick={toggle}>
                <Icon icon={History} size="small" />
            </Button>
        </div>
    );
};

export default ConversationMenu;
