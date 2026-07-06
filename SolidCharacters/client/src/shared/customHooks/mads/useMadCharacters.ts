import { Character } from "../../../models/character.model";
import {addACFeature, removeACFeature} from "./commands/useACFeature";
import { addAdvantageFeature, removeAdvantageFeature } from "./commands/useAdvantageFeature";
import { addAllProficiencyFeature ,removeAllProficiencyFeature } from "./commands/useAllProficiencyFeature";
import { addAttacksFeature, removeAttacksFeature } from "./commands/useAttacksFeature";
import { addClassFeature, removeClassFeature } from "./commands/useClassFeature";
import { AddCurrencyFeature, RemoveCurrencyFeature } from "./commands/useCurrencyFeature";
import { addExpertiseFeature, removeExpertiseFeature } from "./commands/useExpertiseFeature";
import { AddFeat, RemoveFeat } from "./commands/useFeat";
import { AddFeature ,RemoveFeature } from "./commands/useFeatures";
import { addImmunities, removeImmunities } from "./commands/useImmunitiesFeature";
import { AddItemFeature, RemoveItemFeature } from "./commands/useItemFeature";
import { addHitPointsFeature, removeHitPointsFeature } from "./commands/useHitPointsFeature";
import { addLanguageFeature, removeLanguageFeature } from "./commands/useLanguagesFeature";
import { addMovementFeature, removeMovementFeature } from "./commands/useMovementFeature";
import { addProficienciesFeature, RemoveProficienciesFeature } from "./commands/useProficienciesFeature";
import { addResistanceFeature, removeResistanceFeature } from "./commands/useResistanceFeature";
import { addSavingThrowFeature, removeSavingThrowFeature } from "./commands/useSavingThrowFeature";
import { addSensesFeature, removeSensesFeature } from "./commands/useSensesFeature";
import { addSpeedFeature, removeSpeedFeature } from "./commands/useSpeedFeature";
import { AddSpellFeature, RemoveSpellFeature } from "./commands/useSpellFeature";
import { addStatFeature, removeStatFeature } from "./commands/useStatFeature";
import { addUsesFeature, removeUsesFeature } from "./commands/useUsesFeature";
import { addVulnerabilityFeature, removeVulnerabilityFeature } from "./commands/useVulnerabilitiesFeature";
import { MadFeature, MadType } from "./madModels";

// this hook should return a character with its MAD attributes applied, so that the character sheet can be rendered with the MAD features included. It should also be memoized to prevent unnecessary recalculations when the character or MAD features haven't changed.
export function useMadCharacters(character: Character, madFeatures: MadFeature[]): Character {
   return madFeatures.reduce((updatedCharacter, feature) => addMadFeature(updatedCharacter, feature), character);
}

/**
 * Applies a MadFeature to a character, modifying the character's attributes based on the command and value specified in the feature.
 * @param character The character to which to apply the MadFeature.
 * @param feature The MadFeature containing the command and value that specifies how to modify the character.
 * @returns The updated character after applying the MadFeature.
 */
