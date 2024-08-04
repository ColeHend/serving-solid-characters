import { useContext } from "solid-js";
import { SharedHookContext } from "../../rootApp";
import { HookContext } from "../../models/hookContext";

export function useInjectServices(): HookContext {
    return useContext(SharedHookContext);
}