import { describe, it, expect } from "vitest";
import { AiMessage } from "../types";
import { toOllamaMessages } from "./ollamaAdapter";
import { toOpenAiMessages } from "./localAdapter";

const audio = { data: "QUJD", mediaType: "audio/wav" };       // base64 "ABC"
const image = { data: "SU1H", mediaType: "image/png" };       // base64 "IMG"

describe("toOllamaMessages — audio", () => {
    it("rides audio in the per-message images array (server auto-detects by bytes)", () => {
        const msgs: AiMessage[] = [{ role: "user", text: "transcribe", audio: [audio] }];
        const out = toOllamaMessages(msgs);
        expect(out[0]).toMatchObject({ role: "user", content: "transcribe", images: ["QUJD"] });
    });

    it("merges images and audio into one images array (images first)", () => {
        const out = toOllamaMessages([{ role: "user", text: "x", images: [image], audio: [audio] }]);
        expect(out[0].images).toEqual(["SU1H", "QUJD"]);
    });

    it("omits the images field when no media is attached", () => {
        const out = toOllamaMessages([{ role: "user", text: "hi" }]);
        expect(out[0].images).toBeUndefined();
    });
});

describe("toOpenAiMessages — audio", () => {
    it("emits an input_audio content part with the codec-name format, before the text", () => {
        const out = toOpenAiMessages([{ role: "user", text: "what is this", audio: [audio] }]);
        const content = out[0].content as Array<Record<string, any>>;
        expect(content[0]).toEqual({ type: "input_audio", input_audio: { data: "QUJD", format: "wav" } });
        expect(content[content.length - 1]).toEqual({ type: "text", text: "what is this" });
    });

    it("orders media before text: audio, then image, then text", () => {
        const out = toOpenAiMessages([{ role: "user", text: "t", images: [image], audio: [audio] }]);
        const content = out[0].content as Array<Record<string, any>>;
        expect(content.map(p => p.type)).toEqual(["input_audio", "image_url", "text"]);
    });

    it("derives the mp3 format from an audio/mpeg clip", () => {
        const out = toOpenAiMessages([{ role: "user", audio: [{ data: "QUJD", mediaType: "audio/mpeg" }] }]);
        const content = out[0].content as Array<Record<string, any>>;
        expect(content[0].input_audio.format).toBe("mp3");
    });
});
