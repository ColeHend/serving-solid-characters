import { createMemo } from "solid-js";
import useDnDBackgrounds from "../dndInfo/srdinfo/useDnDBackgrounds";
import { e } from "@vite-pwa/assets-generator/shared/assets-generator.5e51fd40";

const useGetBackgrounds = () => {
    const dndSrdBackgrounds = useDnDBackgrounds();
    
    const allBackgrounds = createMemo(()=>[...dndSrdBackgrounds()]);
    return allBackgrounds;
}
export default useGetBackgrounds;