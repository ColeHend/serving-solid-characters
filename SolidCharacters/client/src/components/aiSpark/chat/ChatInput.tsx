import { Component, For, Show, createSignal } from "solid-js";
import { Button, Icon, TextArea } from "coles-solid-library";
import { Close, Image, Send } from "coles-solid-library/icons";
import { aiAssistant } from "../../../shared/customHooks/aiAssistant";
import { ACCEPTED_IMAGE_TYPES, dataUrlOf, filesToAiImages } from "../../../shared/ai/imageAttach";
import ModeMenu from "../menus/ModeMenu";
import UsageLevelMenu from "../menus/UsageLevelMenu";
import styles from "../SparkSidebar.module.scss";

const ChatInput: Component = () => {
    // Draft text + pending images live in the aiAssistant store (not local signals) so they survive the
    // sidebar Portal unmounting — e.g. a mobile camera pick that flicker-closes the panel.
    const text = aiAssistant.draft;
    const images = aiAssistant.pendingImages;
    const [dragActive, setDragActive] = createSignal(false);
    let fileInput: HTMLInputElement | undefined;

    const canSend = () => !!text().trim() || images().length > 0;

    const addFiles = async (files: ArrayLike<File> | null | undefined) => {
        if (!files || files.length === 0) return;
        const added = await filesToAiImages(files, images().length);
        if (added.length) aiAssistant.setPendingImages(prev => [...prev, ...added]);
    };

    const removeImage = (index: number) => aiAssistant.setPendingImages(prev => prev.filter((_, i) => i !== index));

    const onPick = (e: Event) => {
        const input = e.currentTarget as HTMLInputElement;
        void addFiles(input.files);
        input.value = "";   // allow re-picking the same file
        aiAssistant.endFilePick();
    };

    const onPaste = (e: ClipboardEvent) => {
        const files = e.clipboardData?.files;
        if (files && files.length) void addFiles(files);   // images only; plain-text paste falls through
    };

    const onDrop = (e: DragEvent) => {
        e.preventDefault();
        setDragActive(false);
        void addFiles(e.dataTransfer?.files);
    };

    const submit = () => {
        if (!canSend() || aiAssistant.status() === "streaming") return;
        aiAssistant.send(text(), images());
        aiAssistant.clearDraft();
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
            <Show when={images().length > 0}>
                <div class={styles.thumbStrip}>
                    <For each={images()}>{(img, i) => (
                        <div class={styles.thumb}>
                            <img src={dataUrlOf(img)} alt="attachment" onClick={() => aiAssistant.openLightbox(dataUrlOf(img))} />
                            <button type="button" class={styles.thumbRemove} title="Remove image" aria-label="Remove image" onClick={(e) => { e.stopPropagation(); removeImage(i()); }}>
                                <Icon icon={Close} size="small" />
                            </button>
                        </div>
                    )}</For>
                </div>
            </Show>
            <div
                class={`${styles.inputBar} ${dragActive() ? styles.dragActive : ""}`}
                onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={() => setDragActive(false)}
                onDrop={onDrop}
            >
                <input
                    ref={fileInput}
                    type="file"
                    accept={ACCEPTED_IMAGE_TYPES}
                    multiple
                    hidden
                    onChange={onPick}
                />
                <Button
                    transparent
                    title="Attach image"
                    aria-label="Attach image"
                    disabled={aiAssistant.status() === "streaming"}
                    onClick={() => { aiAssistant.beginFilePick(); fileInput?.click(); }}
                >
                    <Icon icon={Image} size="small" />
                </Button>
                <TextArea
                    text={text}
                    setText={aiAssistant.setDraft}
                    placeholder={aiAssistant.mode() === "homebrew" ? "Describe the homebrew to generate…" : "Ask Grimoire…"}
                    rows={1}
                    onKeyDown={onKeyDown}
                    onPaste={onPaste}
                />
                <Button
                    theme="primary"
                    title="Send"
                    aria-label="Send message"
                    disabled={aiAssistant.status() === "streaming" || !canSend()}
                    onClick={submit}
                >
                    <Icon icon={Send} size="small" />
                </Button>
            </div>
        </div>
    );
};

export default ChatInput;
