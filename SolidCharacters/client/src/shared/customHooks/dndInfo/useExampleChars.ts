import { createSignal, Accessor, Setter } from "solid-js";
import { Character } from "../../../models/character.model";
import { Clone } from "../utility/tools/Tools";


function createExampleCharacter(character: Character) {
  return Clone(character);
}

const Gandalf = createExampleCharacter({
  name: "Gandalf the Grey",
  level: 2,
  levels: [
    {
      class: "Wizard",
      subclass: "Evocation",
      level: 1,
      hitDie: 6,
      features: [
        {
          id: "as12vcr32zxyerwqtxcvd3",
          name: "Spellcastsing",
          description: "You can cast wizard spells using your spellbook.",
          metadata: {
            category: "Class",
          },
        },
      ],
    },
    {
      class: "Wizard",
      subclass: "Evocation",
      level: 2,
      hitDie: 6,
      features: [
        {
          id: "mnvw43avcb230796cv120azx1",
          name: "Arcane Recovery",
          description: "You can recover some spell slots during a short rest.",
          metadata: {
            category: "Class",
          },
        },
      ],
    },
  ],
  spells: [
    { name: "Fire Bolt", prepared: true },
    { name: "Mage Hand", prepared: true },
    { name: "Magic Missile", prepared: true },
    { name: "Shield", prepared: true },
    { name: "Mage Armor", prepared: false },
    { name: "Detect Magic", prepared: false },
  ],
  race: {
    species: "elf",
    subrace: "woodElf",
    age: "200",
    size: "Medium",
    speed: "30ft",
    features: [
      {
        id: "testRaceFeature1",
        name: "Darkvision",
        description:
          "You can see in dim light within 60 feet as if it were bright light.",
        metadata: {},
      },
    ],
  },
  className: "Wizard",
  subclass: ["Evocation"],
  ArmorClass: 12,
  Speed: 30,
  resistances: [
     {
      type: "fire",
      value: true
    }
  ],
  immunities: [
     {
      type: "fire",
      value: true
    }
  ],
  vulnerabilities: [
    {
      type: "fire",
      value: true
    }
  ],
  features: [
    {
      id: "astasedt",
      name: "",
      description: "",
      metadata: {
        mads: []
      }
    }
  ],
  savingThrows: [
    { stat: "int", proficient: true },
    { stat: "wis", proficient: true },
  ],
  background: "Noble",
  alignment: "neutral",
  proficiencies: {
    skills: {
      Acrobatics: {
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
      Arcana: {
        stat: "int",
        value: 10,
        proficient: true,
        expertise: true,
      },
      History: {
        stat: "int",
        value: 10,
        proficient: true,
        expertise: true,
      },
      Athletics: {
        stat: "str",
        value: 0,
        proficient: false,
        expertise: false,
      },
      Deception: {
        stat: "cha",
        value: 0,
        proficient: false,
        expertise: false,
      },
      Insight: {
        stat: "wis",
        value: 0,
        proficient: false,
        expertise: false,
      },
      Intimidation: {
        stat: "cha",
        value: 0,
        proficient: false,
        expertise: false,
      },
      Investigation: {
        stat: "int",
        value: 0,
        proficient: false,
        expertise: false,
      },
      Medicine: {
        stat: "wis",
        value: 0,
        proficient: false,
        expertise: false,
      },
      Nature: {
        stat: "int",
        value: 0,
        proficient: false,
        expertise: false,
      },
      Perception: {
        stat: "wis",
        value: 0,
        proficient: false,
        expertise: false,
      },
      Performance: {
        stat: "cha",
        value: 0,
        proficient: false,
        expertise: false,
      },
      Persuasion: {
        stat: "cha",
        value: 0,
        proficient: false,
        expertise: false,
      },
      Religion: {
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
      Stealth: {
        stat: "dex",
        value: 0,
        proficient: false,
        expertise: false,
      },
      Survival: {
        stat: "wis",
        value: 0,
        proficient: false,
        expertise: false,
      },
    },
    other: {},
  },
  languages: ["Common", "elvish", "draconic"],
  health: {
    max: 14,
    current: 11,
    temp: 5,
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
    inventory: [
      "Spellbook",
      "Quarterstaff",
      "Component Pouch",
      "Explorer's Pack",
    ],
    equipped: ["Quarterstaff", "Spellbook"],
    attuned: ["Ring of Protection"],
    currency: {
      platinumPieces: 0,
      goldPieces: 0,
      electrumPieces: 0,
      sliverPieces: 0,
      copperPieces: 0
    }
  },
});

/**
 * A fully-populated sample character used as a fallback in the PDF sheet editor
 * (`/characters/pdfCreate`) when the user has no saved characters yet, so every
 * placed field renders visible sample text for testing placements.
 */
export const EXAMPLE_CHARACTER: Character = Gandalf;

const [characters, setCharacters] =
  createSignal<Character[]>([EXAMPLE_CHARACTER]);

export default function useCharacters(): [
  Accessor<Character[]>,
  Setter<Character[]>
] {
  return [characters, setCharacters];
}
