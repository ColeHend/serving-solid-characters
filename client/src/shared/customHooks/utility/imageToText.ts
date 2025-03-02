import Tesseract from "tesseract.js";
import http$ from "../utility/httpClientObs";
import { concat, concatMap, map, tap } from "rxjs";
import { createSignal, Setter } from "solid-js";

const useImageToText = async (imageText: Tesseract.ImageLike, setter: Setter<string>, callback?: ()=>any) => {
  const worker = await Tesseract.createWorker("eng")
  worker.recognize(imageText).then((res) => {
    setter(old=> !old ? res.data.text : old + "\n" + res.data.text);
    worker.terminate();
    if(callback) callback();
  });
};
export { useImageToText };
export default useImageToText;