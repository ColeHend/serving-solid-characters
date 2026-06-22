import { Character } from '../../../models/character.model';
import { Stats } from '../../customHooks/dndInfo/useCharacters';

/**
 * Shared character-sheet test fixtures (used by `characterToSheetValues.test.ts`
 * and `generateSheetPdf.test.ts`). Test-only — not imported by production code.
 */

/** Effective ability scores for {@link wizard}. */
export const FULL_STATS: Stats = { str: 8, dex: 15, con: 10, int: 18, wis: 12, cha: 13 };

/** Equipment-training proficiencies passed alongside {@link wizard}. */
export const WIZARD_PROFS = {
  armor: ['Light', 'Medium', 'Heavy', 'Shields'],
  weapons: ['Simple', 'Martial'],
  tools: ["Thieves' Tools"],
};

/** A level-5 single-class Wizard with sparse skills/saves, spells, and currency. */
export function wizard(): Character {
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
