// Pure, dependency-free PCM → 16-bit WAV encoding for mic-captured audio. No browser APIs here (no
// AudioContext/DOM), so it's unit-testable in jsdom and reusable. The mic recorder collects Float32 PCM
// from the Web Audio graph, then uses these to downsample to 16 kHz mono and wrap the samples in a RIFF
// container that Gemma/llama.cpp/Ollama decode reliably (unlike MediaRecorder's webm/opus).

/** Clamp Float32 samples in [-1, 1] to signed 16-bit PCM. Out-of-range values are saturated, not wrapped. */
export function floatTo16BitPCM(input: Float32Array): Int16Array {
    const out = new Int16Array(input.length);
    for (let i = 0; i < input.length; i++) {
        const s = Math.max(-1, Math.min(1, input[i]));
        // Negative full-scale is -32768, positive is +32767 — scale each side by its own max.
        out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    return out;
}

/**
 * Linear-interpolation resample from `fromRate` to `toRate`. Returns the input unchanged when the rates
 * match (or either is non-positive). Used to bring the AudioContext's native rate (often 44100/48000)
 * down to Gemma's expected 16 kHz, which also shrinks the payload.
 */
export function downsampleTo(input: Float32Array, fromRate: number, toRate: number): Float32Array {
    if (fromRate <= 0 || toRate <= 0 || fromRate === toRate) return input;
    const ratio = fromRate / toRate;
    const outLength = Math.max(0, Math.floor(input.length / ratio));
    const out = new Float32Array(outLength);
    for (let i = 0; i < outLength; i++) {
        const pos = i * ratio;
        const left = Math.floor(pos);
        const right = Math.min(left + 1, input.length - 1);
        const frac = pos - left;
        out[i] = input[left] * (1 - frac) + input[right] * frac;
    }
    return out;
}

/**
 * Wrap PCM samples in a 44-byte canonical RIFF/WAVE header and return an `audio/wav` Blob. `samples` is
 * interleaved 16-bit PCM (mono = no interleaving needed). Defaults match the recorder: 16 kHz mono.
 */
export function encodeWav(samples: Int16Array, sampleRate = 16000, channels = 1): Blob {
    const bytesPerSample = 2;
    const blockAlign = channels * bytesPerSample;
    const dataSize = samples.length * bytesPerSample;
    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);

    const writeStr = (offset: number, str: string) => {
        for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
    };

    writeStr(0, "RIFF");
    view.setUint32(4, 36 + dataSize, true);   // chunk size = 36 + data
    writeStr(8, "WAVE");
    writeStr(12, "fmt ");
    view.setUint32(16, 16, true);             // PCM fmt chunk size
    view.setUint16(20, 1, true);              // audio format = 1 (PCM)
    view.setUint16(22, channels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true);   // byte rate
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bytesPerSample * 8, true);        // bits per sample
    writeStr(36, "data");
    view.setUint32(40, dataSize, true);
    for (let i = 0; i < samples.length; i++) view.setInt16(44 + i * bytesPerSample, samples[i], true);

    return new Blob([buffer], { type: "audio/wav" });
}
