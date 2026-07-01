import { Component, JSX, For, createMemo, createSignal } from "solid-js";
import { Body } from "coles-solid-library";
import { isMobile } from "coles-solid-library/dist/tools/tools.js";
import GetTileElement, { tiles, getTileSize } from "./tileList";
import styles from "./dmCommand.module.css";

const DmCommand: Component = () => {
    const maxColumns = isMobile() ? 3 : 6;
    const [tileList, setTileList] = createSignal<tiles[]>(['main']);
    
    return (
        <Body>
            <div>
                <h1>DM Command</h1>
            </div>
            <div>
                <div style={{
                    display: "grid",
                    "grid-template-columns": `repeat(${maxColumns}, 1fr)`,
                    gap: "10px",
                }}>
                    <For each={tileList()}>{(key)=>{
                        const size = getTileSize(key);
                        return (
                            <div style={{
                                "grid-column": `span ${size.columns}`,
                                "grid-row": `span ${size.rows}`,
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