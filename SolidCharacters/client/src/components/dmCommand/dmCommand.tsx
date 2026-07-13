import { Component, For, createSignal, onMount, onCleanup, createEffect, createMemo, Show } from "solid-js";
import { Body, Button, Icon, Menu, Modal, Select, Option } from "coles-solid-library";
import { isMobile } from "coles-solid-library/dist/tools/tools.js";
import { Add, FilterAlt } from "coles-solid-library/icons";
import GetTileElement, { tiles, getTileMetadata, TileData } from "./tileList";
import style from "./dmCommand.module.scss";
import { JSX } from "solid-js";
import { useActiveEvents } from "./hooks/activeEvents";

const GAP = 10;

const DmCommand: Component = () => {
    const maxColumns = isMobile() ? 3 : 6;
    // Set Campaign And Session
    const [campaignSelected, setCampaignSelected] = createSignal<string>(); 
    const [sessionSelected, setSessionSelected] = createSignal<string>();
    
    // Add Session Settings
    const [showSessionSettings, setShowSessionSettings] = createSignal<boolean>(false);
    const [sessionModal, setSessionModal] = createSignal<Element>()
    
    // Tiles stuff
    const { getActiveEvents, selectActiveEvent } = useActiveEvents();
    const [tileList, setTileList] = createSignal<tiles[]>([
        'activeEvent',
    ]);
    const completeTileList = createMemo(()=>{
        return tileList().map((key)=>[
            GetTileElement(key, campaignSelected() ?? '', sessionSelected() ?? ''),
            getTileMetadata(key),
        ]);
    });
    const filteredTileList = createMemo<Array<[JSX.Element, TileData]>>(() => {
        // Filter logic goes here
        return completeTileList().filter(([element, data])=> true) as Array<[JSX.Element, TileData]>;
    });
    const Capitalize = (input: string) => input.slice(0,1).toUpperCase() + input.slice(1)
    
    const [cellSize, setCellSize] = createSignal(0);
    let gridRef: HTMLDivElement | undefined;
    const activeButtonBorderColor = createMemo(()=>{
        const actEvents = getActiveEvents();
        return actEvents.map((ev)=>{
            switch(ev.type) {
                case 'combat':
                    return 'rgb(149, 0, 0)';
                case 'exploration':
                    return 'rgb(0, 88, 221)';
                case 'social':
                    return 'rgb(136, 4, 185)';
                case 'scene':
                    return  'rgb(13, 140, 149)';
                case 'travel':
                    return 'rgb(4, 88, 22)';
                default:
                    return '#fff';
            }
        });
    })

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
        const modal = sessionModal();
        if (modal) {
            modal.classList.add(`${style.modal}`);
        }
    });

    return (
        <Body class={`${style.mainBody}`}>
            <div class={`${style.headerWrap}`}>
                <div class={`${style.header}`}>
                    <h1>DM Command</h1>
                    <span>
                        <Select
                        placeholder="Select Campaign..."
                        value={campaignSelected()} 
                        onChange={(v)=>setCampaignSelected(v)}>
                            <Option value="">None</Option>
                        </Select>
                    </span>
                    <span>
                        <Select
                        placeholder="Select Session..."
                        value={sessionSelected()} 
                        onChange={(v)=>setSessionSelected(v)}>
                            <Option value=''>None</Option>
                        </Select>
                    </span>
                    <Button transparent onClick={()=>{
                        setShowSessionSettings(true);
                    }}><span><Icon icon={Add} /> Session</span></Button>
                    <Modal 
                        title="Add Session" 
                        show={[showSessionSettings, setShowSessionSettings]}
                        width={isMobile() ? '' : '20vw'}
                        height={'30vh'}
                        ref={setSessionModal}>

                    </Modal>
                </div>
                <Show when={getActiveEvents().length > 0}>
                    <div class={`${style.activeBar}`}>
                        <For each={getActiveEvents()}>{(activeEvent, i)=>
                            <Button class={style.activeButtonOuter} style={{'border-color': activeButtonBorderColor()[i()]}} onClick={()=>selectActiveEvent(activeEvent.id)}>
                                <span class={style.activeButton}>
                                    <span>{Capitalize(activeEvent.type)}</span>
                                    <span>{activeEvent.name}</span>
                                </span>
                            </Button>
                        }</For>
                    </div>
                </Show>
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
