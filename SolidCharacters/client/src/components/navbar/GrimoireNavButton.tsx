import { Component, onCleanup, onMount } from "solid-js";
import { Button, ignoreWindowManager, unignoreWindowManager } from "coles-solid-library";
import SparkIcon from "../../shared/components/aiSpark/sparkIcon";
import { aiAssistant } from "../../shared/customHooks/aiAssistant";

/**
 * Navbar trigger for the Grimoire sidebar. Its own component so its mount/unmount brackets the
 * window-manager ignore registration: the sidebar registers with the manager while open, and a
 * capture-phase click on this (outside the panel) would otherwise close-then-reopen it. Adding the
 * button to the global ignore list makes clicks on it never close the panel, leaving toggle() in charge.
 */
const GrimoireNavButton: Component = () => {
    let btnEl: HTMLElement | undefined;
    onMount(() => { if (btnEl) ignoreWindowManager(btnEl); });
    onCleanup(() => { if (btnEl) unignoreWindowManager(btnEl); });

    return (
        <Button transparent ref={(el: HTMLElement) => (btnEl = el)} title="Grimoire AI" onClick={() => aiAssistant.toggle()}>
            <SparkIcon size={24} />
        </Button>
    );
};

export default GrimoireNavButton;
