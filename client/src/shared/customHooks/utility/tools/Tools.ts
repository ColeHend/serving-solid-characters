import { Spell } from "../../../../models";
import { FeatureTypes } from "../../../../models/old/core.model";

/**
 * Retrieves the feature type, falling back to a default if the provided type is nullish.
 *
 * @param type - The feature type to check. Can be undefined or nullish.
 * @param normal - The default feature type to return if `type` is nullish. Defaults to `FeatureTypes.Feat`.
 * @returns The provided `type` if it is not nullish, otherwise returns `normal` or `FeatureTypes.Feat`.
 */
export function GetFeatureType(type?:FeatureTypes, normal?: FeatureTypes ): FeatureTypes {
  if (isNullish(type)) return normal ?? FeatureTypes.Feat;
  return type!;
}

/**
 * Checks if a given value is null or undefined.
 *
 * @template T - The type of the value to check.
 * @param {T} value - The value to check for nullishness.
 * @returns {boolean} - Returns `true` if the value is null or undefined, otherwise `false`.
 */
export const isNullish = <T,>(value: T) => value === null || value === undefined;
/**
 * A class that represents a unique set of items.
 * Items are stored in a Map with their JSON stringified representation as the key.
 * 
 * @template T - The type of items to be stored in the set.
 */
export class UniqueSet<T> {
  /**
   * The internal Map that stores the items.
   * The key is the JSON stringified representation of the item.
   */
  private set: Map<string, T>;

  /**
   * Creates an instance of UniqueSet.
   */
  constructor() {
    this.set = new Map();
  }

  /**
   * Adds an item to the set.
   * If the item already exists, it will be replaced.
   * 
   * @param item - The item to add to the set.
   */
  public add(item: T) {
    this.set.set(JSON.stringify(item), item);
  }

  /**
   * Deletes an item from the set.
   * 
   * @param item - The item to delete from the set.
   */
  public delete(item: T) {
    this.set.delete(JSON.stringify(item));
  }

  /**
   * Gets the array of items in the set.
   * 
   * @returns An array of items in the set.
   */
  public get value() {
    return Array.from(this.set.values()) as T[];
  }

  /**
   * Sets the array of items in the set.
   * Clears the current set and adds the new items.
   * 
   * @param value - An array of items to set.
   */
  public set value(value: T[]) {
    if (!value?.length) return;
    this.clear();
    value.forEach((item) => this.add(item));
  }

  /**
   * Clears all items from the set.
   */
  public clear() {
    this.set.clear();
  }
}

/**
 * Removes duplicate strings from an array and returns an array of unique strings.
 *
 * @param strings - An array of strings that may contain duplicates.
 * @returns An array of unique strings.
 */
export const UniqueStringArray = (strings: string[]) => {
  return [...new Set(strings)]
}

/**
 * Sorts an array of objects by a specified key.
 *
 * @template T - The type of the objects in the array.
 * @param {T[]} arr - The array to be sorted.
 * @param {keyof T} key - The key of the object to sort by.
 * @param {boolean} isAsc - Determines if the sorting should be in ascending order. If true, sorts in ascending order; otherwise, sorts in descending order.
 * @returns {T[]} The sorted array.
 *
 * @example
 * const items = [
 *   { cost: { quantity: 10 }, damage: [{ damageDice: 5 }], range: { normal: 30 }, armorClass: { base: 15 } },
 *   { cost: { quantity: 5 }, damage: [{ damageDice: 10 }], range: { normal: 20 }, armorClass: { base: 10 } }
 * ];
 * const sortedItems = SortArrayByKey(items, 'cost', true);
 * console.log(sortedItems);
 */
export const SortArrayByKey = <T,>(arr: T[], key: keyof T, isAsc: boolean) => {
  return arr.sort((a, b) => {
    switch (key) {
    case 'cost':
    { 
      const c:any = a[key];
      const d:any = b[key];
      if (c['quantity'] > d['quantity']) return isAsc ? 1 : -1;
      if (c['quantity'] < d['quantity']) return isAsc ? -1 : 1;
      break; 
    }
    case 'damage':
    { const e:any = a[key];
      const f:any = b[key];
      if (e[0]['damageDice'] > f[0]['damageDice']) return isAsc ? 1 : -1;
      if (e[0]['damageDice'] < f[0]['damageDice']) return isAsc ? -1 : 1;
      break; 
    }
    case 'range':
    { 
      const g:any = a[key];
      const h:any = b[key];
      if (g['normal'] > h['normal']) return isAsc ? 1 : -1;
      if (g['normal'] < h['normal']) return isAsc ? -1 : 1;
      break; 
    }
    case 'armorClass':
    { 
      const c1:any = a[key];
      const d2:any = b[key];
      if (c1['base'] > d2['base']) return isAsc ? 1 : -1;
      if (c1['base'] < d2['base']) return isAsc ? -1 : 1;
      break; 
    }
    default:
      if (a[key] > b[key]) return isAsc ? 1 : -1;
      if (a[key] < b[key]) return isAsc ? -1 : 1;
      break;
    }
    return 0;
  });
};

