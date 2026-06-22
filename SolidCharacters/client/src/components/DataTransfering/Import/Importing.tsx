import { Component, createSignal } from "solid-js";
import { importJsonObject } from "../../../shared/customHooks/utility/tools/importJsonObject";
import { Trade } from "../../../models/trade.model";
import { Icon, addSnackbar } from "coles-solid-library";
import { UploadFile } from "coles-solid-library/icons";
import styles from "./importing.module.scss";

const Importing: Component = () => {
  const [dragActive, setDragActive] = createSignal(false);
  let inputRef: HTMLInputElement | undefined;

  function arrayBufferToJson(buffer: ArrayBuffer): object {
    const decoder = new TextDecoder("utf-8");
    return JSON.parse(decoder.decode(buffer));
  }

  const readFile = (file: File) => {
    if (!file.name.toLowerCase().endsWith(".json")) {
      addSnackbar({ severity: "error", message: "Please choose a .json file", closeTimeout: 4000 });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      const arrayBuffer = e.target?.result as ArrayBuffer;
      try {
        const parsedJson = arrayBufferToJson(arrayBuffer);
        importJsonObject(parsedJson as Trade);
        addSnackbar({ severity: "success", message: `Imported "${file.name}"`, closeTimeout: 4000 });
      } catch (err) {
        addSnackbar({ severity: "error", message: "Error parsing JSON file" + err, closeTimeout: 4000 });
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) readFile(file);
  };

  return (
    <div
      class={styles.dropZone}
      classList={{ [styles.dragActive]: dragActive() }}
      onClick={() => inputRef?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setDragActive(true);
      }}
      onDragLeave={() => setDragActive(false)}
      onDrop={handleDrop}
    >
      <Icon icon={UploadFile} size="large" />
      <div class={styles.dropTitle}>Drag a .json file here</div>
      <div class={styles.dropHint}>or click to browse</div>
      <input
        ref={inputRef}
        class={styles.hiddenInput}
        type="file"
        accept="application/json,.json"
        onChange={(e) => {
          const file = e.currentTarget.files?.[0];
          if (file) readFile(file);
          e.currentTarget.value = "";
        }}
      />
    </div>
  );
};

export default Importing;
