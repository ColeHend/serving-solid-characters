//ts-nocheck
import { Setter, onCleanup } from "solid-js";

export default function clickOutside(el: Element, accessor: () => any) {
    const body = document.getElementById("root")!;

    const onClick = (e: Event) => !el.contains(e.target as Node) && accessor()?.();

    body.addEventListener("click", onClick)
    
    onCleanup(() => {
        body.removeEventListener("click", onClick);
    });
}
