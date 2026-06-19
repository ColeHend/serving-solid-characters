import { describe, it, expect, vi } from 'vitest';
import { Character } from '../../../models/character.model';
import { Stats } from '../../customHooks/dndInfo/useCharacters';
import { SHEET_FIELD_DEFS } from '../characterFields';

// Mock the classes hook the spell-slot derivation depends on (Full-caster Wizard
// with a level-5 slot table). CasterType.Full === 3.
const { mockClasses } = vi.hoisted(() => ({
  mockClasses: [
    {
      name: 'Wizard',
      spellcasting: {
        metadata: { casterType: 3, slots: { 5: { spellSlotsLevel1: 4, spellSlotsLevel2: 3, spellSlotsLevel3: 2 } } },
      },
    },
  ],
}));
vi.mock('../../customHooks/dndInfo/info/all/classes', () => ({
  useDnDClasses: () => () => mockClasses,
}));

import { characterToFeatureLists, characterToSheetValues } from './characterToSheetValues';

const FULL_STATS: Stats = { str: 8, dex: 15, con: 10, int: 18, wis: 12, cha: 13 };

function wizard(): Character {
  const char = new Character();
  char.name = 'Gandalf';
  char.className = 'Wizard';
  char.levels = Array.from({ length: 5 }, () => ({ class: 'Wizard', level: 1, hitDie: 6, features: [] }));
  char.race = { species: 'Human', subrace: 'Variant', size: 'Medium', age: '50', speed: '30ft', features: [] };
  char.background = 'Sage';
  char.alignment = 'NG';
  char.proficiencies = {
    skills: {
      Arcana: { stat: 'int', value: 0, proficient: true, expertise: false },
      'sleight of hand': { stat: 'dex', value: 0, proficient: true, expertise: true }, // lowercase → tests canonicalization
      Perception: { stat: 'wis', value: 0, proficient: true, expertise: false },
    },
    other: { "Thieves' Tools": true, Lute: false },
  };
  char.savingThrows = [
    { stat: 'int', proficient: true },
    { stat: 'wis', proficient: true },
  ];
  char.languages = ['Common', 'Elvish'];
  char.health = { max: 30, current: 22, temp: 5 };
  char.items.currency.sliverPieces = 7;
  char.spells = [
    { name: 'Fireball', prepared: true },
    { name: 'Mage Hand', prepared: false },
  ];
  return char;
}

describe('characterToSheetValues — key parity', () => {
  it('emits a value for every SHEET_FIELD_DEFS key', () => {
    const out = characterToSheetValues(wizard(), FULL_STATS);
    for (const def of SHEET_FIELD_DEFS) expect(out, `missing key: ${def.key}`).toHaveProperty(def.key);
  });

  it('returns an empty object for no character', () => {
    expect(characterToSheetValues(undefined, FULL_STATS)).toEqual({});
  });
});

describe('characterToSheetValues — derivations', () => {
  const out = characterToSheetValues(wizard(), FULL_STATS);

  it('ability modifiers from effective stats', () => {
    expect(out.strMod).toBe('-1'); // 8 → -1
    expect(out.conMod).toBe('+0'); // 10 → 0
    expect(out.dexMod).toBe('+2'); // 15 → +2
    expect(out.intMod).toBe('+4'); // 18 → +4
  });

  it('proficiency bonus for level 5 (+3)', () => {
    expect(out.proficiencyBonus).toBe('+3');
    expect(out.level).toBe('5');
  });

  it('skill mod with proficiency + expertise and case-insensitive Sleight of Hand', () => {
    expect(out.arcana).toBe('+7'); // int +4 + pb 3
    expect(out.sleightOfHand).toBe('+8'); // dex +2 + pb 3 + expertise 3
  });

  it('sparse saving throws default to non-proficient', () => {
    expect(out.intSave).toBe('+7'); // +4 + pb 3
    expect(out.intSaveProf).toBe('•'); // WinAnsi-safe bullet
    expect(out.strSave).toBe('-1'); // -1 + 0 (not proficient)
    expect(out.strSaveProf).toBe('');
  });

  it('proficiency dots use WinAnsi-safe glyphs (•, •• for expertise)', () => {
    expect(out.arcanaProf).toBe('•'); // proficient
    expect(out.sleightOfHandProf).toBe('••'); // expertise
    expect(out.athleticsProf).toBe(''); // neither
  });

  it('ArmorClass/Speed stored as 0 render blank / fall back to race speed', () => {
    expect(out.armorClass).toBe(''); // stored ArmorClass is always 0 → blank
    expect(out.speed).toBe('30ft'); // Speed 0 → falls back to race.speed
  });

  it('initiative, passive perception, spell DC/attack', () => {
    expect(out.initiative).toBe('+2'); // dex +2
    expect(out.passivePerception).toBe('14'); // 10 + (wis +1 + pb 3)
    expect(out.spellSaveDC).toBe('15'); // 8 + 3 + 4
    expect(out.spellAttack).toBe('+7'); // 3 + 4
  });

  it('single-class spell slots from the class table', () => {
    expect(out.spellSlotsLevel1).toBe('4');
    expect(out.spellSlotsLevel3).toBe('2');
    expect(out.spellSlotsLevel4).toBe('');
  });

  it('hit-dice grouping and currency typo key', () => {
    expect(out.hitDice).toBe('5d6');
    expect(out.currencySP).toBe('7');
  });

  it('spell known/prepared lists and languages prepend Common once', () => {
    expect(out.spellsKnown).toBe('Fireball, Mage Hand');
    expect(out.spellsPrepared).toBe('Fireball');
    expect(out.languages).toBe('Common, Elvish');
  });
});

