import { Spell } from "../../../models";
interface typeValues {
		full: number;
		half: number;
		third: number;
		[other: string]: number;
}
export function getSpellSlots(level: number, slotLevel: number, casterType: keyof typeValues, typeValues: typeValues = { full: 1, half: 0.5, third: 1 / 3 }) {
	if (level < 1 || slotLevel < 1 || slotLevel > 9) return 0;

	const casterFactor = !!typeValues[casterType] ? typeValues[casterType] : 1;
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
	if (slotLevel === 5) return 1 + (effectiveLevel >= 17 ? 2 : effectiveLevel >= (slotLevel * 2) ? 1 : 0)
	if (slotLevel <= 7) return 1 + (effectiveLevel > 9 ? 1 : effectiveLevel >= (slotLevel * 2) ? 1 : 0) + highlevelMod();
	return Math.min(2, 1 + Math.floor((effectiveLevel - slotLevel * 2 + 1) / 2));
}


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

export function Clone<T>(object: T) {
    return JSON.parse(JSON.stringify(object)) as T;
}
export function getNumberArray(num: number) {
    return Array.from({ length: num }, (_, i) => i + 1);
}
export const getSlotString = (slot: number) => slot === 0 ? "cantrips_known" : `spell_slots_level_${slot}`;

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