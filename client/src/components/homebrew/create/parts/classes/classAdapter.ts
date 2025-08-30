import { Class5E, Proficiencies } from '../../../../../models/data/classes';
import { FeatureDetail } from '../../../../../models/data/features';
import { StartingEquipment } from '../../../../../models/data/items';
import { Choices, ChoiceDetail } from '../../../../../models/data/core';
import { Spellcasting, SpellCalc, CasterType as NewCasterType } from '../../../../../models/data/spellcasting';
import { ClassForm, ProfStore } from './classes';
import { LevelEntity } from '../../../../../models/old/class.model';

// Thin adapter layer to isolate legacy ClassForm shape from the newer Class5E model.
// Intent: keep UI stable while enabling save payload generation that matches data model.

export interface Class5EPayload extends Omit<Class5E, 'id'> {
  // id will be assigned server-side or by persistence layer
  id?: number;
}

export function toClass5E(form: ClassForm, profs: ProfStore, levels: LevelEntity[]): Class5EPayload {
  const hit_die = form.hitDie ? `d${form.hitDie}` : 'd6';

  const uniq = <T,>(arr: T[] = []) => Array.from(new Set(arr.filter(Boolean)));
  const statName = (n: any) => {
    switch (n) {
    case 0: return 'STR';
    case 1: return 'DEX';
    case 2: return 'CON';
    case 3: return 'INT';
    case 4: return 'WIS';
    case 5: return 'CHA';
    default: return '';
    }
  };

  const proficiencies: Proficiencies = {
    armor: uniq(profs.armor ?? form.armorProficiencies),
    weapons: uniq(profs.weapons ?? form.weaponProficiencies),
    tools: uniq(profs.tools ?? form.toolProficiencies),
    skills: uniq((form.skills || []).map(statName))
  };

  // Aggregate starting equipment: merge explicit startingEquipment plus categorized starts
  const starting_equipment: StartingEquipment[] = [];
  const addEquip = (items?: string[]) => {
    if (items && items.length) starting_equipment.push({ items: [...items] });
  };
  addEquip(form.startingEquipment);
  addEquip(form.weaponStart);
  addEquip(form.armorStart);
  addEquip(form.itemStart);

  // Map level features -> features record keyed by level number
  const features: Record<number, FeatureDetail[]> = {};
  levels.forEach(lvl => {
    if (lvl.features && lvl.features.length) {
      features[lvl.level] = lvl.features.map((f: any) => ({
        name: f.name,
        description: typeof f.value === 'string' ? f.value : JSON.stringify(f.value),
      }));
    }
  });

  // Build classSpecific mapping: each dynamic key has per-level value; transform into nested map
  // In Class5E: classSpecific?: { [key: string]: Record<number, string>; }
  const classSpecificKeys = Object.keys(levels[0]?.classSpecific || {});
  let classSpecific: Class5EPayload['classSpecific'];
  if (classSpecificKeys.length) {
    classSpecific = {};
    classSpecificKeys.forEach(key => {
      classSpecific![key] = {};
      levels.forEach(lvl => {
        const value = lvl.classSpecific[key];
        if (value !== undefined) {
          classSpecific![key][lvl.level] = value;
        }
      });
    });
  }

  // Build choices map (skills + proficiency choices) -> Class5E.choices
  // Skill choice
  const choices: Choices = {};
  if ((form.skillChoiceNum || 0) > 0 && (form.skillChoices?.length || 0) > 0) {
    choices['skill_proficiencies'] = {
      amount: form.skillChoiceNum!,
      options: uniq(form.skillChoices)
    } as ChoiceDetail;
  }
  // Weapon proficiency choices
  (form.weaponProfChoices || []).forEach((c, idx) => {
    if (c && c.choices?.length) {
      choices[`weapon_prof_${idx}`] = {
        amount: c.choose,
        options: uniq(c.choices)
      } as ChoiceDetail;
    }
  });
  // Armor proficiency choices
  (form.armorProfChoices || []).forEach((c, idx) => {
    if (c && c.choices?.length) {
      choices[`armor_prof_${idx}`] = {
        amount: c.choose,
        options: uniq(c.choices)
      } as ChoiceDetail;
    }
  });
  // Tool proficiency choices
  (form.toolProfChoices || []).forEach((c, idx) => {
    if (c && c.choices?.length) {
      choices[`tool_prof_${idx}`] = {
        amount: c.choose,
        options: uniq(c.choices)
      } as ChoiceDetail;
    }
  });

  // Spellcasting mapping (still partial): derive slots & known type
  let spellcasting: Spellcasting | undefined;
  if (form.spellCasting) {
    // Collect slot / cantrip info from per-level spellcasting embed if present
    const slots: Record<number, any> = {};
    levels.forEach(l => {
      if (l.spellcasting) {
        // Clone only defined properties
        const slotRec: any = {};
        Object.entries(l.spellcasting).forEach(([k,v]) => { if (v !== undefined) slotRec[k] = v; });
        if (Object.keys(slotRec).length) slots[l.level] = slotRec;
      }
    });
    const casterTypeMap: Record<number, NewCasterType> = {
      0: NewCasterType.None,
      1: NewCasterType.Third,
      2: NewCasterType.Half,
      3: NewCasterType.Full,
    };
    const oldCaster = (form.casterType as unknown as number) ?? 0;
    const newCaster = casterTypeMap[oldCaster] ?? NewCasterType.None;

    const known_type = form.spellsKnownCalc === 0 ? 'number' : 'calc';
    let spells_known: Record<number, number> | SpellCalc;
    if (known_type === 'number') {
      // Lacking per-level UI: set empty record placeholder.
      spells_known = {}; // TODO capture per-level numeric spells known
    } else {
      spells_known = {
        stat: statName(form.spellcastAbility),
        level: newCaster === NewCasterType.Full ? 'full' : 'half',
        roundUp: form.spellsKnownRoundup || false,
      } as SpellCalc;
    }
    spellcasting = {
      metadata: {
        slots,
        casterType: newCaster,
      },
      known_type: known_type as any,
      spells_known,
      learned_spells: {}, // TODO: capture spells chosen per level
    };
  }

  // primaryStat now an array -> join into comma-separated string of abbreviations
  const primaryAbility = Array.isArray(form.primaryStat)
    ? form.primaryStat.map(statName).filter(Boolean).join(',')
    : statName(form.primaryStat as any);

  const payload: Class5EPayload = {
    name: form.name?.trim(),
    hit_die,
    primary_ability: primaryAbility,
    saving_throws: (form.savingThrows || []).map(statName),
    starting_equipment,
    proficiencies,
    features: Object.keys(features).length ? features : undefined,
    classSpecific,
    spellcasting,
    choices: Object.keys(choices).length ? choices : undefined,
  } as Class5EPayload;
  
  return payload;
}
