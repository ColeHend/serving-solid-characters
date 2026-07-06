import { Component, For, Show, createSignal, onCleanup } from "solid-js";
import { addSnackbar, Button, FormField, Icon, TextArea } from "coles-solid-library";
import { AudioFile, Close, Image, Mic, Send, Stop } from "coles-solid-library/icons";
import { aiAssistant } from "../../../shared/customHooks/aiAssistant";
import { ACCEPTED_IMAGE_TYPES, dataUrlOf, filesToAiImages } from "../../../shared/ai/imageAttach";
import { ACCEPTED_AUDIO_TYPES, dataUrlOf as audioUrlOf, filesToAiAudios, MAX_AUDIO_PER_MESSAGE } from "../../../shared/ai/audioAttach";
import { createMicRecorder, isRecordingSupported, MicRecorder } from "../../../shared/ai/audio/micRecorder";
import getUserSettings from "../../../shared/customHooks/userSettings";
import { DEFAULT_AI_MAX_AUDIO_SECONDS } from "../../../models/userSettings";
import ModeMenu from "../menus/ModeMenu";
import UsageLevelMenu from "../menus/UsageLevelMenu";
import styles from "../SparkSidebar.module.scss";

const ChatInput: Component = () => {
    // Draft text + pending images/audio live in the aiAssistant store (not local signals) so they survive the
    // sidebar Portal unmounting — e.g. a mobile camera pick that flicker-closes the panel. The recording
    // SESSION, by contrast, is transient and tied to the mounted composer, so it stays in local state.
    const text = aiAssistant.draft;
    const images = aiAssistant.pendingImages;
    const audio = aiAssistant.pendingAudio;
    const [userSettings] = getUserSettings();
    const [dragActive, setDragActive] = createSignal(false);
    const [isRecording, setIsRecording] = createSignal(false);
    const [recordElapsed, setRecordElapsed] = createSignal(0);
    let fileInput: HTMLInputElement | undefined;
    let audioInput: HTMLInputElement | undefined;
    let recorder: MicRecorder | null = null;
    let timer: number | undefined;
    const recordingSupported = isRecordingSupported();
    const audioFull = () => audio().length >= MAX_AUDIO_PER_MESSAGE;

    const canSend = () => !!text().trim() || images().length > 0 || audio().length > 0;

    const addFiles = async (files: ArrayLike<File> | null | undefined) => {
        if (!files || files.length === 0) return;
        const added = await filesToAiImages(files, images().length);
        if (added.length) aiAssistant.setPendingImages(prev => [...prev, ...added]);
    };

    const addAudioFiles = async (files: ArrayLike<File> | null | undefined) => {
        if (!files || files.length === 0) return;
        const added = await filesToAiAudios(files, audio().length);
        if (added.length) aiAssistant.setPendingAudio(prev => [...prev, ...added]);
    };

    const removeImage = (index: number) => aiAssistant.setPendingImages(prev => prev.filter((_, i) => i !== index));
    const removeAudio = (index: number) => aiAssistant.setPendingAudio(prev => prev.filter((_, i) => i !== index));

    const onPick = (e: Event) => {
        const input = e.currentTarget as HTMLInputElement;
        void addFiles(input.files);
        input.value = "";   // allow re-picking the same file
        aiAssistant.endFilePick();
    };

    const onPickAudio = (e: Event) => {
        const input = e.currentTarget as HTMLInputElement;
        void addAudioFiles(input.files);
        input.value = "";
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

    const clearTimer = () => { if (timer !== undefined) { clearInterval(timer); timer = undefined; } };

    const stopRecording = async () => {
        const rec = recorder;
        if (!rec || rec.state() !== "recording") return;
        clearTimer();
        setIsRecording(false);
        let file: File;
        try { file = await rec.stop(); } catch { recorder = null; return; }
        recorder = null;
        await addAudioFiles([file]);
    };

    const cancelRecording = () => {
        clearTimer();
        setIsRecording(false);
        recorder?.cancel();
        recorder = null;
    };

    const startRecording = async () => {
        if (!recordingSupported || isRecording() || audioFull()) return;
        const maxSeconds = userSettings().ai?.maxAudioSeconds ?? DEFAULT_AI_MAX_AUDIO_SECONDS;
        const rec = createMicRecorder({ maxSeconds, onMaxReached: () => void stopRecording() });
        recorder = rec;
        try {
            await rec.start();
        } catch {
            recorder = null;
            addSnackbar({ severity: "warning", message: "Microphone permission is required to record.", closeTimeout: 4000 });
            return;
        }
        setRecordElapsed(0);
        setIsRecording(true);
        timer = window.setInterval(() => setRecordElapsed(rec.elapsedMs()), 200);
    };

    const fmtElapsed = (ms: number) => {
        const s = Math.floor(ms / 1000);
        return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
    };

    const submit = () => {
        if (!canSend() || aiAssistant.status() === "streaming") return;
        cancelRecording();   // discard any half-captured clip; the user chose to send what's already attached
        aiAssistant.send(text(), images(), audio());
        aiAssistant.clearDraft();
    };

    const onKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            submit();
        }
    };

    onCleanup(cancelRecording);   // release the mic if the panel unmounts mid-record

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
            <Show when={audio().length > 0}>
                <div class={styles.audioStrip}>
                    <For each={audio()}>{(clip, i) => (
                        <div class={styles.audioChip}>
                            <audio controls src={audioUrlOf(clip)} />
                            <button type="button" class={styles.thumbRemove} title="Remove audio" aria-label="Remove audio" onClick={() => removeAudio(i())}>
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
                <input
                    ref={audioInput}
                    type="file"
                    accept={ACCEPTED_AUDIO_TYPES}
                    hidden
                    onChange={onPickAudio}
                />
                <div class={styles.attachButtons}>
                    <Button
                        transparent
                        title="Attach image"
                        aria-label="Attach image"
                        disabled={aiAssistant.status() === "streaming"}
                        onClick={() => { aiAssistant.beginFilePick(); fileInput?.click(); }}
                    >
                        <Icon icon={Image} size="small" />
                    </Button>
                    <Button
                        transparent
                        title="Attach audio"
                        aria-label="Attach audio"
                        disabled={aiAssistant.status() === "streaming" || audioFull()}
                        onClick={() => { aiAssistant.beginFilePick(); audioInput?.click(); }}
                    >
                        <Icon icon={AudioFile} size="small" />
                    </Button>
                    <Show when={recordingSupported}>
                        <Show
                            when={isRecording()}
                            fallback={
                                <Button
                                    transparent
                                    title="Record audio"
                                    aria-label="Record audio"
                                    disabled={aiAssistant.status() === "streaming" || audioFull()}
                                    onClick={() => void startRecording()}
                                >
                                    <Icon icon={Mic} size="small" />
                                </Button>
                            }
                        >
                            <Button transparent title="Stop & attach recording" aria-label="Stop recording" class={styles.recordingActive} onClick={() => void stopRecording()}>
                                <Icon icon={Stop} size="small" />
                            </Button>
                            <span class={styles.recordTimer}>{fmtElapsed(recordElapsed())}</span>
                            <Button transparent title="Discard recording" aria-label="Discard recording" onClick={cancelRecording}>
                                <Icon icon={Close} size="small" />
                            </Button>
                        </Show>
                    </Show>
                </div>
                <FormField name={aiAssistant.mode() === "homebrew" ? "Describe the homebrew to generate…" : "Ask Grimoire…"} variant="outlined">
                    <TextArea
                        text={text}
                        setText={aiAssistant.setDraft}
                        rows={1}
                        onKeyDown={onKeyDown}
                        onPaste={onPaste}
                    />
                </FormField>
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
