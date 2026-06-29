// Leaf helper for turning user-picked/pasted/dropped image files into AiImage attachments for the
// Grimoire sidebar. No component imports (avoids component<->component cycles); UI calls these.
import { addSnackbar } from "coles-solid-library";
import { AiImage } from "./types";

/** What the file picker offers and what we accept from paste/drop. */
export const ACCEPTED_IMAGE_TYPES = "image/*";
/** Per-image size cap. Base64 ~doubles bytes and rides in the persisted history, so keep it modest. */
export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;   // 8 MB
/** Max images on a single message — keeps the prompt (and local context window) sane. */
export const MAX_IMAGES_PER_MESSAGE = 6;

/** `data:<mediaType>;base64,<data>` for an `<img src>` or the OpenAI-compatible `image_url`. */
export function dataUrlOf(img: AiImage): string {
    return `data:${img.mediaType};base64,${img.data}`;
}

/** Read one file into an AiImage ({mediaType, raw base64}), splitting off the data-URL prefix. */
export function fileToAiImage(file: File): Promise<AiImage> {
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
 * Validate and convert a batch of dropped/picked/pasted files into AiImages, honoring the per-message
 * count cap (given how many are already attached). Non-images and oversize files are skipped with a
 * snackbar so a bad file never blocks the good ones. Returns the accepted attachments (possibly empty).
 */
export async function filesToAiImages(files: ArrayLike<File>, existingCount: number): Promise<AiImage[]> {
    const all = Array.from(files);
    const images = all.filter(f => f.type.startsWith("image/"));
    if (images.length < all.length) {
        addSnackbar({ severity: "warning", message: "Only image files can be attached.", closeTimeout: 4000 });
    }
    const sized = images.filter(f => f.size <= MAX_IMAGE_BYTES);
    if (sized.length < images.length) {
        addSnackbar({ severity: "warning", message: `Images must be under ${Math.floor(MAX_IMAGE_BYTES / (1024 * 1024))} MB.`, closeTimeout: 4000 });
    }
    const room = Math.max(0, MAX_IMAGES_PER_MESSAGE - existingCount);
    const accepted = sized.slice(0, room);
    if (sized.length > room) {
        addSnackbar({ severity: "warning", message: `Up to ${MAX_IMAGES_PER_MESSAGE} images per message.`, closeTimeout: 4000 });
    }
    return Promise.all(accepted.map(fileToAiImage));
}
