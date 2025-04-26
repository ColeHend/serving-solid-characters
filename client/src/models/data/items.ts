export interface StartingEquipment {
  optionKeys?: string[];
  items?: string[];
}

export interface MagicItem {
  id: number;
  name: string;
  desc: string;
  rarity: string;
  cost: string;
  category: string;
  weight: string;
  properties: MagicItemProperties;
}

interface MagicItemProperties {
  Attunement?: string;
  Effect?: string;
  Charges?: string;
}

export interface Item {
  id: number;
  name: string;
  desc: string;
  type: ItemType;
  weight: number;
  cost: string;
  properties: Record<string, string>;
};

export enum ItemType {
  Weapon,
  Armor,
  Tool,
  Item,
}

export interface ItemProperties {
  // Armor
  AC?: string;
  Stealth?: string;
  StrengthReq?: string;
  // Weapon
  Damage?: string;
  Properties?: string[];
  Mastery?: string;
  // Item Packs
  Includes?: string;
  // Other Stuff
  [key: string]: string | string[] | undefined;
}
