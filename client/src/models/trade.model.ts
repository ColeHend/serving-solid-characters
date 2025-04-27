import { Background } from "./old/background.model";
import { Character } from "./character.model";
import { DnDClass } from "./old/class.model";
import { Feat } from "./old/feat.model";
import { Item } from "./old/items.model";
import { Race } from "./old/race.model";
import { Spell } from "./old/spell.model";

export interface Trade {
    spells: Spell[],
    feats: Feat[],
    srdclasses: DnDClass[],
    backgrounds: Background[],
    items: Item[],
    races: Race[],
    characters: Character[],
}