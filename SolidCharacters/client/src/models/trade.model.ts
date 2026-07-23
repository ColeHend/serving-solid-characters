import { Character } from "./character.model";
import { Background, Spell, Feat, Class5E, Item, Race, Subclass, Subrace } from "./generated";


export interface Trade {
    spells: Spell[],
    feats: Feat[],
    srdclasses: Class5E[],
    srdSubclasses: Subclass[],
    backgrounds: Background[],
    items: Item[],
    races: Race[],
    subraces: Subrace[],
    characters: Character[],
}