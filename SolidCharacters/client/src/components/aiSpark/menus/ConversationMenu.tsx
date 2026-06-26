import { Component, For, Show, createEffect, createSignal, onCleanup } from "solid-js";
import { Button, Icon, Input } from "coles-solid-library";
import { Add, Check, Close, Delete, Edit, History } from "coles-solid-library/icons";
import useClickOutside from "solid-click-outside";
import { aiAssistant } from "../../../shared/customHooks/aiAssistant";
import { relativeTime } from "../aiSpark.shared";
import styles from "../SparkSidebar.module.scss";

/**
 * Header dropdown listing saved conversations (from the dnd_chatHistory IndexedDB). Load, rename, or
 * delete a chat, or clear them all. Destructive actions require an inline confirm (no Undo — addSnackbar
 * has no action button). Rows are real <button>s (keyboard-focusable) rather than role="menuitem" divs.
 *
 * Hand-rolled popover (not the coles Menu): the coles Menu portals to <body> with its own ~999 z-index,
 * which renders BEHIND the z-index:1200 Grimoire sidebar. A popover inside the sidebar shares its stacking
 * context and stays visible.
 */
const ConversationMenu: Component = () => {
    const [show, setShow] = createSignal(false);
    const [rootRef, setRootRef] = createSignal<HTMLDivElement>();
    const [confirmingId, setConfirmingId] = createSignal<string | null>(null);
    const [editingId, setEditingId] = createSignal<string | null>(null);
    const [editText, setEditText] = createSignal("");
    const [confirmingClear, setConfirmingClear] = createSignal(false);

    useClickOutside(rootRef, () => close());

    const close = () => { setShow(false); setConfirmingId(null); setEditingId(null); setConfirmingClear(false); };
    const toggle = () => {
        if (!show()) { void aiAssistant.loadConversations(); setShow(true); }
        else close();
    };

    // Escape closes the popover.
    createEffect(() => {
        if (!show()) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
        document.addEventListener("keydown", onKey);
        onCleanup(() => document.removeEventListener("keydown", onKey));
    });

    const startEdit = (id: string, title: string) => { setConfirmingId(null); setEditingId(id); setEditText(title); };
    const saveEdit = (id: string) => { void aiAssistant.renameConversation(id, editText()); setEditingId(null); };
    const doDelete = (id: string) => { void aiAssistant.deleteConversation(id); setConfirmingId(null); };
    const doClearAll = () => { void aiAssistant.deleteAllConversations(); setConfirmingClear(false); close(); };

    return (
        <div class={styles.convMenu} ref={setRootRef}>
            <Show when={show()}>
                <div class={styles.convPopover}>
                    <button type="button" class={styles.convOption} onClick={() => { aiAssistant.newConversation(); close(); }}>
                        <Icon icon={Add} size="small" /> New chat
                    </button>
                    <For each={aiAssistant.conversations()}>{(c) => (
                        <div class={styles.convRow}>
                            <Show
                                when={editingId() === c.id}
                                fallback={
                                    <>
                                        <button
                                            type="button"
                                            class={styles.convLoad}
                                            onClick={() => { void aiAssistant.loadConversation(c.id); close(); }}
                                        >
                                            <span class={styles.convTitle}>{c.title}</span>
                                            <span class={styles.convTime}>{relativeTime(c.updatedAt)}</span>
                                        </button>
                                        <Show
                                            when={confirmingId() === c.id}
                                            fallback={
                                                <div class={styles.convRowActions}>
                                                    <Button transparent title="Rename" aria-label="Rename conversation" onClick={() => startEdit(c.id, c.title)}>
                                                        <Icon icon={Edit} size="small" />
                                                    </Button>
                                                    <Button transparent title="Delete" aria-label="Delete conversation" onClick={() => { setConfirmingClear(false); setConfirmingId(c.id); }}>
                                                        <Icon icon={Delete} size="small" />
                                                    </Button>
                                                </div>
                                            }
                                        >
                                            <div class={styles.convRowActions}>
                                                <span class={styles.convConfirm}>Delete?</span>
                                                <Button transparent title="Confirm delete" aria-label="Confirm delete" onClick={() => doDelete(c.id)}>
                                                    <Icon icon={Check} size="small" />
                                                </Button>
                                                <Button transparent title="Cancel" aria-label="Cancel delete" onClick={() => setConfirmingId(null)}>
                                                    <Icon icon={Close} size="small" />
                                                </Button>
                                            </div>
                                        </Show>
                                    </>
                                }
                            >
                                <Input
                                    value={editText()}
                                    onInput={(e) => setEditText(e.currentTarget.value)}
                                    onKeyDown={(e: KeyboardEvent) => {
                                        if (e.key === "Enter") { e.preventDefault(); saveEdit(c.id); }
                                        if (e.key === "Escape") { e.preventDefault(); setEditingId(null); }
                                    }}
                                />
                                <div class={styles.convRowActions}>
                                    <Button transparent title="Save name" aria-label="Save name" onClick={() => saveEdit(c.id)}>
                                        <Icon icon={Check} size="small" />
                                    </Button>
                                    <Button transparent title="Cancel rename" aria-label="Cancel rename" onClick={() => setEditingId(null)}>
                                        <Icon icon={Close} size="small" />
                                    </Button>
                                </div>
                            </Show>
                        </div>
                    )}</For>
                    <Show when={aiAssistant.conversations().length > 0}>
                        <Show
                            when={confirmingClear()}
                            fallback={
                                <button type="button" class={styles.convClearAll} onClick={() => { setConfirmingId(null); setConfirmingClear(true); }}>
                                    <Icon icon={Delete} size="small" /> Clear all conversations
                                </button>
                            }
                        >
                            <div class={styles.convClearConfirm}>
                                <span>Delete all conversations?</span>
                                <Button transparent title="Confirm clear all" aria-label="Confirm clear all" onClick={doClearAll}>
                                    <Icon icon={Check} size="small" />
                                </Button>
                                <Button transparent title="Cancel" aria-label="Cancel clear all" onClick={() => setConfirmingClear(false)}>
                                    <Icon icon={Close} size="small" />
                                </Button>
                            </div>
                        </Show>
                    </Show>
                </div>
            </Show>
            <Button transparent title="Conversations" aria-label="Conversation history" aria-haspopup="menu" aria-expanded={show()} onClick={toggle}>
                <Icon icon={History} size="small" />
            </Button>
        </div>
    );
};

export default ConversationMenu;
