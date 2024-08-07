import { Setter, onCleanup } from "solid-js";

/**
 * Registers a click outside event listener on the specified element.
 * 
 * @param element - The element to check if a click occurred outside of.
 * @param accessor - A function to be called when a click occurs outside of the element.
 */
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