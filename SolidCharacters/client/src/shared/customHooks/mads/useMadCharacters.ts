import { Character } from "../../../models/character.model";
import { MadFeature } from "./madModels";

// this hook should return a character with its MAD attributes applied, so that the character sheet can be rendered with the MAD features included. It should also be memoized to prevent unnecessary recalculations when the character or MAD features haven't changed.
export function useMadCharacters(character: Character, madFeatures: MadFeature[]): Character {
   return madFeatures.reduce((updatedCharacter, feature) => addMadFeature(updatedCharacter, feature), character);
}

/** * Applies a MadFeature to a character, modifying the character's attributes based on the command and value specified in the feature.
 * @param character The character to which to apply the MadFeatu);
            break;
        case 'RemoveCurrency':re.
 * @param feature The MadFeature containing the command and value that specifies how to modify the character.
 * @returns The updated character after applying the MadFeature.
 */
function addMadFeature(character: Character, feature: MadFeature): Character {
    switch (feature.command) {
        case 'AddSpells':
            character = AddSpellFeature(character, feature);
            break;
        case 'RemoveSpells':
            character = RemoveSpellFeature(character, feature);
            break;
        case 'AddItems':
            character = AddItemFeature(character, feature);
            break;
        case 'RemoveItems':
            character = RemoveItemFeature(character, feature);
            break;
        case 'AddCurrency':
            character = AddCurrencyFeature(character, feature);
            break;
        case 'RemoveCurrency':
            character = RemoveCurrencyFeature(character, feature);
            break;
        default:
            break;
    }
    return character;
}

const AddSpellFeature = (character: Character, feature: MadFeature): Character => {
    const spellName = feature.value?.['name'] ?? '';
    if (spellName) {
        character.spells = [...character.spells, {
            name: spellName,
            prepared: false,
        }];
    }
    return character;
}

const RemoveSpellFeature = (character: Character, feature: MadFeature): Character => {
    const spellName = feature.value?.['name'] ?? '';
    if (spellName) character.spells = character.spells.filter(s => s.name !== spellName);
    return character;
}

const AddItemFeature = (character: Character, feature: MadFeature): Character => {
    const itemName = feature.value?.['name'] ?? '';
    if (itemName) character.items.inventory.push(itemName);
    return character;
};

const RemoveItemFeature = (character: Character, feature: MadFeature): Character => {
    const itemName = feature.value?.['name'] ?? '';
    if (itemName) character.items.inventory = character.items.inventory.filter(i => i !== itemName);
    return character;
}

const AddCurrencyFeature = (character: Character, feature: MadFeature): Character => {
    const currencyType = feature.value?.['type'] ?? '';
    const amount = parseInt(feature.value?.['amount'] ?? '0', 10);
    character.items.currency.copperPieces = character.items.currency.copperPieces || 0;
    character.items.currency.sliverPieces = character.items.currency.sliverPieces || 0;
    character.items.currency.electrumPieces = character.items.currency.electrumPieces || 0;
    character.items.currency.goldPieces = character.items.currency.goldPieces || 0;
    character.items.currency.platinumPieces = character.items.currency.platinumPieces || 0;
    if (Object.keys(character.items.currency).includes(currencyType) && amount) {
        character.items.currency[currencyType as keyof Character['items']['currency']] += amount;
    }
    return character;
};
const RemoveCurrencyFeature = (character: Character, feature: MadFeature): Character => {
    const currencyType = feature.value?.['type'] ?? '';
    const amount = parseInt(feature.value?.['amount'] ?? '0', 10);
    character.items.currency.copperPieces = character.items.currency.copperPieces || 0;
    character.items.currency.sliverPieces = character.items.currency.sliverPieces || 0;
    character.items.currency.electrumPieces = character.items.currency.electrumPieces || 0;
    character.items.currency.goldPieces = character.items.currency.goldPieces || 0;
    character.items.currency.platinumPieces = character.items.currency.platinumPieces || 0;
    if (Object.keys(character.items.currency).includes(currencyType) && amount) {
        character.items.currency[currencyType as keyof Character['items']['currency']] -= amount;
    }
    return character;
}