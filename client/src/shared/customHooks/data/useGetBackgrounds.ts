import { createMemo } from "solid-js";
import useDnDBackgrounds from "../dndInfo/srdinfo/useDnDBackgrounds";
import { e } from "@vite-pwa/assets-generator/shared/assets-generator.5e51fd40";
import homebrewManager from "../homebrewManager";

const useGetBackgrounds = () => {
    const dndSrdBackgrounds = useDnDBackgrounds();
    const allBackgrounds = createMemo(()=>[...dndSrdBackgrounds(), ...homebrewManager.backgrounds()]);
    return allBackgrounds;
}
export default useGetBackgrounds;