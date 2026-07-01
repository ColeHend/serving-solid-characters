import { JSX } from "solid-js";

interface TileData {
    width: number;
    height: number;
    info?: TileInfo;
}
interface TileInfo {
    type: 'tool' | 'campaign';
    metadata: TileMetadata;
}
type locationKey = 'campaign' | 'area' | 'location';
type toolType = 'monster' | 'item' | 'spell' | 'note';
type TagKey = locationKey | toolType;
interface TileMetadata {
    autoTags?: Record<TagKey, string>;
    tags?: string[];
}

export type tiles = 'main';

/// keep it to a max width of 3 for mobile;
const tileSizes: Record<tiles, TileData> = {
    main: { width: 3, height: 3 },
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

export function getTileMetadata(tile: tiles): TileData {
    const data = tileSizes?.[tile];
    if (!data) {
        return { width: 1, height: 1 };
    }
    return data;
}