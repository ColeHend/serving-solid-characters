// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { audioFormatOf, fileToAiAudio, filesToAiAudios, MAX_AUDIO_PER_MESSAGE } from "./audioAttach";

const audioFile = (name: string, type: string, bytes = [1, 2, 3, 4]) =>
    new File([new Uint8Array(bytes)], name, { type });

describe("audioFormatOf", () => {
    it("maps mediaTypes to the OpenAI input_audio codec name, defaulting to wav", () => {
        expect(audioFormatOf("audio/wav")).toBe("wav");
        expect(audioFormatOf("audio/x-wav")).toBe("wav");
        expect(audioFormatOf("audio/mpeg")).toBe("mp3");
        expect(audioFormatOf("audio/mp3")).toBe("mp3");
        expect(audioFormatOf("audio/flac")).toBe("flac");
        expect(audioFormatOf("audio/ogg")).toBe("ogg");
        expect(audioFormatOf("audio/weird")).toBe("wav");
    });
});

describe("fileToAiAudio", () => {
    it("reads a file into {mediaType, raw base64} with the data-URL prefix stripped", async () => {
        const out = await fileToAiAudio(audioFile("clip.wav", "audio/wav", [104, 105]));   // "hi"
        expect(out.mediaType).toBe("audio/wav");
        expect(out.data).not.toContain(",");
        expect(out.data).not.toContain("base64");
        expect(atob(out.data)).toBe("hi");
    });
});

describe("filesToAiAudios", () => {
    it("keeps audio files and drops non-audio", async () => {
        const out = await filesToAiAudios([audioFile("a.wav", "audio/wav"), audioFile("b.png", "image/png")], 0);
        expect(out).toHaveLength(1);
        expect(out[0].mediaType).toBe("audio/wav");
    });

    it("honors the per-message count cap given what is already attached", async () => {
        const two = [audioFile("a.wav", "audio/wav"), audioFile("b.wav", "audio/wav")];
        expect(await filesToAiAudios(two, 0)).toHaveLength(MAX_AUDIO_PER_MESSAGE);
        expect(await filesToAiAudios(two, MAX_AUDIO_PER_MESSAGE)).toHaveLength(0);   // no room left
    });
});
