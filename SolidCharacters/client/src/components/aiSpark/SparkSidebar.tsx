import { Component, Show, createEffect, createSignal } from "solid-js";
import { Portal } from "solid-js/web";
import { Button, Container, Icon } from "coles-solid-library";
import { Close, Delete } from "coles-solid-library/icons";
import SparkIcon from "../../shared/components/aiSpark/sparkIcon";
import { aiAssistant } from "../../shared/customHooks/aiAssistant";
import ModeToggle from "./ModeToggle";
import ChatMessageList from "./ChatMessageList";
import ChatInput from "./ChatInput";
import styles from "./SparkSidebar.module.scss";

/**
 * Slide-out chat sidebar for the Spark assistant. Mirrors SideMenu's Portal + shouldRender +
 * 300ms open/close animation so it can animate out before unmounting. Deliberately does NOT
 * close on outside-click — that would dismiss the chat mid-stream.
 */
const SparkSidebar: Component = () => {
    const [shouldRender, setShouldRender] = createSignal(false);
    const [isOpening, setIsOpening] = createSignal(false);
    const [isClosing, setIsClosing] = createSignal(false);

    createEffect(() => {
        if (aiAssistant.isOpen()) {
            setShouldRender(true);
            setIsClosing(false);
            setIsOpening(true);
            setTimeout(() => setIsOpening(false), 300);
        } else if (shouldRender()) {
            setIsClosing(true);
            setIsOpening(false);
            setTimeout(() => { setShouldRender(false); setIsClosing(false); }, 300);
        }
    });

    return (
        <Show when={shouldRender()}>
            <Portal>
                <Container
                    theme="container"
                    class={`${styles.sidebar} ${isOpening() ? styles.opening : ""} ${isClosing() ? styles.closing : ""}`}
                >
                    <div class={styles.header}>
                        <div class={styles.title}>
                            <SparkIcon size={22} />
                            <span>Spark</span>
                        </div>
                        <div class={styles.headerActions}>
                            <Button transparent title="Clear conversation" onClick={() => aiAssistant.clear()}>
                                <Icon icon={Delete} size="small" />
                            </Button>
                            <Button transparent title="Close" onClick={() => aiAssistant.close()}>
                                <Icon icon={Close} size="large" />
                            </Button>
                        </div>
                    </div>
                    <ModeToggle />
                    <ChatMessageList />
                    <ChatInput />
                </Container>
            </Portal>
        </Show>
    );
};

export default SparkSidebar;
