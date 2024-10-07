import { createDropzone, createFileUploader, UploadFile,fileUploader } from "@solid-primitives/upload";
import { Component, createSignal } from "solid-js";
import { importJsonObject } from "../../../shared/customHooks/utility/importJsonObject";
import { Trade } from "../../../models/trade.model";

const Importing:Component = () => {
    const [files,setFiles] = createSignal<UploadFile[]>([]);


    return <div>
        <input
        type="file"
        multiple
        use:fileUploader={{
            userCallback: fs => fs.forEach(file => importJsonObject(file as unknown as Trade)),
            setFiles,
        }}/>
    </div>
}

export default Importing;