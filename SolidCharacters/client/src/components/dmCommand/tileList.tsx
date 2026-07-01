import { JSX } from "solid-js";

/**
 * The Width is columns and the height is rows. So a tile that is 2x3 would be 2 columns wide and 3 rows tall.
 */
interface TileSize {
    width: number;
    height: number;
}

export type tiles = 'combatTracker';

export const tileSizes: Record<tiles, TileSize> = {
    combatTracker: { width: 2, height: 3 },
};
export default function GetTileElement(tile: tiles): JSX.Element {
    switch (tile) {
        default:
            return <div>Unknown Tile</div>;
    }
}