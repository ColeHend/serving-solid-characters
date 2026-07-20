import { Character, GrantedAction, itemRefId, itemRefName } from "../../../models/character.model";
import { MagicItem } from "../../../models/generated";
import { entitySelectorKey } from "../utility/tools/entityKey";
import { hasDerivedSpellPool, hasSpellFilterValue } from "./spellChoiceFilters";
import {addACFeature, removeACFeature} from "./commands/useACFeature";
import { addActionsFeature, removeActionsFeature } from "./commands/useActionsFeature";
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
import { addRollBonusFeature, removeRollBonusFeature } from "./commands/useRollBonusFeature";
import { addSavingThrowFeature, removeSavingThrowFeature } from "./commands/useSavingThrowFeature";
import { addSensesFeature, removeSensesFeature } from "./commands/useSensesFeature";
import { addSpeedFeature, removeSpeedFeature } from "./commands/useSpeedFeature";
import { AddSpellFeature, RemoveSpellFeature } from "./commands/useSpellFeature";
import { addStatFeature, removeStatFeature } from "./commands/useStatFeature";
import { addUsesFeature, removeUsesFeature } from "./commands/useUsesFeature";
import { addVulnerabilityFeature, removeVulnerabilityFeature } from "./commands/useVulnerabilitiesFeature";
import { MadFeature, MadType } from "./madModels";

