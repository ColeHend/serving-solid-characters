import { Component, JSX, For } from "solid-js";
import { Body } from "coles-solid-library";
import { isMobile } from "coles-solid-library/dist/tools/tools.js";
import GetTileElement, { tiles, tileSizes } from "./tileList";
import styles from "./dmCommand.module.css";

const DmCommand: Component = () => {
    const maxColumns = isMobile() ? 3 : 6;
    

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
                    <For each={Object.keys(tileSizes) as tiles[]}>{(key)=>{
                        const size = tileSizes[key];
                        return (
                            <div style={{
                                "grid-column": `span ${size.width}`,
                                "grid-row": `span ${size.height}`,
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