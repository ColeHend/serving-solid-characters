import { Accessor, createEffect } from "solid-js";
import { useDnDClasses } from "./shared/customHooks/dndInfo/info/all/classes";
import { useDnDSubclasses } from "./shared/customHooks/dndInfo/info/all/subclasses";
import { Class5E, Subclass } from "./models/data";

export function useTest(): [Accessor<Class5E[]>, Accessor<Subclass[]>] {
  const classes = useDnDClasses("2024");
  const subclasses = useDnDSubclasses("2024");
  createEffect(() => {
    console.log("Classes: ", classes());
    console.log("Subclasses: ", subclasses());
  })
  return [classes, subclasses];
}