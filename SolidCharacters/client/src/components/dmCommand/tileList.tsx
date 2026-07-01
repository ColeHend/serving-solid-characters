import { JSX } from "solid-js";

interface TileData {
    columns: number;
    rows: number;
}

export type tiles = 'main';

export const tileSizes: Record<tiles, TileData> = {
    main: { columns: 3, rows: 3 },
};
export default function GetTileElement(tile: tiles): JSX.Element {
    switch (tile) {
        default:
            return <div>Unknown Tile</div>;
    }
}