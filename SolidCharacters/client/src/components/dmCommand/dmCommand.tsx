import { Component, For, createSignal, onMount, onCleanup, createEffect, createMemo } from "solid-js";
import { Body, Button, Icon, Menu, Modal } from "coles-solid-library";
import { isMobile } from "coles-solid-library/dist/tools/tools.js";
import GetTileElement, { tiles, getTileMetadata, TileData } from "./tileList";
import style from "./dmCommand.module.scss";
import { FilterAlt } from "coles-solid-library/icons";
import { JSX } from "solid-js";

const GAP = 10;

const DmCommand: Component = () => {
    const maxColumns = isMobile() ? 3 : 6;
    // Filter Settings
    const [showFilterSettings, setShowFilterSettings] = createSignal<boolean>(false);
    const [filterModal, setFilterModal] = createSignal<Element>()
    const [filterSettings, setFilterSettings] = createSignal<Record<string, string>>({});
    
    // Tiles stuff
    const [tileList, setTileList] = createSignal<tiles[]>([
        'main',
    ]);
    const completeTileList = createMemo(()=>{
        return tileList().map((key)=>[
            GetTileElement(key),
            getTileMetadata(key),
        ]);
    });
    const filteredTileList = createMemo<Array<[JSX.Element, TileData]>>(() => {
        // Filter logic goes here
        return completeTileList().filter(([element, data])=> true) as Array<[JSX.Element, TileData]>;
    });
    
    const [cellSize, setCellSize] = createSignal(0);
    let gridRef: HTMLDivElement | undefined;

    onMount(() => {
        document.body.classList.add("character-view-bg");
        if (!gridRef) return;
        const measure = () => {
            const w = gridRef!.clientWidth;
            setCellSize(Math.max(0, (w - GAP * (maxColumns - 1)) / maxColumns));
        };
        const observer = new ResizeObserver(measure);
        observer.observe(gridRef);
        measure();
        onCleanup(() => {
            document.body.classList.remove("character-view-bg");
            observer.disconnect();
        });
    });

    // Add class to modal
    createEffect(()=>{
        const modal = filterModal();
        if (modal) {
            modal.classList.add(`${style.modal}`);
        }
    });

    return (
        <Body class={`${style.mainBody}`}>
            <div class={`${style.header}`}>
                <h1>DM Command</h1>
                <Button transparent onClick={()=>{
                    setShowFilterSettings(true);
                }}><Icon icon={FilterAlt} /></Button>
                <Modal 
                    title="Filter Settings" 
                    show={[showFilterSettings, setShowFilterSettings]}
                    width={isMobile() ? '' : '20vw'}
                    height={'30vh'}
                    ref={setFilterModal}>

                </Modal>
            </div>
            <div class={`${style.body}`}>
                <div ref={gridRef} style={{
                    display: "grid",
                    "grid-template-columns": `repeat(${maxColumns}, 1fr)`,
                    "grid-auto-rows": `${cellSize()}px`,
                    "grid-auto-flow": "row dense",
                    gap: `${GAP}px`,
                }}>
                    <For each={filteredTileList()}>{([tile, meta]) => {
                        return (
                            <div style={{
                                "grid-column": `span ${Math.min(meta.width, maxColumns)}`,
                                "grid-row": `span ${meta.height}`,
                                "box-sizing": "border-box",
                                overflow: "hidden",
                                'border-radius': '11px'
                            }}>
                                {tile}
                            </div>
                        );
                    }}</For>
                </div>
            </div>
        </Body>
    );
};

export default DmCommand;
