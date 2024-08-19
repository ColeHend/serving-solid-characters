import { Setter, onCleanup, onMount } from "solid-js";

export default function clickOutside(element: HTMLElement, accessor: () => any): void {
    const rootElement = document.body;
		if (!element) {
				console.warn("Element not found.");
				return;
		}
    if (!rootElement) {
        console.warn("Root element not found.");
        return;
    }

    const handleClick = (event: MouseEvent) => {
			if (!!element && Object.keys(element).includes("contains") && !element.contains(event.target as Node)) {
            accessor();
        }
    };
		onMount(()=>{
			rootElement.addEventListener("click", handleClick);
		})

    onCleanup(() => {
        rootElement.removeEventListener("click", handleClick);
    });
}