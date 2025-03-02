import { Accessor, Setter, createSignal } from "solid-js";
import { Feature } from "../../models/core.model";

export interface Stats {
  str: number;
  dex: number;
  con: number;
  int: number;
  wis: number;
  cha: number;
}

interface CharacterSpells {
    spellsKnown: string[];
    spellsPrepared: string[];
    alwaysPrepared: string[];
}
interface CharacterSkills {
    proficient: string[];
    expertise: string[];
}
export interface Character {
  name: string;
  race: string;
  subrace?: string;
  background: string;
  level: number;
  class: string;
  subclass: string;
  stats: Stats;
  spells?: CharacterSpells;
  skills?: CharacterSkills;
  Features: Feature<string, string>[];
}
const exampleCharacters: Character[] = [
  {
    name: "Gandalf",
    level: 1,
    class: "Wizard",
    race: "Elf",
    subrace: "High Elf",
    background: "Noble",
    subclass: "Evocation",
    stats: {
      str: 8,
      dex: 14,
      con: 12,
      int: 15,
      wis: 13,
      cha: 10,
    },
    spells: {
      spellsKnown: ["Fireball", "Mage Armor", "Magic Missile", "Shield"],
      spellsPrepared: ["Fireball", "Shield", "Magic Missile"],
      alwaysPrepared: [],
    },
    skills: {
      proficient: ["Arcana", "History"],
      expertise: ["Arcana"],
    },
    Features: [],
  },
  {
    name: "Jorden",
    level: 1,
    class: "Fighter",
    race: "Dwarf",
    subrace: "Hill Dwarf",
    background: "Soldier",
    subclass: "Champion",
    stats: {
      str: 12,
      dex: 15,
      con: 14,
      int: 10,
      wis: 13,
      cha: 8,
    },
    skills: {
      proficient: ["Athletics", "Survival"],
      expertise: ["Athletics"],
    },
    Features: [],
  },
];
const [characters, setCharacters] =
  createSignal<Character[]>(exampleCharacters);

export default function useCharacters(): [
  Accessor<Character[]>,
  Setter<Character[]>
  ] {
  return [characters, setCharacters];
}
