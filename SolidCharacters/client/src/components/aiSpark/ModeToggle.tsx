import { Component } from "solid-js";
import { Button, Icon } from "coles-solid-library";
import { Bolt, Chat } from "coles-solid-library/icons";
import { aiAssistant } from "../../shared/customHooks/aiAssistant";
import styles from "./SparkSidebar.module.scss";

/** Switches the assistant between plain chat and structured homebrew generation. */
const ModeToggle: Component = () => {
    return (
        <div class={styles.modeToggle}>
            <Button
                transparent={aiAssistant.mode() !== "chat"}
                theme={aiAssistant.mode() === "chat" ? "primary" : undefined}
                title="Chat"
                onClick={() => aiAssistant.setMode("chat")}
            >
                <Icon icon={Chat} size="small" /> Chat
            </Button>
            <Button
                transparent={aiAssistant.mode() !== "homebrew"}
                theme={aiAssistant.mode() === "homebrew" ? "primary" : undefined}
                title="Generate homebrew"
                onClick={() => aiAssistant.setMode("homebrew")}
            >
                <Icon icon={Bolt} size="small" /> Homebrew
            </Button>
        </div>
    );
};

export default ModeToggle;
