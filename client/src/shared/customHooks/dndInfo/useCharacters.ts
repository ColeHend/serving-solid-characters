import { Accessor, Setter, createSignal } from "solid-js";
import { Character } from "../../../models/character.model";

export interface Stats {
  str: number;
  dex: number;
  con: number;
  int: number;
  wis: number;
  cha: number;
}
const exampleCharacters: Character[] = [];

function createExampleCharacter(character: Character) {
  const newCharacter = new Character();

  newCharacter.name = character.name;
  newCharacter.levels = character.levels;
  newCharacter.spells = character.spells;
  newCharacter.race = character.race;
  newCharacter.className = character.className;
  newCharacter.subclass = character.subclass;
  newCharacter.background = character.background;
  newCharacter.alignment = character.alignment;
  newCharacter.proficiencies = character.proficiencies;
  newCharacter.languages = character.languages;
  newCharacter.health = character.health;
  newCharacter.stats = character.stats;
  newCharacter.items = character.items;

  exampleCharacters.push(newCharacter);
}

const Gandalf = createExampleCharacter({
  name: "Gandalf",
  level: 0,
  levels: [
    {
      class: "Wizard",
      subclass: "Evocation",
      level: 1,
      hitDie: 6,
      features: []
    },
    {
      class: "Wizard",
      subclass: "Evocation",
      level: 1,
      hitDie: 6,
      features: []
    }
  ],
  spells: [],
  race: {
    species: "elf",
    features: []
  },
  className: "Wizard",
  subclass: "Evocation",
  background: "Noble",
  alignment: "neutral",
  proficiencies: {
    skills: {
      "Acrobatics": {
        stat: "dex",
        value: 0,
        proficient: false,
        expertise: false,
      },
      "Animal Handling": {
        stat: "wis",
        value: 0,
        proficient: false,
        expertise: false,
      },
      "Arcana": {
        stat: "int",
        value: 10,
        proficient: true,
        expertise: true
      },
      "History": {
        stat: "int",
        value: 10,
        proficient: true,
        expertise: true  
      },
      "Athletics": {
        stat: "str",
        value: 0,
        proficient: false,
        expertise: false,
      },
      "Deception": {
        stat: "cha",
        value: 0,
        proficient: false,
        expertise: false,
      },
      "Insight": {
        stat: "wis",
        value: 0,
        proficient: false,
        expertise: false,
      },
      "Intimidation": {
        stat: "cha",
        value: 0,
        proficient: false,
        expertise: false,
      },
      "Investigation": {
        stat: "int",
        value: 0,
        proficient: false,
        expertise: false,
      },
      "Medicine": {
        stat: "wis",
        value: 0,
        proficient: false,
        expertise: false,
      },
      "Nature": {
        stat: "int",
        value: 0,
        proficient: false,
        expertise: false,
      },
      "Perception": {
        stat: "wis",
        value: 0,
        proficient: false,
        expertise: false,
      },
      "Performance": {
        stat: "cha",
        value: 0,
        proficient: false,
        expertise: false,
      },
      "Persuasion": {
        stat: "cha",
        value: 0,
        proficient: false,
        expertise: false,
      },
      "Religion": {
        stat: "int",
        value: 0,
        proficient: false,
        expertise: false,
      },
      "Sleight Of Hand": {
        stat: "dex",
        value: 0,
        proficient: false,
        expertise: false,
      },
      "Stealth": {
        stat: "dex",
        value: 0,
        proficient: false,
        expertise: false,
      },
      "Survival": {
        stat: "wis",
        value: 0,
        proficient: false,
        expertise: false,
      },
    },
    other: {}
  },
  languages: [
    "Common",
    "elvish",
    "draconic"
  ],
  health: {
    max: 1,
    current: 1,
    temp: 10
  },
  stats: {
    str: 8,
    dex: 14,
    con: 12,
    int: 15,
    wis: 13,
    cha: 10,
  },
  items: {
    inventory: [],
    equipped: [],
    attuned: []
  }
  
})

const [characters, setCharacters] =
  createSignal<Character[]>(exampleCharacters);

export default function useCharacters(): [
  Accessor<Character[]>,
  Setter<Character[]>
  ] {
  return [characters, setCharacters];
}
