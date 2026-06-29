import { describe, it, expect } from "vitest";
import { downsampleTo, encodeWav, floatTo16BitPCM } from "./wavEncoder";

describe("floatTo16BitPCM", () => {
    it("maps the full-scale range and saturates out-of-range samples", () => {
        const out = floatTo16BitPCM(new Float32Array([0, 1, -1, 2, -2, 0.5]));
        expect(out[0]).toBe(0);
        expect(out[1]).toBe(32767);    // +full scale
        expect(out[2]).toBe(-32768);   // -full scale
        expect(out[3]).toBe(32767);    // clamped from 2
        expect(out[4]).toBe(-32768);   // clamped from -2
        expect(out[5]).toBe(16383);    // 0.5 * 0x7fff, truncated
    });
});

describe("downsampleTo", () => {
    it("returns the input unchanged when rates match", () => {
        const input = new Float32Array([1, 2, 3]);
        expect(downsampleTo(input, 16000, 16000)).toBe(input);
    });

    it("halves the sample count when halving the rate", () => {
        const input = new Float32Array([0, 1, 2, 3]);
        const out = downsampleTo(input, 4, 2);
        expect(out.length).toBe(2);
        expect(out[0]).toBeCloseTo(0);   // pos 0
        expect(out[1]).toBeCloseTo(2);   // pos 2
    });
});

describe("encodeWav", () => {
    it("writes a canonical 44-byte RIFF/WAVE header followed by the PCM body", async () => {
        const samples = new Int16Array([1, -1, 1000]);
        const blob = encodeWav(samples, 16000, 1);
        expect(blob.type).toBe("audio/wav");
        const view = new DataView(await blob.arrayBuffer());
        const tag = (off: number) => String.fromCharCode(view.getUint8(off), view.getUint8(off + 1), view.getUint8(off + 2), view.getUint8(off + 3));

        expect(tag(0)).toBe("RIFF");
        expect(tag(8)).toBe("WAVE");
        expect(tag(12)).toBe("fmt ");
        expect(view.getUint16(20, true)).toBe(1);        // PCM
        expect(view.getUint16(22, true)).toBe(1);        // mono
        expect(view.getUint32(24, true)).toBe(16000);    // sample rate
        expect(view.getUint32(28, true)).toBe(16000 * 2);// byte rate = rate * blockAlign
        expect(view.getUint16(34, true)).toBe(16);       // bits per sample
        expect(tag(36)).toBe("data");
        expect(view.getUint32(40, true)).toBe(samples.length * 2);
        expect(view.byteLength).toBe(44 + samples.length * 2);
        // Sample body round-trips little-endian.
        expect(view.getInt16(44, true)).toBe(1);
        expect(view.getInt16(48, true)).toBe(1000);
    });
});
