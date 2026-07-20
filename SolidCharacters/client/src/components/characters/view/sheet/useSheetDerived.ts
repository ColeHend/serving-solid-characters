import { Accessor, createMemo } from "solid-js";
import { Character, SkillOverrideState, itemRefName } from "../../../../models/character.model";
import { Stats } from "../../../../shared/customHooks/dndInfo/useCharacters";
import {
  getAbilityModifier,
  getProficiencyBonus,
} from "../../../../shared/customHooks/utility/tools/dndMath";
import {
  computeInitiative,
  computePassivePerception,
  hitDieSides,
  mergeMadSkillRows,
  skillStorageKey,
  SkillRow,
} from "../../create/rules/engine";
import {
  ABILITY_FULL_NAMES,
  ABILITY_KEYS,
  ABILITY_LABELS,
  AbilityKey,
  SKILLS,
  SPELL_ABILITY,
} from "../../create/rules/constants";
import { useDnDClasses } from "../../../../shared/customHooks/dndInfo/info/all/classes";
import { useDnDItems } from "../../../../shared/customHooks/dndInfo/info/all/items";
import { ItemType } from "../../../../models/generated";

export interface SaveDisplay {
  key: AbilityKey;
  label: string;
  mod: number;
  proficient: boolean;
}

export interface SkillDisplay {
  name: string;
  ability: AbilityKey;
  abilityLabel: string;
  mod: number;
  state: SkillOverrideState;
}

export interface SpellcastingDisplay {
  ability: AbilityKey;
  abilityLabel: string;
  saveDc: number;
  attack: number;
}

export interface SlotDisplay {
  level: number;
  max: number;
}

export interface HitDicePool {
  sides: number;
  total: number;
}

export interface SheetDerived {
  level: number;
  profBonus: number;
  abilityMods: Record<AbilityKey, number>;
  saves: SaveDisplay[];
  skills: SkillDisplay[];
  passivePerception: number;
  initiative: number;
  ac: number;
  armorLabel: string;
  speed: number;
  spellcasting: SpellcastingDisplay | null;
  spellSlots: SlotDisplay[];
  hitDicePools: HitDicePool[];
}

const rank = (state: SkillOverrideState): number =>
  state === "expertise" ? 2 : state === "proficient" ? 1 : 0;

/**
 * One guarded, display-ready memo of every derived sheet value. All ability-modifier and
 * proficiency-bonus math funnels through the shared `dndMath` helpers, and level is taken from
 * `levels.length` (never the class `level` getter, which is lost when Dexie returns plain objects
 * and is the source of the old NaN skill/save values). `display` is the mads-applied character;
 * `base` is the persisted one (needed so mad-driven skill bumps like Jack of All Trades resolve).
 */
