export interface Item {
    name: string;
    equipmentCategory: string;
    cost: {
        quantity: number;
        unit: string;
    };
    weight?: number;
    tags: string[];
    desc: string[];
    item: string;
}

export interface Weapon extends Item {
    weaponCategory: string;
    weaponRange: string;
		categoryRange: string;
    damage: {
        damageDice: string;
        damageType: string;
        damageBonus: number;
    }[];
    range: {
        normal: number;
        long?: number;
    };
}

export interface Armor extends Item {
    armorCategory: string;
    armorClass: {
        base: number;
        dexBonus: boolean;
        maxBonus: number;
    };
    strMin: number;
    stealthDisadvantage: boolean;
}