describe('characterToSheetValues — feature split', () => {
  function withFeatures(): Character {
    const char = wizard();
    char.levels = [
      { class: 'Wizard', level: 1, hitDie: 6, features: [{ name: 'Spellcasting', description: 'Cast wizard spells.' }] },
      { class: 'Wizard', level: 2, hitDie: 6, features: [{ name: 'Arcane Recovery', description: 'Regain slots on a rest.' }] },
    ];
    char.race = { species: 'Elf', features: [{ name: 'Darkvision', description: 'See in dim light 60ft.' }] };
    char.features = [{ name: 'Lucky', description: 'Reroll three dice per day.' }];
    return char;
  }

  it('splits class / species / feat NAMES into their own keys', () => {
    const out = characterToSheetValues(withFeatures(), FULL_STATS);
    expect(out.classFeatures).toBe('Spellcasting, Arcane Recovery');
    expect(out.speciesTraits).toBe('Darkvision');
    expect(out.feats).toBe('Lucky');
  });

  it('keeps the legacy `features` key as the merged list of every source', () => {
    const out = characterToSheetValues(withFeatures(), FULL_STATS);
    for (const name of ['Lucky', 'Darkvision', 'Spellcasting', 'Arcane Recovery']) {
      expect(out.features).toContain(name);
    }
  });

  it('characterToFeatureLists returns structured FeatureDetail[] per box', () => {
    const lists = characterToFeatureLists(withFeatures());
    expect(lists.classFeatures.map((f) => f.name)).toEqual(['Spellcasting', 'Arcane Recovery']);
    expect(lists.classFeatures[0].description).toBe('Cast wizard spells.');
    expect(lists.speciesTraits.map((f) => f.name)).toEqual(['Darkvision']);
    expect(lists.feats.map((f) => f.name)).toEqual(['Lucky']);
  });

  it('characterToFeatureLists returns {} for no character', () => {
    expect(characterToFeatureLists(undefined)).toEqual({});
  });
});

describe('characterToSheetValues — equipment training & proficiencies', () => {
  const profs = { armor: ['Light', 'Medium', 'Heavy', 'Shields'], weapons: ['Simple', 'Martial'], tools: ["Thieves' Tools"] };

  it('marks held armor categories with an X and lists weapons/tools', () => {
    const out = characterToSheetValues(wizard(), FULL_STATS, undefined, profs);
    expect(out.armorLight).toBe('X');
    expect(out.armorMedium).toBe('X');
    expect(out.armorHeavy).toBe('X');
    expect(out.armorShields).toBe('X');
    expect(out.weaponProficiencies).toBe('Simple, Martial');
    expect(out.toolProficiencies).toBe("Thieves' Tools");
  });

  it('leaves un-held armor categories blank (generator skips empties)', () => {
    const out = characterToSheetValues(wizard(), FULL_STATS, undefined, { armor: ['Light'], weapons: [], tools: [] });
    expect(out.armorLight).toBe('X');
    expect(out.armorMedium).toBe('');
    expect(out.armorHeavy).toBe('');
    expect(out.armorShields).toBe('');
    expect(out.weaponProficiencies).toBe('');
    expect(out.toolProficiencies).toBe('');
  });

  it('accepts the singular "Shield" spelling for the shields checkbox', () => {
    const out = characterToSheetValues(wizard(), FULL_STATS, undefined, { armor: ['Shield'], weapons: [], tools: [] });
    expect(out.armorShields).toBe('X');
  });

  it('omitting profs yields blank armor/weapon/tool keys (key parity holds)', () => {
    const out = characterToSheetValues(wizard(), FULL_STATS);
    for (const k of ['armorLight', 'armorMedium', 'armorHeavy', 'armorShields', 'weaponProficiencies', 'toolProficiencies']) {
      expect(out[k]).toBe('');
    }
  });
});

describe('characterToSheetValues — guards', () => {
  it('tolerates empty/malformed levels', () => {
    const char = new Character();
    char.levels = [];
    const out = characterToSheetValues(char, FULL_STATS);
    expect(out.hitDice).toBe('');
    expect(out).toHaveProperty('name');
  });
});
