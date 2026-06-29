import { Component, Show, createEffect, onCleanup } from "solid-js";
import { Button, Icon } from "coles-solid-library";
import { Close } from "coles-solid-library/icons";
import { aiAssistant } from "../../../shared/customHooks/aiAssistant";
import styles from "../SparkSidebar.module.scss";

/**
 * Full-screen viewer for an attached chat image. A custom fixed overlay (NOT the coles Modal, which
 * portals to <body> at z-index ~999 and would render behind the z-1200 sidebar) rendered inside the
 * sidebar's Portal at z-1300, so it sits above the panel. Dismisses on backdrop click, the X button, or
 * Escape; clicking the image itself is swallowed so users can inspect it without closing.
 */
const ImageLightbox: Component = () => {
    // Own Escape handler; the sidebar's Escape effect early-returns while a lightbox image is set.
    createEffect(() => {
        if (!aiAssistant.lightboxImage()) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") aiAssistant.closeLightbox(); };
        document.addEventListener("keydown", onKey);
        onCleanup(() => document.removeEventListener("keydown", onKey));
    });

    return (
        <Show when={aiAssistant.lightboxImage()}>
            <div class={styles.lightbox} role="dialog" aria-label="Image viewer" onClick={() => aiAssistant.closeLightbox()}>
                <Button
                    transparent
                    class={styles.lightboxClose}
                    title="Close"
                    aria-label="Close image viewer"
                    onClick={(e: MouseEvent) => { e.stopPropagation(); aiAssistant.closeLightbox(); }}
                >
                    <Icon icon={Close} size="large" />
                </Button>
                <img class={styles.lightboxImg} src={aiAssistant.lightboxImage()!} alt="attachment" onClick={(e) => e.stopPropagation()} />
            </div>
        </Show>
    );
};

export default ImageLightbox;
