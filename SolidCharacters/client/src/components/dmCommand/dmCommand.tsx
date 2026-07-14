import { Component, For, createSignal, onMount, onCleanup, createMemo } from "solid-js";
import { Body } from "coles-solid-library";
import { isMobile } from "coles-solid-library/dist/tools/tools.js";
import GetTileElement, { tiles, getTileMetadata } from "./tileList";
import { DmHeader } from "./header/dmHeader";
import { EventChipBar } from "./eventChipBar/eventChipBar";
import style from "./dmCommand.module.scss";

const GAP = 10;

const DmCommand: Component = () => {
    const maxColumns = isMobile() ? 3 : 6;
    // Set Campaign And Session
    const [campaignSelected, setCampaignSelected] = createSignal<string>();
    const [sessionSelected, setSessionSelected] = createSignal<string>();

    // Tiles stuff
    const [tileList] = createSignal<tiles[]>([
        'activeEvent',
        'party',
        'lootXp',
        'bestiary',
        'notes',
    ]);
    const completeTileList = createMemo(() => {
        return tileList().map((key) => ({
            element: GetTileElement(key, campaignSelected() ?? '', sessionSelected() ?? ''),
            meta: getTileMetadata(key),
        }));
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

    return (
        <Body class={`${style.mainBody}`}>
            <div class={`${style.headerWrap}`}>
                <DmHeader
                    campaign={campaignSelected()}
                    session={sessionSelected()}
                    onCampaignChange={setCampaignSelected}
                    onSessionChange={setSessionSelected} />
                <EventChipBar />
            </div>
            <div class={`${style.body}`}>
                <div ref={gridRef} style={{
                    display: "grid",
                    "grid-template-columns": `repeat(${maxColumns}, 1fr)`,
                    "grid-auto-rows": `${cellSize()}px`,
                    "grid-auto-flow": "row dense",
                    gap: `${GAP}px`,
                }}>
                    <For each={completeTileList()}>{({ element, meta }) => {
                        return (
                            <div style={{
                                "grid-column": `span ${Math.min(meta.width, maxColumns)}`,
                                "grid-row": `span ${isMobile() ? meta.height + 1 : meta.height}`,
                                "box-sizing": "border-box",
                                overflow: "hidden",
                                'border-radius': '11px'
                            }}>
                                {element}
                            </div>
                        );
                    }}</For>
                </div>
            </div>
        </Body>
    );
};

export default DmCommand;
