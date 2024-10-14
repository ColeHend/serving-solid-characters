import { Component, createEffect, createSignal } from "solid-js";
import { importJsonObject } from "../../../shared/customHooks/utility/importJsonObject";
import { Trade } from "../../../models/trade.model";
import { Button } from "../../../shared";
import addSnackbar from "../../../shared/components/Snackbar/snackbar";

const Importing:Component = () => {

    const [upload,setUpload] = createSignal<HTMLInputElement>()

    function arrayBufferToJson(buffer: ArrayBuffer): any {
        // Decode the ArrayBuffer to a string
        const decoder = new TextDecoder('utf-8');
        const jsonString = decoder.decode(buffer);
    
        // Parse the string into a JSON object
        return JSON.parse(jsonString);
    }

    createEffect(()=>{
        if (upload()) {
            upload()?.addEventListener("change", async(e)=>{
                const target = e.target as HTMLInputElement;
                const file = target.files ? target.files[0] : null
                
                console.log("file: ",file);

                const reader = new FileReader();

                if (!!file) {
                    console.log('yes');
                    
                    reader.onload = (e: ProgressEvent<FileReader>) => {
                        console.log("tryed");
                        try {
                            
                            if (typeof e.target?.result === "string") {
                                const arrayBuffer = e.target?.result as unknown as ArrayBuffer;

                                const jsonData = arrayBufferToJson(arrayBuffer)
                                const checkKeys = ["spells","feats","srdclasses","backgrounds","items","races","characters"]
                                if (!checkKeys.map(x=>Object.keys(jsonData).includes(x)).includes(false)) {
                                    console.log("Json data",jsonData);
                                    
                                    importJsonObject(jsonData)
                                } else {
                                    addSnackbar({
                                        severity:"error",
                                        message:"Invalid keys while parsing",
                                        closeTimeout: 4000,
                                    })
                                }
                            }
                        } catch (err) {
                            console.error("Error parsing JSON: ", err); // remove in prod
                            addSnackbar({
                                severity:"error",
                                message:"Error parsing JSON: " + err, // remove in prod
                                closeTimeout: 4000,
                            })
                        }
                    }
                }
    
              })
        }
    })
    return <div>
        <input
          type="file"
          ref={setUpload}
        />
        <Button onClick={()=>upload()} type="submit" >Submit</Button>
    </div>
}

export default Importing;