import { Modifier } from "../../shared/customHooks/character/buildCharacter";

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
  properties: ItemProperties;
};

export enum ItemType {
  Weapon,
  Armor,
  Tool,
  Item,
}

export interface ItemProperties {
  // --- SRD JSON STUFF ---
  // --- Armor
  AC?: string;
  Stealth?: string;
  StrengthReq?: string;
  // 2014 armor
  ArmorCategory?: string;
  // 2014 barding
  armorType?: string;
  //---- Weapon
  Damage?: string;
  Properties?: string[];
  // 2024 weapon
  Mastery?: string;
  // 2014 weapon
  Category?: string;
  WeaponRange?: string; // text
  RangeNormal?: string; // number
  RangeLong?: string;   // number
  // ---- Item Packs
  Includes?: string;
  // ---- Storage
  Capacity?: string;
  // --- Other Stuff
  // 2024
  Light?: string;
  Fuel?: string;
  Special?: string;
  Uses?: string;
  Strength?: string;
  // 2014 only
  category?: string;
  
  // --- Homebrew ---
  modifiers?: Modifier[];
}
