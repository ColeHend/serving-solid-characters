import { JSX } from "solid-js";

interface TileData {
    columns: number;
    rows: number;
}

export type tiles = 'main';

const tileSizes: Record<tiles, TileData> = {
    main: { columns: 3, rows: 3 },
};

export default function GetTileElement(tile: tiles): JSX.Element {
    switch (tile) {
        default:
            return <div style={{
                width: '100%',
                height: '100%',
                'text-align': 'center',
            }}>Unknown Tile</div>;
    }
}

export function getTileSize(tile: tiles): TileData {
    const data = tileSizes?.[tile];
    if (!data) {
        return { columns: 1, rows: 1 };
    }
    return data;
}