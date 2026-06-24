import { Component, Show, createSignal } from "solid-js";
import { Button, Icon } from "coles-solid-library";
import { Bolt, Chat } from "coles-solid-library/icons";
import useClickOutside from "solid-click-outside";
import { aiAssistant } from "../../shared/customHooks/aiAssistant";
import styles from "./SparkSidebar.module.scss";

/**
 * Compact picker for the assistant mode (Chat / Homebrew), sitting above the Send button like an
 * "agents" menu. Opens UPWARD — the coles Menu only opens downward, which is off-screen at the
 * bottom of the sidebar — so this is a small custom popover. Reads/writes aiAssistant.mode().
 */
const ModeMenu: Component = () => {
    const [open, setOpen] = createSignal(false);
    const [rootRef, setRootRef] = createSignal<HTMLDivElement>();
    const isHomebrew = () => aiAssistant.mode() === "homebrew";

    useClickOutside(rootRef, () => setOpen(false));

    const pick = (mode: "chat" | "homebrew") => {
        aiAssistant.setMode(mode);
        setOpen(false);
    };

    return (
        <div class={styles.modeMenu} ref={setRootRef}>
            <Show when={open()}>
                <div class={styles.modePopover} role="menu">
                    <button type="button" class={styles.modeOption} role="menuitem" onClick={() => pick("chat")}>
                        <Icon icon={Chat} size="small" /> Chat
                    </button>
                    <button type="button" class={styles.modeOption} role="menuitem" onClick={() => pick("homebrew")}>
                        <Icon icon={Bolt} size="small" /> Homebrew
                    </button>
                </div>
            </Show>
            <Button
                transparent
                class={styles.modeTrigger}
                title={isHomebrew()
                    ? "Mode: Homebrew — Spark turns your description into spells, items, feats and more. Click to switch modes."
                    : "Mode: Chat — ask Spark anything about D&D. Click to switch to Homebrew generation."}
                onClick={() => setOpen((o) => !o)}
            >
                <Icon icon={isHomebrew() ? Bolt : Chat} size="small" />
                {isHomebrew() ? "Homebrew" : "Chat"}
            </Button>
        </div>
    );
};

export default ModeMenu;
