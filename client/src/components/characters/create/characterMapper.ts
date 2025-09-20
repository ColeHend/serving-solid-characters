import { CharacterForm, Character, CharacterSpell } from "../../../models/character.model";

export function toCharacter5e(form: CharacterForm,formSpells: string[]) {

    // create features map


    // create spells map
    const spells: CharacterSpell[] = [];

    if (formSpells.length > 0) {
        formSpells.forEach(formSpell => spells.push({
            name: formSpell.trim(),
            prepared: false
        }))
    }

    // create race map


    // everthing else...


    const payload = createExampleCharacter({
        name: form.name.trim(),
        level: 0,
        levels: [
            {
            class: "Wizard",
            subclass: "Evocation",
            level: 1,
            hitDie: 6,
            features: [
                {
                name: "Spellcasting",
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
                name: "Arcane Recovery",
                description: "You can recover some spell slots during a short rest.",
                metadata: {
                    category: "Class",
                },
                },
            ],
            },
        ],
        spells: spells,
        race: {
            species: "elf",
            subrace: "woodElf",
            age: "200",
            size: "Medium",
            speed: "30ft",
            features: [
            {
                name: "Darkvision",
                description:
                "You can see in dim light within 60 feet as if it were bright light.",
                metadata: {},
            },
            ],
        },
        className: form.className.trim(),
        subclass: form.subclass.trim(),
        background: form.background.trim(),
        alignment: form.alignment,
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
        languages: [
            "Common", 
            "elvish", 
            "draconic"
        ],
        health: {
            max: 1,
            current: 1,
            temp: 10,
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
        },
    });

    return payload;
}

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

  return newCharacter;
}