// this hook should return a character with its MAD attributes applied, so that the character sheet can be rendered with the MAD features included. It should also be memoized to prevent unnecessary recalculations when the character or MAD features haven't changed.
export function useMadCharacters(character: Character, madFeatures: MadFeature[]): Character;
export function useMadCharacters(character: Character, madFeatures: MadFeature[], opts: { returnActions: true }): GrantedAction[];
export function useMadCharacters(
    character: Character,
    madFeatures: MadFeature[],
    opts?: { returnActions?: boolean },
): Character | GrantedAction[] {
    const applied = madFeatures.reduce((updatedCharacter, feature) => addMadFeature(updatedCharacter, feature), character);
    return opts?.returnActions ? (applied.grantedActions ?? []) : applied;
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
        case "AddRollBonus":
            character = addRollBonusFeature(character, feature);
            break;
        case "RemoveRollBonus":
            character = removeRollBonusFeature(character, feature);
            break;
        case "AddActions":
            character = addActionsFeature(character, feature);
            break;
        case "RemoveActions":
            character = removeActionsFeature(character, feature);
            break;
        case "AddArmorProficiencies":
        case "RemoveArmorProficiencies":
        case "AddWeaponProficiencies":
        case "RemoveWeaponProficiencies":
        case "AddToolProficiencies":
        case "RemoveToolProficiencies":
            // Equipment proficiencies have no character field — they resolve at PDF-export
            // time (useExportProficiencies + equipmentProficiencies.ts), so the sheet
            // application is a deliberate no-op.
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

/** How many abilities the player picks (defaults to 1). */
export function statChoiceCount(m: MadFeature): number {
    const n = Number(m.value?.["count"] ?? "1");
    return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1;
}

/** The picked abilities in a statChoices CSV, padded/truncated to `count` slots ("" = unpicked). */
export function statChoicePicks(csv: string | undefined, count: number): string[] {
    const picks = (csv ?? "").split(",").map(s => s.trim());
    while (picks.length < count) picks.push("");
    return picks.slice(0, count);
}

/**
 * A statChoices CSV with `ability` written into slot `index` — the shared write path for the
 * per-slot dropdown UIs. Repeats are allowed: picking the same ability in two slots stacks
 * (an ASI can be +2 to one score instead of +1 to two).
 */
export function setStatPickAt(csv: string | undefined, index: number, ability: string, count: number): string {
    const picks = statChoicePicks(csv, Math.max(count, index + 1));
    picks[index] = ability;
    return picks.join(",");
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
 * A choice-form Stats command EXPANDED into one concrete command per picked ability
 * (character.statChoices holds a CSV of picks, keyed by statChoiceKey) — or null while the
 * picks are missing/incomplete/invalid, in which case the command must NOT apply.
 * The same ability may be picked more than once and stacks (+1 twice = +2).
 */
function resolveChoiceStatMads(character: Character, choiceKey: string, m: MadFeature): MadFeature[] | null {
    const picks = (character.statChoices?.[choiceKey] ?? "").split(",").map(s => s.trim()).filter(Boolean);
    const options = statChoiceOptions(m);
    if (picks.length !== statChoiceCount(m)) return null;
    if (!picks.every(p => options.includes(p))) return null;
    return picks.map(pick => ({ ...m, value: { ...m.value, stat: pick } }));
}

/** All choice-form stat commands on a feature (for the sheet's chooser UI). */
export function choiceStatMads(feature: { name: string; metadata?: { mads?: unknown } }): MadFeature[] {
    return ((feature.metadata?.mads ?? []) as MadFeature[]).filter(isChoiceStatMad);
}

/** Choice-form stat commands on a feature that still need picks (for the sheet's chooser UI). */
export function pendingStatChoices(character: Character, feature: { id?: string; name: string; metadata?: { mads?: unknown } }): MadFeature[] {
    return choiceStatMads(feature).filter(m => !resolveChoiceStatMads(character, statChoiceKey(feature), m));
}

/** True for a choice-form Proficiencies command ("proficiency in N skills of your choice") that needs player picks. */
function isChoiceProficiencyMad(m: MadFeature): boolean {
    return (m.command === "AddProficiencies" || m.command === "RemoveProficiencies") && m.value?.["proficiency"] === "choice";
}

/** The skills a choice-form Proficiencies command allows ("Athletics,Stealth" → ["Athletics","Stealth"]). */
export function proficiencyChoiceOptions(m: MadFeature): string[] {
    return (m.value?.["options"] ?? "").split(",").map(s => s.trim()).filter(Boolean);
}

/** How many skills the player picks (defaults to 1). */
export function proficiencyChoiceCount(m: MadFeature): number {
    const n = Number(m.value?.["count"] ?? "1");
    return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1;
}

/**
 * A choice-form Proficiencies command EXPANDED into one concrete command per picked skill
 * (character.proficiencyChoices holds a CSV of picks, keyed by statChoiceKey) — or null while
 * the picks are missing/incomplete/invalid, in which case the command must NOT apply.
 */
function resolveChoiceProficiencyMads(character: Character, choiceKey: string, m: MadFeature): MadFeature[] | null {
    const picks = (character.proficiencyChoices?.[choiceKey] ?? "").split(",").map(s => s.trim()).filter(Boolean);
    const options = proficiencyChoiceOptions(m);
    if (picks.length !== proficiencyChoiceCount(m) || !picks.every(p => options.includes(p))) return null;
    return picks.map(pick => ({ ...m, value: { ...m.value, proficiency: pick } }));
}

/** All choice-form Proficiencies commands on a feature (for the sheet's chooser UI). */
export function choiceProficiencyMads(feature: { name: string; metadata?: { mads?: unknown } }): MadFeature[] {
    return ((feature.metadata?.mads ?? []) as MadFeature[]).filter(isChoiceProficiencyMad);
}

/** Choice-form Proficiencies commands on a feature that still need picks (for the sheet's chooser UI). */
export function pendingProficiencyChoices(character: Character, feature: { id?: string; name: string; metadata?: { mads?: unknown } }): MadFeature[] {
    return choiceProficiencyMads(feature).filter(m => !resolveChoiceProficiencyMads(character, statChoiceKey(feature), m));
}

/** True for a choice-form Spells command ("choose N spells from a list") that needs player picks. */
function isChoiceSpellMad(m: MadFeature): boolean {
    return (m.command === "AddSpells" || m.command === "RemoveSpells") && m.value?.["ID"] === "choice";
}

/** True for a choice-form Spells command whose allowed list is (partly) filter-derived. */
export function isFilterFormSpellMad(m: MadFeature): boolean {
    return isChoiceSpellMad(m) && hasSpellFilterValue(m.value);
}

/** The spell ids a choice-form Spells command allows ("id1,id2" → ["id1","id2"]). */
export function spellChoiceOptions(m: MadFeature): string[] {
    return (m.value?.["options"] ?? "").split(",").map(s => s.trim()).filter(Boolean);
}

/** How many spells the player picks (defaults to 1). */
export function spellChoiceCount(m: MadFeature): number {
    const n = Number(m.value?.["count"] ?? "1");
    return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1;
}

/**
 * The character.spellChoices key for one choice-form Spells command. Keyed per feature AND per spell
 * level — one feature can carry several choice commands (Magic Initiate: two cantrips + a level-1
 * spell), and the spell level is what tells them apart.
 */
export function spellChoiceKey(feature: { id?: string; name: string }, m: MadFeature): string {
    return `${statChoiceKey(feature)}::${m.value?.["spellLevel"] ?? "0"}`;
}

/**
 * A choice-form Spells command EXPANDED into one concrete command per picked spell
 * (character.spellChoices holds a CSV of picked spell ids, keyed by spellChoiceKey) — or null while
 * the picks are missing/incomplete/invalid, in which case the command must NOT apply.
 */
function resolveChoiceSpellMads(character: Character, feature: { id?: string; name: string }, m: MadFeature): MadFeature[] | null {
    const picks = (character.spellChoices?.[spellChoiceKey(feature, m)] ?? "").split(",").map(s => s.trim()).filter(Boolean);
    if (picks.length !== spellChoiceCount(m)) return null;
    // Derived pools (filters, or bare spellLevel = "any spell of that level") come from the spell
    // catalog, which this resolver doesn't have — membership is enforced by the creator picker
    // (the only writer), so count is all we check.
    if (!hasDerivedSpellPool(m.value) && !picks.every(p => spellChoiceOptions(m).includes(p))) return null;
    return picks.map(pick => ({ ...m, value: { ...m.value, ID: pick } }));
}

/** All choice-form Spells commands on a feature (for the sheet's chooser UI). */
export function choiceSpellMads(feature: { name: string; metadata?: { mads?: unknown } }): MadFeature[] {
    return ((feature.metadata?.mads ?? []) as MadFeature[]).filter(isChoiceSpellMad);
}

/** Choice-form Spells commands on a feature that still need picks (for the sheet's chooser UI). */
export function pendingSpellChoices(character: Character, feature: { id?: string; name: string; metadata?: { mads?: unknown } }): MadFeature[] {
    return choiceSpellMads(feature).filter(m => !resolveChoiceSpellMads(character, feature, m));
}

/** True for a choice-form Expertise command ("gain Expertise in a skill of your choice") that needs player picks. */
function isChoiceExpertiseMad(m: MadFeature): boolean {
    return (m.command === "AddExpertise" || m.command === "RemoveExpertise") && m.value?.["proficiency"] === "choice";
}

/** The skills a choice-form Expertise command allows ("Arcana,History" → ["Arcana","History"]). */
export function expertiseChoiceOptions(m: MadFeature): string[] {
    return (m.value?.["options"] ?? "").split(",").map(s => s.trim()).filter(Boolean);
}

/** How many skills the player picks (defaults to 1). */
export function expertiseChoiceCount(m: MadFeature): number {
    const n = Number(m.value?.["count"] ?? "1");
    return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1;
}

/**
 * The character.proficiencyChoices key for a feature's Expertise picks. The "::expertise"
 * suffix keeps them off the same feature's plain skill-proficiency picks.
 */
export function expertiseChoiceKey(feature: { id?: string; name: string }): string {
    return `${statChoiceKey(feature)}::expertise`;
}

/**
 * A choice-form Expertise command EXPANDED into one concrete command per picked skill
 * (character.proficiencyChoices holds a CSV of picks, keyed by expertiseChoiceKey) — or null
 * while the picks are missing/incomplete/invalid, in which case the command must NOT apply.
 */
function resolveChoiceExpertiseMads(character: Character, feature: { id?: string; name: string }, m: MadFeature): MadFeature[] | null {
    const picks = (character.proficiencyChoices?.[expertiseChoiceKey(feature)] ?? "").split(",").map(s => s.trim()).filter(Boolean);
    const options = expertiseChoiceOptions(m);
    if (picks.length !== expertiseChoiceCount(m) || !picks.every(p => options.includes(p))) return null;
    return picks.map(pick => ({ ...m, value: { ...m.value, proficiency: pick } }));
}

/** All choice-form Expertise commands on a feature (for the sheet's chooser UI). */
export function choiceExpertiseMads(feature: { name: string; metadata?: { mads?: unknown } }): MadFeature[] {
    return ((feature.metadata?.mads ?? []) as MadFeature[]).filter(isChoiceExpertiseMad);
}

/** Choice-form Expertise commands on a feature that still need picks (for the sheet's chooser UI). */
export function pendingExpertiseChoices(character: Character, feature: { id?: string; name: string; metadata?: { mads?: unknown } }): MadFeature[] {
    return choiceExpertiseMads(feature).filter(m => !resolveChoiceExpertiseMads(character, feature, m));
}

/** True for a choice-form Resistances command ("resistance to one damage type of your choice") that needs a player pick. */
function isChoiceResistanceMad(m: MadFeature): boolean {
    return (m.command === "AddResistances" || m.command === "RemoveResistances") && m.value?.["damageType"] === "choice";
}

/** The damage types a choice-form Resistances command allows ("Fire,Poison" → ["Fire","Poison"]). */
export function resistanceChoiceOptions(m: MadFeature): string[] {
    return (m.value?.["options"] ?? "").split(",").map(s => s.trim()).filter(Boolean);
}

/** How many damage types the player picks (defaults to 1). */
export function resistanceChoiceCount(m: MadFeature): number {
    const n = Number(m.value?.["count"] ?? "1");
    return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1;
}

/** The character.proficiencyChoices key for a feature's resistance picks. */
export function resistanceChoiceKey(feature: { id?: string; name: string }): string {
    return `${statChoiceKey(feature)}::resistance`;
}

/**
 * A choice-form Resistances command EXPANDED into one concrete command per picked damage type
 * (character.proficiencyChoices holds a CSV of picks, keyed by resistanceChoiceKey) — or null
 * while the picks are missing/incomplete/invalid, in which case the command must NOT apply.
 */
function resolveChoiceResistanceMads(character: Character, feature: { id?: string; name: string }, m: MadFeature): MadFeature[] | null {
    const picks = (character.proficiencyChoices?.[resistanceChoiceKey(feature)] ?? "").split(",").map(s => s.trim()).filter(Boolean);
    const options = resistanceChoiceOptions(m);
    if (picks.length !== resistanceChoiceCount(m) || !picks.every(p => options.includes(p))) return null;
    return picks.map(pick => ({ ...m, value: { ...m.value, damageType: pick } }));
}

/** All choice-form Resistances commands on a feature (for the sheet's chooser UI). */
export function choiceResistanceMads(feature: { name: string; metadata?: { mads?: unknown } }): MadFeature[] {
    return ((feature.metadata?.mads ?? []) as MadFeature[]).filter(isChoiceResistanceMad);
}

/** Choice-form Resistances commands on a feature that still need picks (for the sheet's chooser UI). */
export function pendingResistanceChoices(character: Character, feature: { id?: string; name: string; metadata?: { mads?: unknown } }): MadFeature[] {
    return choiceResistanceMads(feature).filter(m => !resolveChoiceResistanceMads(character, feature, m));
}

/** True for a choice-form Languages command ("two languages of your choice") that needs player picks. */
function isChoiceLanguageMad(m: MadFeature): boolean {
    return (m.command === "AddLanguages" || m.command === "RemoveLanguages") && m.value?.["name"] === "choice";
}

/** The languages a choice-form Languages command allows ("Elvish,Dwarvish" → ["Elvish","Dwarvish"]). */
export function languageChoiceOptions(m: MadFeature): string[] {
    return (m.value?.["options"] ?? "").split(",").map(s => s.trim()).filter(Boolean);
}

/** How many languages the player picks (defaults to 1). */
export function languageChoiceCount(m: MadFeature): number {
    const n = Number(m.value?.["count"] ?? "1");
    return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1;
}

/** The character.proficiencyChoices key for a feature's language picks. */
export function languageChoiceKey(feature: { id?: string; name: string }): string {
    return `${statChoiceKey(feature)}::languages`;
}

/**
 * A choice-form Languages command EXPANDED into one concrete command per picked language
 * (character.proficiencyChoices holds a CSV of picks, keyed by languageChoiceKey) — or null
 * while the picks are missing/incomplete/invalid, in which case the command must NOT apply.
 */
function resolveChoiceLanguageMads(character: Character, feature: { id?: string; name: string }, m: MadFeature): MadFeature[] | null {
    const picks = (character.proficiencyChoices?.[languageChoiceKey(feature)] ?? "").split(",").map(s => s.trim()).filter(Boolean);
    const options = languageChoiceOptions(m);
    if (picks.length !== languageChoiceCount(m) || !picks.every(p => options.includes(p))) return null;
    return picks.map(pick => ({ ...m, value: { ...m.value, name: pick } }));
}

/** All choice-form Languages commands on a feature (for the sheet's chooser UI). */
export function choiceLanguageMads(feature: { name: string; metadata?: { mads?: unknown } }): MadFeature[] {
    return ((feature.metadata?.mads ?? []) as MadFeature[]).filter(isChoiceLanguageMad);
}

/** Choice-form Languages commands on a feature that still need picks (for the sheet's chooser UI). */
export function pendingLanguageChoices(character: Character, feature: { id?: string; name: string; metadata?: { mads?: unknown } }): MadFeature[] {
    return choiceLanguageMads(feature).filter(m => !resolveChoiceLanguageMads(character, feature, m));
}

// ---- branch groups ("pick one lineage") ----

/** A mad's branch number; 0 / missing / invalid = always applies. */
export function madGroup(m: MadFeature): number {
    const n = Number(m.group ?? 0);
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
}

/**
 * The mutually-exclusive branches a feature carries: its distinct nonzero groups in order,
 * labeled by the first value.groupLabel found in each ("Drow", "Infernal"...).
 */
export function featureGroupOptions(feature: { metadata?: { mads?: unknown } }): { group: number; label: string }[] {
    const byGroup = new Map<number, string>();
    for (const m of (feature.metadata?.mads ?? []) as MadFeature[]) {
        const g = madGroup(m);
        if (g === 0) continue;
        if (!byGroup.has(g) || !byGroup.get(g)) byGroup.set(g, (m.value?.["groupLabel"] ?? "").trim());
    }
    return [...byGroup.entries()]
        .sort((a, b) => a[0] - b[0])
        .map(([group, label]) => ({ group, label: label || `Option ${group}` }));
}

/** The character.proficiencyChoices key holding a feature's picked branch (the group number as a string). */
export function groupChoiceKey(feature: { id?: string; name: string }): string {
    return `${statChoiceKey(feature)}::group`;
}

/** The branch the player picked for a feature, or null while unpicked/invalid. */
export function resolvedGroupChoice(character: Character, feature: { id?: string; name: string; metadata?: { mads?: unknown } }): number | null {
    const raw = (character.proficiencyChoices?.[groupChoiceKey(feature)] ?? "").trim();
    if (!raw) return null;
    const pick = Number(raw);
    return featureGroupOptions(feature).some(o => o.group === pick) ? pick : null;
}

/** True while a feature carries branch groups the player hasn't picked between yet. */
export function pendingGroupChoice(character: Character, feature: { id?: string; name: string; metadata?: { mads?: unknown } }): boolean {
    return featureGroupOptions(feature).length > 0 && resolvedGroupChoice(character, feature) === null;
}

/**
 * A feature's mads filtered to the ACTIVE branch: group-0 mads always apply; branch mads only
 * once the player has picked that branch. The one filter every consumer (sheet application AND
 * the choice pickers) routes through, so an unpicked branch's commands — including any nested
 * choice pickers — stay dormant instead of applying to every character.
 */
export function activeFeatureMads(character: Character, feature: { id?: string; name: string; metadata?: { mads?: unknown } }): MadFeature[] {
    const mads = (feature.metadata?.mads ?? []) as MadFeature[];
    if (!mads.some(m => madGroup(m) > 0)) return mads;
    const chosen = resolvedGroupChoice(character, feature);
    return mads.filter(m => madGroup(m) === 0 || madGroup(m) === chosen);
}

/** True for a choice-form Items command ("choose N items from a list") that needs player picks. */
function isChoiceItemMad(m: MadFeature): boolean {
    return (m.command === "AddItems" || m.command === "RemoveItems") && m.value?.["ID"] === "choice";
}

/** The item ids a choice-form Items command allows ("id1,id2" → ["id1","id2"]). */
export function itemChoiceOptions(m: MadFeature): string[] {
    return (m.value?.["options"] ?? "").split(",").map(s => s.trim()).filter(Boolean);
}

/** How many items the player picks (defaults to 1). */
export function itemChoiceCount(m: MadFeature): number {
    const n = Number(m.value?.["count"] ?? "1");
    return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1;
}

/**
 * The character.itemChoices key for one choice-form Items command. Keyed per feature AND per
 * options list — one feature can carry several item choices (a weapon pick and a tool pick),
 * and items have no spellLevel-style discriminator, so the allowed list tells them apart.
 */
export function itemChoiceKey(feature: { id?: string; name: string }, m: MadFeature): string {
    return `${statChoiceKey(feature)}::items::${m.value?.["options"] ?? ""}`;
}

/**
 * A choice-form Items command EXPANDED into one concrete command per picked item
 * (character.itemChoices holds a CSV of picked item ids, keyed by itemChoiceKey) — or null while
 * the picks are missing/incomplete/invalid, in which case the command must NOT apply.
 */
function resolveChoiceItemMads(character: Character, feature: { id?: string; name: string }, m: MadFeature): MadFeature[] | null {
    const picks = (character.itemChoices?.[itemChoiceKey(feature, m)] ?? "").split(",").map(s => s.trim()).filter(Boolean);
    const options = itemChoiceOptions(m);
    if (picks.length !== itemChoiceCount(m) || !picks.every(p => options.includes(p))) return null;
    return picks.map(pick => ({ ...m, value: { ...m.value, ID: pick } }));
}

/** All choice-form Items commands on a feature (for the sheet's chooser UI). */
export function choiceItemMads(feature: { name: string; metadata?: { mads?: unknown } }): MadFeature[] {
    return ((feature.metadata?.mads ?? []) as MadFeature[]).filter(isChoiceItemMad);
}

/** Choice-form Items commands on a feature that still need picks (for the sheet's chooser UI). */
export function pendingItemChoices(character: Character, feature: { id?: string; name: string; metadata?: { mads?: unknown } }): MadFeature[] {
    return choiceItemMads(feature).filter(m => !resolveChoiceItemMads(character, feature, m));
}

/**
 * Every Character-type mad across all of a character's feature sources
 * (class levels, race, and top-level features), ready to feed useMadCharacters.
 * Info-type mads (like Uses) describe their owning feature and are excluded.
 * Choice-form Stats commands are resolved against character.statChoices (keyed by
 * feature name); unresolved ones are excluded until the player picks.
 */
/**
 * Every feature-bearing source on a character, flattened in canonical order: class levels,
 * race, background, top-level (feats + mads-granted). The ONE place the source list lives —
 * equipment proficiencies and the view page's feature list reuse it, so a new source is
 * added here once, not in four hand-maintained copies.
 */
export function characterMadFeatureSources(character: Character) {
    return [
        ...(character.levels ?? []).flatMap(l => l.features ?? []),
        ...(character.race?.features ?? []),
        ...(character.backgroundFeatures ?? []),
        ...(character.features ?? []),
    ];
}

export function collectMadFeatures(character: Character): MadFeature[] {
    const feats = characterMadFeatureSources(character);

    return feats.flatMap(f =>
        // activeFeatureMads keeps unpicked-branch mads dormant (group 0 always applies).
        activeFeatureMads(character, f).flatMap(m => {
            if (m.type !== MadType.Character) return [];
            if (isChoiceStatMad(m)) {
                return resolveChoiceStatMads(character, statChoiceKey(f), m) ?? [];
            }
            if (isChoiceProficiencyMad(m)) {
                return resolveChoiceProficiencyMads(character, statChoiceKey(f), m) ?? [];
            }
            if (isChoiceExpertiseMad(m)) {
                return resolveChoiceExpertiseMads(character, f, m) ?? [];
            }
            if (isChoiceResistanceMad(m)) {
                return resolveChoiceResistanceMads(character, f, m) ?? [];
            }
            if (isChoiceLanguageMad(m)) {
                return resolveChoiceLanguageMads(character, f, m) ?? [];
            }
            if (isChoiceSpellMad(m)) {
                return resolveChoiceSpellMads(character, f, m) ?? [];
            }
            if (isChoiceItemMad(m)) {
                return resolveChoiceItemMads(character, f, m) ?? [];
            }
            return [m];
        }),
    );
}

/**
 * Character-type mads carried by the magic items the character has on (Headband of Intellect,
 * Ring of Protection, ...). Items requiring attunement apply only while attuned; any other
 * item applies while equipped (or attuned). Matched by name — equipped/attuned store names.
 * Callers should append these AFTER feature mads so a `mode:set` stat item wins over feat ASIs.
 * Choice-form mads are skipped — items have no picker UI to resolve them.
 */
/** Attunement strings that MEAN "no attunement" despite being non-empty (loosely-authored/AI items). */
const NO_ATTUNEMENT_PLACEHOLDERS = new Set(["no", "none", "false", "n/a", "-"]);

export function collectMagicItemMads(character: Character, magicItems: MagicItem[]): MadFeature[] {
    // Gear entries carry a selector key when catalog-added; an id pins the exact catalog row
    // (the right edition), while free-text and older name-string saves still match by name.
    const gearSets = (entries: (string | { name: string; id?: string })[] | undefined) => {
        const names = new Set<string>();
        const ids = new Set<string>();
        const idPinnedNames = new Set<string>();
        (entries ?? []).forEach((entry) => {
            const name = itemRefName(entry).toLowerCase();
            names.add(name);
            const id = itemRefId(entry);
            if (id) {
                ids.add(id);
                idPinnedNames.add(name);
            }
        });
        return { names, ids, idPinnedNames };
    };
    const equipped = gearSets(character.items?.equipped);
    const attuned = gearSets(character.items?.attuned);
    if (equipped.names.size === 0 && attuned.names.size === 0) return [];

    // First row per name wins — merged both-edition catalogs (current rows first) and
    // duplicated homebrew rows must not apply the same item's mads twice. An id-pinned gear
    // entry outranks that: only its exact row applies for that name.
    const seen = new Set<string>();
    return magicItems.flatMap(item => {
        const name = (item.name ?? "").toLowerCase();
        const key = entitySelectorKey({ id: item.id, name: item.name ?? "" });
        const idMatch = equipped.ids.has(key) || attuned.ids.has(key);
        const nameMatch =
            (equipped.names.has(name) && !equipped.idPinnedNames.has(name)) ||
            (attuned.names.has(name) && !attuned.idPinnedNames.has(name));
        if (!name || seen.has(name) || !(idMatch || nameMatch)) return [];
        seen.add(name);
        const attunement = (item.properties?.attunement ?? "").trim().toLowerCase();
        const requiresAttunement = !!attunement && !NO_ATTUNEMENT_PLACEHOLDERS.has(attunement);
        if (requiresAttunement && !(attuned.ids.has(key) || attuned.names.has(name))) return [];
        // Choice-form and branch-grouped mads are skipped — items have no picker UI to resolve them.
        return ((item.metadata?.mads ?? []) as MadFeature[]).filter(m =>
            m.type === MadType.Character && madGroup(m) === 0 &&
            !isChoiceStatMad(m) && !isChoiceProficiencyMad(m) && !isChoiceSpellMad(m) && !isChoiceItemMad(m) &&
            !isChoiceExpertiseMad(m) && !isChoiceResistanceMad(m) && !isChoiceLanguageMad(m));
    });
}