export function addMadFeature(character: Character, feature: MadFeature): Character {
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
        case "AddArmorClass":
            character = addACFeature(character, feature);
            break;
        case "RemoveArmorClass":
            character = removeACFeature(character, feature); 
            break;
        case "AddProficiencies":
            character = addProficienciesFeature(character, feature);
            break;
        case "RemoveProficiencies":
            character = RemoveProficienciesFeature(character, feature);
            break;
        case "AddExpertise":
            character = addExpertiseFeature(character, feature);
            break;
        case "RemoveExpertise":
            character = removeExpertiseFeature(character, feature);
            break;
        case "AddFeatures":
            character = AddFeature(character, feature);
            break;
        case "RemoveFeatures":             
            character = RemoveFeature(character, feature);
            break;
        case "AddLanguages":
            character = addLanguageFeature(character, feature);
            break;
        case "RemoveLanguages":
            character = removeLanguageFeature(character, feature);
            break;
        case "AddResistances":
            character = addResistanceFeature(character, feature);
            break;
        case "RemoveResistances":
            character = removeResistanceFeature(character, feature);
            break;
        case "AddVulnerabilities":
            character = addVulnerabilityFeature(character, feature);
            break;
        case "RemoveVulnerabilities":
            character = removeVulnerabilityFeature(character, feature);
            break;
        case "AddImmunities":
            character = addImmunities(character, feature);
            break;
        case "RemoveImmunities":
            character = removeImmunities(character, feature);
            break;
        case "AddSavingThrows":
            character = addSavingThrowFeature(character, feature);
            break;
        case "RemoveSavingThrows":
            character = removeSavingThrowFeature(character, feature);
            break;
        case "AddStats":
            character = addStatFeature(character, feature);
            break; 
        case "RemoveStats":
            character = removeStatFeature(character, feature);
            break; // ----- 
        case "AddSpeed":
            character = addSpeedFeature(character, feature);
            break;
        case "RemoveSpeed":
            character = removeSpeedFeature(character, feature);
            break;
        case "AddAllProficiencies":
            character = addAllProficiencyFeature(character, feature);
            break;
        case "RemoveAllProficiencies":
            character = removeAllProficiencyFeature(character, feature);
            break;
        case "AddFeats":
            character = AddFeat(character, feature);
            break;
        case "RemoveFeats":
            character = RemoveFeat(character, feature);
            break;
        case "AddClassFeature":
            character = addClassFeature(character, feature);
            break;
        case "RemoveClassFeature":
            character = removeClassFeature(character, feature);
            break;
        case "AddAdvantage":
            character = addAdvantageFeature(character, feature);
            break;
        case "RemoveAdvantage":
            character = removeAdvantageFeature(character, feature);
            break;
        case "AddAttacks":
            character = addAttacksFeature(character, feature);
            break;
        case "RemoveAttacks":
            character = removeAttacksFeature(character, feature);
            break;
        case "AddUses":
            character = addUsesFeature(character, feature);
            break;
        case "RemoveUses":
            character = removeUsesFeature(character, feature);
            break;
        case "AddMovement":
            character = addMovementFeature(character, feature);
            break;
        case "RemoveMovement":
            character = removeMovementFeature(character, feature);
            break;
        case "AddSenses":
            character = addSensesFeature(character, feature);
            break;
        case "RemoveSenses":
            character = removeSensesFeature(character, feature);
            break;
        case "AddHitPoints":
            character = addHitPointsFeature(character, feature);
            break;
        case "RemoveHitPoints":
            character = removeHitPointsFeature(character, feature);
            break;
        default:
            break;
    }
    return character;
}

/** True for a choice-form Stats command ("increase an ability of your choice") that needs a player pick. */
function isChoiceStatMad(m: MadFeature): boolean {
    return (m.command === "AddStats" || m.command === "RemoveStats") && m.value?.["stat"] === "choice";
}

/** The abilities a choice-form Stats command allows ("str,dex" → ["str","dex"]). */
export function statChoiceOptions(m: MadFeature): string[] {
    return (m.value?.["options"] ?? "").split(",").map(s => s.trim()).filter(Boolean);
}

/**
 * The character.statChoices key for a feature. Prefer the feature id — repeated features
 * (Ability Score Improvement at levels 4/8/12...) have distinct ids, so each instance gets
 * its own pick. Homebrew features often have id "" — fall back to the name.
 */
export function statChoiceKey(feature: { id?: string; name: string }): string {
    return feature.id || feature.name;
}

/**
 * A choice-form Stats command with the player's pick (character.statChoices, keyed by
 * statChoiceKey) substituted in — or null while the pick is missing/invalid, in which
 * case the command must NOT apply.
 */
function resolveChoiceStatMad(character: Character, choiceKey: string, m: MadFeature): MadFeature | null {
    const pick = character.statChoices?.[choiceKey] ?? "";
    if (!pick || !statChoiceOptions(m).includes(pick)) return null;
    return { ...m, value: { ...m.value, stat: pick } };
}

/** All choice-form stat commands on a feature (for the sheet's chooser UI). */
export function choiceStatMads(feature: { name: string; metadata?: { mads?: unknown } }): MadFeature[] {
    return ((feature.metadata?.mads ?? []) as MadFeature[]).filter(isChoiceStatMad);
}

/** Choice-form stat commands on a feature that still need a pick (for the sheet's chooser UI). */
export function pendingStatChoices(character: Character, feature: { id?: string; name: string; metadata?: { mads?: unknown } }): MadFeature[] {
    return choiceStatMads(feature).filter(m => !resolveChoiceStatMad(character, statChoiceKey(feature), m));
}

/**
 * Every Character-type mad across all of a character's feature sources
 * (class levels, race, and top-level features), ready to feed useMadCharacters.
 * Info-type mads (like Uses) describe their owning feature and are excluded.
 * Choice-form Stats commands are resolved against character.statChoices (keyed by
 * feature name); unresolved ones are excluded until the player picks.
 */
export function collectMadFeatures(character: Character): MadFeature[] {
    const feats = [
        ...(character.levels ?? []).flatMap(l => l.features ?? []),
        ...(character.race?.features ?? []),
        ...(character.features ?? []),
    ];

    return feats.flatMap(f =>
        ((f.metadata?.mads ?? []) as MadFeature[]).flatMap(m => {
            if (m.type !== MadType.Character) return [];
            if (isChoiceStatMad(m)) {
                const resolved = resolveChoiceStatMad(character, statChoiceKey(f), m);
                return resolved ? [resolved] : [];
            }
            return [m];
        }),
    );
}



