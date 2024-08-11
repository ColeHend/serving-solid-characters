import Tesseract from "tesseract.js";
import http$ from "../utility/httpClientObs";
import { concat, concatMap, map, tap } from "rxjs";
import { createSignal, Setter } from "solid-js";

const useImageToText = async (imageText: Tesseract.ImageLike, setter: Setter<string>) => {
    const worker = await Tesseract.createWorker("eng")
    worker.recognize(imageText).then((res) => {
        setter(old=> old + res.data.text);
        worker.terminate();
    });
};
export { useImageToText };
export default useImageToText;