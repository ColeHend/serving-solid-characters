import { Character } from "../../../../models/character.model";
import { MadFeature } from "../madModels";

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

function useCurrencyFeature (character: Character) {
    if (!character) {
        console.error("No Character Found!");
        return;
    }

    character.features.forEach(feature => {
        let mads = feature.metadata?.mads;

        if (mads && mads.command === 'AddCurrency') {
            character = AddCurrencyFeature(character, mads);
        } else if (mads && mads.command === 'RemoveCurrency') {
            character = RemoveCurrencyFeature(character, mads);
        }

    });

    return character;
}

export default useCurrencyFeature;
export { AddCurrencyFeature, RemoveCurrencyFeature };