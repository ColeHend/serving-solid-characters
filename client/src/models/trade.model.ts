import { Background } from "./background.model";
import { Character } from "./character.model";
import { DnDClass } from "./class.model";
import { Feat } from "./feat.model";
import { Item } from "./items.model";
import { Race } from "./race.model";
import { Spell } from "./spell.model";

export interface Trade {
    spells: Spell[],
    feats: Feat[],
    srdclasses: DnDClass[],
    backgrounds: Background[],
    items: Item[],
    races: Race[],
    characters: Character[],
}