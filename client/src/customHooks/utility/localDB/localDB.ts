import Dexie from 'dexie';
import { Spell } from "../../../models/spell.model";
import { DnDClass } from "../../../models/class.model";
import { Race } from "../../../models/race.model";
import { Background } from "../../../models/background.model";
import { Item } from "../../../models/items.model";
import { Feat } from "../../../models/feat.model";

class LocalDB extends Dexie {
    spells!: Dexie.Table<Spell, 'name'>;
    classes!: Dexie.Table<DnDClass, 'name'>;
    races!: Dexie.Table<Race, 'name'>;
    backgrounds!: Dexie.Table<Background, 'name'>;
    items!: Dexie.Table<Item, 'name'>;
    feats!: Dexie.Table<Feat, 'name'>;

    constructor(name: string) {
        super(name);
        this.version(1).stores({
            spells: 'name',
            classes: 'name',
            races: 'name',
            backgrounds: 'name',
            items: 'name',
            feats: 'name'
        })
    }
    
}
    
export default LocalDB;