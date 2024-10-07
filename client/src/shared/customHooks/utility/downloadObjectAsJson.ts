import { Trade } from "../../../models/trade.model";

export function downloadObjectAsJson(data: Trade, filename: string): void {
    const jsonString = JSON.stringify(data, null, 2); // Pretty-print with 2 spaces

    console.log("JsonString",jsonString);
    
    const blob = new Blob([jsonString], { type: 'application/json' });

    console.log("blob",blob);
    

    const url = URL.createObjectURL(blob);
  
    const link = document.createElement('a');
    link.href = url;
    link.download = filename.endsWith('.json') ? filename : `${filename}.json`;
    document.body.appendChild(link); // Append to body
    link.click();
    document.body.removeChild(link); // Clean up
  
    URL.revokeObjectURL(url);
  }