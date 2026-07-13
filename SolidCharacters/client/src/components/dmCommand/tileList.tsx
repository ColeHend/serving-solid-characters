import { JSX, Match, Switch } from "solid-js";
import styles from './tileList.module.scss';
import { ActiveEvent } from "./tiles/activeEvent/activeEvent";
import { PartyTile } from "./tiles/party/party";
import { BestiaryTile } from "./tiles/bestiary/bestiary";
import { LootXpTile } from "./tiles/lootXp/lootXp";
import { SessionNotesTile } from "./tiles/notes/notes";

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

export type tiles = 'activeEvent' | 'party' | 'bestiary' | 'lootXp' | 'notes' | string;

/// keep it to a max width of 3 for mobile;
const tileSizes: Record<tiles, TileData> = {
    'activeEvent': {
        width: 4,
        height: 3,
        info: {
            type: 'campaign',
            metadata: {}
        }
    },
    'party': {
        width: 2,
        height: 3,
        info: {
            type: 'campaign',
            metadata: {}
        }
    },
    'lootXp': {
        width: 2,
        height: 2,
        info: {
            type: 'campaign',
            metadata: {}
        }
    },
    'bestiary': {
        width: 2,
        height: 2,
        info: {
            type: 'tool',
            metadata: {}
        }
    },
    'notes': {
        width: 2,
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
                        <div class={`${styles.unknownTile}`}>
                            <span>Empty slot</span>
                            <span class={`${styles.unknownHint}`}>This tile hasn't been forged yet.</span>
                        </div>
                    }>
                    <Match when={tile === 'activeEvent'}>
                        <ActiveEvent campaign={campaign} session={session}/>
                    </Match>
                    <Match when={tile === 'party'}>
                        <PartyTile />
                    </Match>
                    <Match when={tile === 'bestiary'}>
                        <BestiaryTile />
                    </Match>
                    <Match when={tile === 'lootXp'}>
                        <LootXpTile />
                    </Match>
                    <Match when={tile === 'notes'}>
                        <SessionNotesTile />
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
