import { createMemo } from "solid-js";
import useDnDClasses from "../useDnDClasses";
import HomebrewManager from "../../../homebrewManager";
import type { DnDClass, LevelEntity } from "../../../../../models/old/class.model";
import { FeatureTypes, type Feature, type StartingEquipment } from "../../../../../models/old/core.model";

// Adapter: Convert new Class5E objects (from unified homebrew manager) into legacy DnDClass
// structure expected by existing modal / views. Keeps legacy components working while
// gradual migration occurs.
function adaptClass5E(raw: any): DnDClass {
  // If it already looks like a legacy class (has classLevels array) return as-is.
  if (Array.isArray(raw?.classLevels)) return raw as DnDClass;

  const name: string = raw?.name ?? "Unknown";
  const hitDie: number = typeof raw?.hit_die === 'string' && raw.hit_die.startsWith('d')
    ? Number(raw.hit_die.slice(1))
    : (raw?.hitDie || 6);

  // Flatten proficiencies into a simple string[] the legacy UI filters on.
  const profs: string[] = [];
  if (raw?.proficiencies) {
    const { armor = [], weapons = [], tools = [], skills = [] } = raw.proficiencies;
    profs.push(...armor, ...weapons, ...tools, ...skills);
  }

  // Legacy proficiency choices (skill/tool/armor/weapon). New model stores in `choices` map.
  const proficiencyChoices: any[] = [];
  if (raw?.choices) {
    Object.values(raw.choices as Record<string, { amount: number; options: string[] }>).forEach(c => {
      if (c && c.options?.length) {
        proficiencyChoices.push({ choose: c.amount, type: FeatureTypes.Class, choices: c.options });
      }
    });
  }

  // Starting equipment: legacy shape expects nested choice arrays; supply empty safe defaults.
  const startingEquipment: StartingEquipment = {
    class: name,
    quantity: 1,
    choice1: [],
    choice2: [],
    choice3: [],
    choice4: []
  } as any;

  // Build classLevels (1..20) deriving features from new features record if present.
  const featureRecord: Record<number, { name: string; description: string }[]> = raw?.features || {};
  const buildFeaturesForLevel = (lvl: number): Feature<string, string>[] => {
    const arr = featureRecord[lvl] || [];
    return arr.map(f => ({
      name: f.name,
      value: f.description,
      info: { className: name, subclassName: '', level: lvl, type: FeatureTypes.Class, other: '' },
      metadata: {}
    }));
  };
  const profBonusFor = (lvl: number) => lvl < 5 ? 2 : lvl < 9 ? 3 : lvl < 13 ? 4 : lvl < 17 ? 5 : 6;

  const classLevels: LevelEntity[] = Array.from({ length: 20 }, (_, i) => {
    const lvl = i + 1;
    const features = buildFeaturesForLevel(lvl);
    // Map classSpecific per-level values if provided in new model's classSpecific nested map.
    const classSpecific: Record<string, string> = {};
    if (raw?.classSpecific) {
      Object.entries(raw.classSpecific as Record<string, Record<number, string>>).forEach(([k, rec]) => {
        if (rec && rec[lvl] !== undefined) classSpecific[k] = String(rec[lvl]);
      });
    }
    return {
      info: { className: name, subclassName: '', level: lvl, type: FeatureTypes.Class, other: '' },
      level: lvl,
      profBonus: profBonusFor(lvl),
      features,
      classSpecific,
      spellcasting: undefined
    } as LevelEntity;
  });

  return {
    id: raw?.id ?? -1,
    name,
    hitDie,
    proficiencies: profs,
    proficiencyChoices,
    savingThrows: raw?.saving_throws || raw?.savingThrows || [],
    startingEquipment,
    classLevels,
    subclasses: [],
    spellcasting: undefined,
    classMetadata: { subclassLevels: [], subclassType: '', subclassTypePosition: 'before' }
  } as DnDClass;
}

const useGetClasses = () => {
  const dndSrdClasses = useDnDClasses();
  // Merge SRD legacy classes with adapted homebrew classes (converted to legacy form)
  const allClasses = createMemo(() => {
    const legacy = dndSrdClasses();
    const adaptedHomebrew = HomebrewManager.classes().map(adaptClass5E);
    return [...legacy, ...adaptedHomebrew];
  });
  return allClasses;
};
export { useGetClasses };
export default useGetClasses;