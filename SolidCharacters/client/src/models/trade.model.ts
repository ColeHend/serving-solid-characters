import { Background } from "./data";
import { Character } from "./character.model";
import { Spell } from "./data";
import { Feat } from "./data";
import { Class5E } from "./data";
import { Item } from "./data";
import { Race } from "./data";


export interface Trade {
    spells: Spell[],
    feats: Feat[],
    srdclasses: Class5E[],
    backgrounds: Background[],
    items: Item[],
    races: Race[],
    characters: Character[],
}