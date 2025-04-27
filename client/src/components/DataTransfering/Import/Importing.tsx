import { Component } from "solid-js";
import { importJsonObject } from "../../../shared/customHooks/utility/tools/importJsonObject";
import { Trade } from "../../../models/trade.model";
import addSnackbar from "../../../shared/components/Snackbar/snackbar";

const Importing:Component = () => {


  function arrayBufferToJson(buffer: ArrayBuffer): object {
    // Decode the ArrayBuffer to a string
    const decoder = new TextDecoder('utf-8');
    const jsonString = decoder.decode(buffer);
    
    // Parse the string into a JSON object
    return JSON.parse(jsonString);
  }

  const handleFileChange = (event:Event) => {
    const input = event.target as HTMLInputElement;
    const file = input.files ? input.files[0] : null;

    if (file) {
      const reader = new FileReader();

      reader.onload = (e:ProgressEvent<FileReader>) => {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        try {
          const parsedJson = arrayBufferToJson(arrayBuffer);
          importJsonObject(parsedJson as Trade)
        } catch (err) {
          addSnackbar({
            severity:'error',
            message: "Error parsing JSON file" + err,
            closeTimeout: 4000
          })
        }
      }
            
      reader.readAsArrayBuffer(file);
    }

  }

  return <div>
    <input
      type="file"
      onChange={(e)=>handleFileChange(e)}
    />
  </div>
}

export default Importing;