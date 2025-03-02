import { useContext } from "solid-js";
import { SharedHookContext } from "../../components/rootApp";
import { HookContext } from "../../models/hookContext";

export function useInjectServices(): HookContext {
  return useContext(SharedHookContext);
}