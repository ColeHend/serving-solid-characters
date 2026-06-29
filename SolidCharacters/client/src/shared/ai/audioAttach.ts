// Leaf helper for turning user-picked/dropped/recorded audio files into AiAudio attachments for the
// Grimoire sidebar. Mirrors imageAttach.ts. No component imports (avoids component<->component cycles);
// UI calls these. Raw audio rides to audio-capable local models (e.g. Gemma 4 on Ollama).
import { addSnackbar } from "coles-solid-library";
import { AiAudio } from "./types";

/** What the file picker offers and what we accept from drop. WAV is the gold path; mp3/flac/ogg pass through. */
export const ACCEPTED_AUDIO_TYPES = "audio/wav,audio/x-wav,audio/mpeg,audio/mp3,audio/flac,audio/ogg";
/** Per-clip size cap. Base64 ~doubles bytes and rides in the persisted history, so keep it modest. */
export const MAX_AUDIO_BYTES = 10 * 1024 * 1024;   // 10 MB
/** One clip per message — audio is heavy and Gemma caps a single clip at 30s anyway. */
export const MAX_AUDIO_PER_MESSAGE = 1;
/** Max mic recording length. Gemma's hard audio limit is 30s; longer is truncated by the model. */
export const MAX_AUDIO_SECONDS = 30;

/** `data:<mediaType>;base64,<data>` for an inline `<audio src>`. */
export function dataUrlOf(audio: AiAudio): string {
    return `data:${audio.mediaType};base64,${audio.data}`;
}

/**
 * Codec name for the OpenAI-compatible `input_audio.format` field, derived from the mediaType. Defaults
 * to "wav" (our recorded clips and the safest server-side decode path).
 */
export function audioFormatOf(mediaType: string): string {
    const mt = mediaType.toLowerCase();
    if (mt.includes("wav")) return "wav";
    if (mt.includes("mpeg") || mt.includes("mp3")) return "mp3";
    if (mt.includes("flac")) return "flac";
    if (mt.includes("ogg")) return "ogg";
    return "wav";
}

/** Read one file into an AiAudio ({mediaType, raw base64}), splitting off the data-URL prefix. */
export function fileToAiAudio(file: File): Promise<AiAudio> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(reader.error ?? new Error("Could not read file"));
        reader.onload = () => {
            const url = String(reader.result ?? "");
            const comma = url.indexOf(",");
            // dataURL = "data:<mime>;base64,<data>" — pull the mime and the bare base64 payload.
            const mediaType = file.type || url.slice(5, url.indexOf(";"));
            resolve({ mediaType, data: comma >= 0 ? url.slice(comma + 1) : url });
        };
        reader.readAsDataURL(file);
    });
}

/**
 * Validate and convert a batch of dropped/picked/recorded files into AiAudios, honoring the per-message
 * count cap (given how many are already attached). Non-audio and oversize files are skipped with a
 * snackbar so a bad file never blocks the good ones. Returns the accepted attachments (possibly empty).
 */
export async function filesToAiAudios(files: ArrayLike<File>, existingCount: number): Promise<AiAudio[]> {
    const all = Array.from(files);
    const audios = all.filter(f => f.type.startsWith("audio/"));
    if (audios.length < all.length) {
        addSnackbar({ severity: "warning", message: "Only audio files can be attached.", closeTimeout: 4000 });
    }
    const sized = audios.filter(f => f.size <= MAX_AUDIO_BYTES);
    if (sized.length < audios.length) {
        addSnackbar({ severity: "warning", message: `Audio must be under ${Math.floor(MAX_AUDIO_BYTES / (1024 * 1024))} MB.`, closeTimeout: 4000 });
    }
    const room = Math.max(0, MAX_AUDIO_PER_MESSAGE - existingCount);
    const accepted = sized.slice(0, room);
    if (sized.length > room) {
        addSnackbar({ severity: "warning", message: `Up to ${MAX_AUDIO_PER_MESSAGE} audio clip${MAX_AUDIO_PER_MESSAGE === 1 ? "" : "s"} per message.`, closeTimeout: 4000 });
    }
    return Promise.all(accepted.map(fileToAiAudio));
}
