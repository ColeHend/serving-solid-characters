// Microphone capture controller for the Grimoire composer. Captures Float32 PCM via the Web Audio graph
// and encodes a 16 kHz mono WAV on stop (see wavEncoder) — NOT MediaRecorder, whose webm/opus output the
// Gemma/llama.cpp/Ollama audio decoders don't reliably accept. Touches browser-only APIs, so it's created
// lazily behind a feature check (isRecordingSupported) and torn down completely on stop/cancel/error.
import { downsampleTo, encodeWav, floatTo16BitPCM } from "./wavEncoder";

export type RecorderState = "idle" | "recording" | "encoding" | "error";

export interface MicRecorder {
    /** Acquire the mic and begin capturing. Rejects on permission denial / unsupported context. */
    start(): Promise<void>;
    /** Stop capturing and resolve to a WAV File (audio/wav, 16 kHz mono). Tears down the graph + mic. */
    stop(): Promise<File>;
    /** Abandon the recording: tear everything down, keep no clip. Safe to call any time. */
    cancel(): void;
    /** Milliseconds captured so far (0 when idle). */
    elapsedMs(): number;
    state(): RecorderState;
}

export interface MicRecorderOptions {
    /** Hard cap on clip length; capture stops accepting samples past this and fires onMaxReached. */
    maxSeconds?: number;
    /** Target WAV sample rate. Gemma expects 16 kHz. */
    targetRate?: number;
    /** Invoked once when maxSeconds is hit, so the UI can flip its button to "stopping". */
    onMaxReached?: () => void;
}

type AudioCtxCtor = typeof AudioContext;

/** True when mic capture is usable in this context (secure origin + Web Audio + getUserMedia present). */
export function isRecordingSupported(): boolean {
    if (typeof window === "undefined" || typeof navigator === "undefined") return false;
    const hasGUM = !!navigator.mediaDevices?.getUserMedia;
    const hasCtx = !!(window.AudioContext || (window as unknown as { webkitAudioContext?: AudioCtxCtor }).webkitAudioContext);
    return hasGUM && hasCtx;
}

export function createMicRecorder(options: MicRecorderOptions = {}): MicRecorder {
    const maxSeconds = options.maxSeconds && options.maxSeconds > 0 ? options.maxSeconds : 30;
    const targetRate = options.targetRate && options.targetRate > 0 ? options.targetRate : 16000;

    let state: RecorderState = "idle";
    let stream: MediaStream | null = null;
    let ctx: AudioContext | null = null;
    let source: MediaStreamAudioSourceNode | null = null;
    let processor: ScriptProcessorNode | null = null;
    let zeroGain: GainNode | null = null;
    let chunks: Float32Array[] = [];
    let collected = 0;          // total Float32 samples captured at the context's native rate
    let captureRate = targetRate;
    let startedAt = 0;
    let maxReached = false;

    const teardown = () => {
        try { processor?.disconnect(); } catch { /* already gone */ }
        try { zeroGain?.disconnect(); } catch { /* already gone */ }
        try { source?.disconnect(); } catch { /* already gone */ }
        if (processor) processor.onaudioprocess = null;
        stream?.getTracks().forEach(t => t.stop());   // releases the mic + clears the OS mic indicator
        if (ctx && ctx.state !== "closed") void ctx.close();
        processor = null; zeroGain = null; source = null; stream = null; ctx = null;
    };

    const reset = () => { chunks = []; collected = 0; maxReached = false; startedAt = 0; };

    const start = async (): Promise<void> => {
        if (state === "recording") return;
        reset();
        try {
            stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: AudioCtxCtor }).webkitAudioContext;
            ctx = new Ctor();
            // Safari/iOS hand back a suspended context until a user gesture; we're inside the click handler.
            if (ctx.state === "suspended") await ctx.resume();
            captureRate = ctx.sampleRate;
            source = ctx.createMediaStreamSource(stream);
            // Declare 1 input channel so a stereo mic is downmixed to mono by the graph for us.
            processor = ctx.createScriptProcessor(4096, 1, 1);
            const maxSamples = Math.floor(maxSeconds * captureRate);
            processor.onaudioprocess = (e: AudioProcessingEvent) => {
                if (state !== "recording" || maxReached) return;
                const input = e.inputBuffer.getChannelData(0);
                // Copy — the event buffer is reused across callbacks.
                chunks.push(new Float32Array(input));
                collected += input.length;
                if (collected >= maxSamples) {
                    maxReached = true;
                    options.onMaxReached?.();
                }
            };
            // Route through a muted gain to destination so onaudioprocess fires without feeding the mic
            // back to the speakers.
            zeroGain = ctx.createGain();
            zeroGain.gain.value = 0;
            source.connect(processor);
            processor.connect(zeroGain);
            zeroGain.connect(ctx.destination);
            startedAt = Date.now();
            state = "recording";
        } catch (e) {
            teardown();
            state = "error";
            throw e instanceof Error ? e : new Error(String(e));
        }
    };

    const stop = async (): Promise<File> => {
        if (state !== "recording") throw new Error("Not recording");
        state = "encoding";
        // Concatenate captured chunks (already mono) into one Float32 buffer.
        const total = chunks.reduce((n, c) => n + c.length, 0);
        const merged = new Float32Array(total);
        let offset = 0;
        for (const c of chunks) { merged.set(c, offset); offset += c.length; }
        teardown();
        const down = downsampleTo(merged, captureRate, targetRate);
        const pcm = floatTo16BitPCM(down);
        const blob = encodeWav(pcm, targetRate, 1);
        state = "idle";
        return new File([blob], `recording-${Date.now()}.wav`, { type: "audio/wav" });
    };

    const cancel = () => {
        teardown();
        reset();
        state = "idle";
    };

    const elapsedMs = () => (startedAt ? Date.now() - startedAt : 0);

    return { start, stop, cancel, elapsedMs, state: () => state };
}