export default function useSheetDerived(
  display: Accessor<Character | undefined>,
  base: Accessor<Character | undefined>,
  fullStats: Accessor<Stats>,
): Accessor<SheetDerived> {
  const classes = useDnDClasses();
  const allItems = useDnDItems();

  return createMemo<SheetDerived>(() => {
    const char = display();
    const scores = fullStats();

    const level = char?.levels?.length ?? 0;
    const profBonus = getProficiencyBonus(level || 1);

    const abilityMods = {} as Record<AbilityKey, number>;
    ABILITY_KEYS.forEach((k) => (abilityMods[k] = getAbilityModifier(scores[k] ?? 10)));

    // Saving throws — proficiency comes from the character's stored save list (initial class).
    const saveProf = new Set(
      (char?.savingThrows ?? []).filter((s) => s.proficient).map((s) => s.stat),
    );
    const saves: SaveDisplay[] = ABILITY_KEYS.map((key) => ({
      key,
      label: ABILITY_FULL_NAMES[key],
      proficient: saveProf.has(key),
      mod: abilityMods[key] + (saveProf.has(key) ? profBonus : 0),
    }));

    // Skills — base rows merged with the mads-applied character so feature grants and
    // half-proficiency (Jack of All Trades) bumps show up, exactly as the PDF/creator paths do.
    const baseSkills = base()?.proficiencies?.skills ?? {};
    const madSkills = char?.proficiencies?.skills ?? {};
    const baseRows: SkillRow[] = SKILLS.map((s) => {
      const entry = baseSkills[skillStorageKey(s.name)];
      const state: SkillOverrideState = entry?.expertise
        ? "expertise"
        : entry?.proficient
          ? "proficient"
          : "none";
      return {
        name: s.name,
        ability: s.ability,
        state,
        source: state === "none" ? null : "manual",
        locked: false,
        mod: getAbilityModifier(scores[s.ability] ?? 10) + profBonus * rank(state),
      };
    });
    const mergedRows = mergeMadSkillRows(baseRows, baseSkills, madSkills, scores, profBonus);
    const skills: SkillDisplay[] = mergedRows.map((row) => ({
      name: row.name,
      ability: row.ability,
      abilityLabel: ABILITY_LABELS[row.ability],
      mod: row.mod,
      state: row.state,
    }));

    const passivePerception = computePassivePerception(mergedRows);
    const initiative = computeInitiative(abilityMods.dex, char?.rollBonuses ?? [], profBonus, scores);

    // AC: the mads-applied stored value wins (armor/shield/magic land there); fall back to unarmored.
    const storedAc = char?.ArmorClass ?? 0;
    const ac = storedAc > 0 ? storedAc : 10 + abilityMods.dex;

    // Armor label from the first equipped Armor-type item.
    const itemsByName = new Map(allItems().map((it) => [(it.name ?? "").toLowerCase(), it]));
    let armorLabel = "";
    for (const entry of char?.items?.equipped ?? []) {
      const it = itemsByName.get(itemRefName(entry).toLowerCase());
      if (it && it.type === ItemType.Armor) {
        armorLabel = it.name;
        break;
      }
    }

    const className = (char?.className ?? "").toLowerCase();
    const spellAbility = SPELL_ABILITY[className];
    const spellcasting: SpellcastingDisplay | null = spellAbility
      ? {
          ability: spellAbility,
          abilityLabel: ABILITY_LABELS[spellAbility],
          saveDc: 8 + profBonus + getAbilityModifier(scores[spellAbility] ?? 10),
          attack: profBonus + getAbilityModifier(scores[spellAbility] ?? 10),
        }
      : null;

    // Spell slots — single-class only (multiclass slot tables are out of scope, per the mapper).
    const spellSlots: SlotDisplay[] = [];
    try {
      const distinct = new Set((char?.levels ?? []).map((l) => l.class).filter(Boolean));
      if (distinct.size <= 1) {
        const class5e = classes().find((c) => c.name?.toLowerCase() === className);
        const row = class5e?.spellcasting?.metadata?.slots?.[level] as
          | Record<string, number | undefined>
          | undefined;
        if (row) {
          for (let i = 1; i <= 9; i++) {
            const n = row[`spellSlotsLevel${i}`];
            if (n) spellSlots.push({ level: i, max: n });
          }
        }
      }
    } catch {
      // class data unavailable / not in an owner context — leave slots empty.
    }

    // Hit dice pooled by die size (e.g. Bard 5 → one d8 pool of 5).
    const pools = new Map<number, number>();
    for (const lvl of char?.levels ?? []) {
      const sides = hitDieSides(lvl.hitDie);
      if (sides > 0) pools.set(sides, (pools.get(sides) ?? 0) + 1);
    }
    const hitDicePools: HitDicePool[] = [...pools.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([sides, total]) => ({ sides, total }));

    return {
      level,
      profBonus,
      abilityMods,
      saves,
      skills,
      passivePerception,
      initiative,
      ac,
      armorLabel,
      speed: char?.Speed ?? 0,
      spellcasting,
      spellSlots,
      hitDicePools,
    };
  });
}
