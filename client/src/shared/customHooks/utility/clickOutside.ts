import { Setter, onCleanup } from "solid-js";

export default function clickOutside(element: Element, accessor: () => any): void {
    const rootElement = document.getElementById("root");

    if (!rootElement) {
        console.warn("Root element not found.");
        return;
    }

    const handleClick = (event: MouseEvent) => {
        if (!!element && Object.keys(element).includes("contains") && !element.contains(event.target as Node)) {
            accessor()?.();
        }
    };

    rootElement.addEventListener("click", handleClick);

    onCleanup(() => {
        rootElement.removeEventListener("click", handleClick);
    });
}