interface typeValues {
		full: number;
		half: number;
		third: number;
		[other: string]: number;
}
/**
 * Calculates the number of spell slots available for a given character level, slot level, and caster type.
 *
 * @param {number} level - The character's level.
 * @param {number} slotLevel - The level of the spell slot (1-9).
 * @param {keyof typeValues} casterType - The type of caster (e.g., 'full', 'half', 'third').
 * @param {typeValues} [typeValues={ full: 1, half: 0.5, third: 1 / 3 }] - An object defining the caster type multipliers.
 * @returns {number | string} The number of spell slots available, or '-' if the slot level is too high for the effective level.
 */
export function getSpellSlots(level: number, slotLevel: number, casterType: keyof typeValues, typeValues: typeValues = { full: 1, half: 0.5, third: 1 / 3 }) {
  if (level < 1 || slotLevel < 1 || slotLevel > 9) return 0;

  const casterFactor = typeValues[casterType] ? typeValues[casterType] : 1;
  const effectiveLevel = Math.ceil(level * casterFactor);

  if (effectiveLevel < slotLevel * 2 - 1) return '-';
  const highlevelMod = ()=>{
    if (slotLevel === 5 && effectiveLevel >= 18) return 1;
    if (slotLevel === 6 && effectiveLevel >= 19) return 1;
    if (slotLevel === 7 && effectiveLevel >= 20) return 1;
    return 0;
  }
  if (slotLevel === 1) return 2 + (effectiveLevel > 2 ? 2 : Math.floor(effectiveLevel / 2));
  if (slotLevel <= 3) return 2 + (effectiveLevel > 9 ? 1 : effectiveLevel >= (slotLevel * 2) ? 1 : 0);
  if (slotLevel === 4) return 1 + (effectiveLevel >= 9 ? 2 : effectiveLevel === 8 ? 1 : 0);
  if (slotLevel === 5) return 1 + (effectiveLevel > 17 ? 2 : effectiveLevel >= (slotLevel * 2) ? 1 : 0)
  if (slotLevel <= 7) return (effectiveLevel > 9 ? 1 : effectiveLevel >= (slotLevel * 2) ? 1 : 0) + highlevelMod();
  return Math.min(1, 1 + Math.abs(Math.floor((effectiveLevel - slotLevel * 2) / 2)));
}


/**
 * Calculates the spellcasting dictionary based on the given level and caster type.
 * @param level - The level of the character.
 * @param casterType - The type of caster ("half" or other).
 * @param cantrips - Optional. Indicates whether cantrips are included. Defaults to false.
 * @returns The spellcasting dictionary object.
 */
