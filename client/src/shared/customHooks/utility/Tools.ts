import { Spell } from "../../../models";

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
    if (!!spell.materials_Needed) {
        return [components.join(', '), spell.materials_Needed ?? null].join(', ')
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