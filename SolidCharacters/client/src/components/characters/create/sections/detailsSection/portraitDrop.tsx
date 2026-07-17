import { Component, Show, createSignal } from "solid-js";
import { addSnackbar } from "coles-solid-library";
import styles from "./detailsSection.module.scss";

interface PortraitDropProps {
  portrait: string | undefined;
  onChange: (dataUrl: string | undefined) => void;
}

const MAX_EDGE = 512;

/** Downscale to ≤512px JPEG so portraits stay small inside the Dexie record. */
async function toPortraitDataUrl(file: File): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not read the image"));
    img.src = dataUrl;
  });
  const scale = Math.min(1, MAX_EDGE / Math.max(image.width, image.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(image.width * scale);
  canvas.height = Math.round(image.height * scale);
  canvas.getContext("2d")?.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.85);
}

export const PortraitDrop: Component<PortraitDropProps> = (props) => {
  const [dragging, setDragging] = createSignal(false);
  let fileInput: HTMLInputElement | undefined;

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      addSnackbar({ message: "Portraits must be images", severity: "warning" });
      return;
    }
    try {
      props.onChange(await toPortraitDataUrl(file));
    } catch (err) {
      console.error("portrait load failed", err);
      addSnackbar({ message: "Could not read that image", severity: "error" });
    }
  };

  return (
    <div
      class={styles.portrait}
      classList={{ [styles.portraitDragging]: dragging() }}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        void handleFile(e.dataTransfer?.files?.[0]);
      }}
    >
      <Show
        when={props.portrait}
        fallback={
          <button type="button" class={styles.portraitEmpty} onClick={() => fileInput?.click()}>
            Drop a portrait
            <span>or browse files</span>
          </button>
        }
      >
        <img class={styles.portraitImage} src={props.portrait} alt="Character portrait" />
        <button type="button" class={styles.portraitRemove} onClick={() => props.onChange(undefined)}>
          ×
        </button>
      </Show>
      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        class={styles.portraitInput}
        onChange={(e) => {
          void handleFile(e.currentTarget.files?.[0]);
          e.currentTarget.value = "";
        }}
      />
    </div>
  );
};