export function getSpellcastingDictionary(level:number, casterType: string, cantrips = false) {
  const getSlotString = (slot: number) => slot === 0 ? "cantrips_known" : `spell_slots_level_${slot}`;
  const spellcastingObject: {[key:string]:number} = {};
  if (casterType === "half") {
    if (cantrips) {
      if (level < 10) {
        spellcastingObject[getSlotString(0)] = 2;
      } else if (level < 14) {
        spellcastingObject[getSlotString(0)] = 3;
      } else {
        spellcastingObject[getSlotString(0)] = 4;
      }
    }
    switch (level) {
    case 2:
      spellcastingObject[getSlotString(1)] = 2;
      break;
    case 3:
    case 4:
      spellcastingObject[getSlotString(1)] = 3;
      break;
    case 5:
    case 6:
      spellcastingObject[getSlotString(1)] = 4;
      spellcastingObject[getSlotString(2)] = 2;
      break;
    case 7:
    case 8:
      spellcastingObject[getSlotString(1)] = 4;
      spellcastingObject[getSlotString(2)] = 3;
      break;
    case 9:
    case 10:
      spellcastingObject[getSlotString(1)] = 4;
      spellcastingObject[getSlotString(2)] = 3;
      spellcastingObject[getSlotString(3)] = 2;
      break;
    case 11:
    case 12:
      spellcastingObject[getSlotString(1)] = 4;
      spellcastingObject[getSlotString(2)] = 3;
      spellcastingObject[getSlotString(3)] = 3;
      break;
    case 13:
    case 14:
      spellcastingObject[getSlotString(1)] = 4;
      spellcastingObject[getSlotString(2)] = 3;
      spellcastingObject[getSlotString(3)] = 3;
      spellcastingObject[getSlotString(4)] = 1;
      break;
    case 15:
    case 16:
      spellcastingObject[getSlotString(1)] = 4;
      spellcastingObject[getSlotString(2)] = 3;
      spellcastingObject[getSlotString(3)] = 3;
      spellcastingObject[getSlotString(4)] = 2;
      break;
    case 17:
    case 18:
      spellcastingObject[getSlotString(1)] = 4;
      spellcastingObject[getSlotString(2)] = 3;
      spellcastingObject[getSlotString(3)] = 3;
      spellcastingObject[getSlotString(4)] = 3;
      break;
    case 19:
    case 20:
      spellcastingObject[getSlotString(1)] = 4;
      spellcastingObject[getSlotString(2)] = 3;
      spellcastingObject[getSlotString(3)] = 3;
      spellcastingObject[getSlotString(4)] = 3;
      spellcastingObject[getSlotString(5)] = 1;
      break;
    }
  } else {
    if (cantrips) {
      if (level < 10) {
        spellcastingObject[getSlotString(0)] = 2;
      } else {
        spellcastingObject[getSlotString(0)] = 3;
      }
    }
    switch (level) {
    case 3:
      spellcastingObject[getSlotString(1)] = 2;
      break;
    case 4:
    case 5:
    case 6:

      spellcastingObject[getSlotString(1)] = 3;
      break;
    case 7:
    case 8:
    case 9:
      spellcastingObject[getSlotString(1)] = 4;
      spellcastingObject[getSlotString(2)] = 2;
      break;
    case 10:
    case 11:
    case 12:
      spellcastingObject[getSlotString(1)] = 4;
      spellcastingObject[getSlotString(2)] = 3;
      break;
    case 13:
    case 14:
    case 15:
      spellcastingObject[getSlotString(1)] = 4;
      spellcastingObject[getSlotString(2)] = 3;
      spellcastingObject[getSlotString(3)] = 2;
      break;
    case 16:
    case 17:
    case 18:
      spellcastingObject[getSlotString(1)] = 4;
      spellcastingObject[getSlotString(2)] = 3;
      spellcastingObject[getSlotString(3)] = 3;
      break;
    case 19:
    case 20:
      spellcastingObject[getSlotString(1)] = 4;
      spellcastingObject[getSlotString(2)] = 3;
      spellcastingObject[getSlotString(3)] = 3;
      spellcastingObject[getSlotString(4)] = 1;
      break;
    }

  }
  return spellcastingObject;
}

/**
 * Returns a string representation of the given number with the appropriate accent.
 * @param num - The number to add accent to.
 * @returns The string representation of the number with accent.
 */
export const getAddNumberAccent = (num: number)=>{
  switch (num) {
  case 0:
    return 'Cantrip';
  case 1:
    return `${num}st`
  case 2:
    return `${num}nd`
  case 3:
    return `${num}rd`
  default:
    return `${num}th`
  }
}

/**
 * Clones an object.
 * 
 * @param object - The object to clone.
 * @returns A deep copy of the object.
 * @template T - The type of the object.
 */
export function Clone<T>(object: T) {
  return JSON.parse(JSON.stringify(object)) as T;
}

/**
 * Returns an array of numbers from 1 to the specified number.
 * 
 * @param num - The specified number.
 * @returns An array of numbers from 1 to the specified number.
 */
export function getNumberArray(num: number) {
  return Array.from({ length: num }, (_, i) => i + 1);
}

/**
 * Returns the slot string based on the given slot number.
 * If the slot number is 0, it returns "cantrips_known".
 * Otherwise, it returns "spell_slots_level_" followed by the slot number.
 * 
 * @param slot - The slot number.
 * @returns The slot string.
 */
export const getSlotString = (slot: number) => slot === 0 ? "cantrips_known" : `spell_slots_level_${slot}`;

/**
 * Converts a spell level string to its corresponding display value.
 * @param spellLevel - The spell level string to convert.
 * @returns The display value of the spell level.
 */
export const spellLevel = (spellLevel: string) => { 
  switch(spellLevel){
  case "0":
    return "Cantrip";
  case "1":
    return "1st";
  case "2":
    return "2nd";
  case "3":
    return "3rd";
  default:
    return `${spellLevel}th`;
  }
}


/**
 * Calculates the spell components for a given spell.
 * @param spell - The spell object.
 * @returns The spell components as a string.
 */
export const spellComponents = (spell:Spell) => {
  const components = []
  if(spell.isVerbal) components.push("V");
  if(spell.isSomatic) components.push("S");
  if(spell.isMaterial) components.push("M");
  if (spell.materials_Needed) {
    return [...components, spell.materials_Needed ?? null].join(', ')
  }
  return components.join(', ')
}

/**
*  it takes in an unknown value, clones. making the value an object.
* 
*  then checks if its just a string or an array
* 
* @param {T} value the unknown value
* @returns the cloned value as a nice string
*/
export const classFeatureNullCheck = <T,>(value: T) => {
  const val = JSON.parse(JSON.stringify(value))
  if (typeof val === 'string') return val
  if (Array.isArray(val)) return val.join("\n \n")
  return "-unknown-";
}