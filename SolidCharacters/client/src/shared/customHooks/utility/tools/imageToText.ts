import type Tesseract from "tesseract.js";
import { Setter } from "solid-js";

const useImageToText = async (imageText: Tesseract.ImageLike, setter: Setter<string>, callback?: ()=>any) => {
  // Load the heavy tesseract.js runtime (+wasm) on demand so it never enters an eager chunk.
  const { default: TesseractRuntime } = await import("tesseract.js");
  const worker = await TesseractRuntime.createWorker("eng")
  worker.recognize(imageText).then((res) => {
    setter(old=> !old ? res.data.text : old + "\n" + res.data.text);
    worker.terminate();
    if(callback) callback();
  });
};
export { useImageToText };
export default useImageToText;