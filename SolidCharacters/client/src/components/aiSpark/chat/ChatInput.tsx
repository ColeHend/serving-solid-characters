import { Component, Show, createSignal } from "solid-js";
import { Button, Icon, TextArea } from "coles-solid-library";
import { Send } from "coles-solid-library/icons";
import { aiAssistant } from "../../../shared/customHooks/aiAssistant";
import ModeMenu from "../menus/ModeMenu";
import UsageLevelMenu from "../menus/UsageLevelMenu";
import styles from "../SparkSidebar.module.scss";

const ChatInput: Component = () => {
    const [text, setText] = createSignal("");

    const submit = () => {
        const value = text();
        if (!value.trim() || aiAssistant.status() === "streaming") return;
        aiAssistant.send(value);
        setText("");
    };

    const onKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            submit();
        }
    };

    return (
        <div class={styles.inputContainer}>
            <div class={styles.inputToolbar}>
                <Show when={aiAssistant.mode() === "homebrew"}>
                    <UsageLevelMenu />
                </Show>
                <ModeMenu />
            </div>
            <div class={styles.inputBar}>
                <TextArea
                    text={text}
                    setText={setText}
                    placeholder={aiAssistant.mode() === "homebrew" ? "Describe the homebrew to generate…" : "Ask Spark…"}
                    rows={1}
                    onKeyDown={onKeyDown}
                />
                <Button
                    theme="primary"
                    title="Send"
                    aria-label="Send message"
                    disabled={aiAssistant.status() === "streaming" || !text().trim()}
                    onClick={submit}
                >
                    <Icon icon={Send} size="small" />
                </Button>
            </div>
        </div>
    );
};

export default ChatInput;
