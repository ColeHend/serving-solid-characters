import { Character } from "./character.model";
import { Background, Spell, Feat, Class5E, Item, Race } from "./generated";


export interface Trade {
    spells: Spell[],
    feats: Feat[],
    srdclasses: Class5E[],
    backgrounds: Background[],
    items: Item[],
    races: Race[],
    characters: Character[],
}