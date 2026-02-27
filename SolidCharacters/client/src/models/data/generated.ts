import { Item, Subclass } from "../generated";

export interface srdSubclass extends Subclass { 
    /**
    * Internal persistence key combining parent class + name (lowercased) to guarantee uniqueness.
    * Added in DB schema v2. Not part of exported payloads.
    */
    storage_key?: string;
}

export interface srdItem extends Item {
    properties: Record<string, string>;
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
