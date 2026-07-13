import { JSX, Match, Switch } from "solid-js";
import styles from './tileList.module.scss';
import { ActiveEvent } from "./tiles/activeEvent/activeEvent";

export interface TileData {
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

export type tiles = 'activeEvent' | string;

/// keep it to a max width of 3 for mobile;
const tileSizes: Record<tiles, TileData> = {
    'activeEvent': {
        width: 3,
        height: 2,
        info: {
            type: 'campaign',
            metadata: {}
        }
    }
};

export default function GetTileElement(tile: tiles, campaign: string, session: string): JSX.Element {

    return <div class={`${styles.mainBody}`}>
                <Switch 
                    fallback={
                        <div class={`${styles.mainBody}`}>
                            Unknown Tile
                        </div>
                    }>
                    <Match when={tile === 'activeEvent'}>
                        <ActiveEvent campaign={campaign} session={session}/>
                    </Match>
                </Switch>
            </div>
}

export function getTileMetadata(tile: tiles): TileData {
    const data = tileSizes?.[tile];
    if (!data) {
        return { width: 1, height: 1 };
    }
    return data;
}