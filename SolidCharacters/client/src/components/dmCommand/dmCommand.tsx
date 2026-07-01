import { Component, For, createSignal, onMount, onCleanup } from "solid-js";
import { Body } from "coles-solid-library";
import { isMobile } from "coles-solid-library/dist/tools/tools.js";
import GetTileElement, { tiles, getTileMetadata } from "./tileList";

const GAP = 10;

const DmCommand: Component = () => {
    const maxColumns = isMobile() ? 3 : 6;
    const [tileList, setTileList] = createSignal<tiles[]>(['main']);
    const [cellSize, setCellSize] = createSignal(0);
    let gridRef: HTMLDivElement | undefined;

    onMount(() => {
        if (!gridRef) return;
        const measure = () => {
            const w = gridRef!.clientWidth;
            setCellSize(Math.max(0, (w - GAP * (maxColumns - 1)) / maxColumns));
        };
        const observer = new ResizeObserver(measure);
        observer.observe(gridRef);
        measure();
        onCleanup(() => observer.disconnect());
    });

    return (
        <Body>
            <div>
                <h1>DM Command</h1>
            </div>
            <div>
                <div ref={gridRef} style={{
                    display: "grid",
                    "grid-template-columns": `repeat(${maxColumns}, 1fr)`,
                    "grid-auto-rows": `${cellSize()}px`,
                    "grid-auto-flow": "row dense",
                    gap: `${GAP}px`,
                }}>
                    <For each={tileList()}>{(key) => {
                        const meta = getTileMetadata(key);
                        return (
                            <div style={{
                                "grid-column": `span ${Math.min(meta.width, maxColumns)}`,
                                "grid-row": `span ${meta.height}`,
                                "box-sizing": "border-box",
                                overflow: "hidden",
                                border: "1px solid black",
                                padding: "10px",
                            }}>
                                {GetTileElement(key)}
                            </div>
                        );
                    }}</For>
                </div>
            </div>
        </Body>
    );
};

export default DmCommand;
