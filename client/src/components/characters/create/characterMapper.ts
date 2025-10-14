import { Accessor, createMemo, Setter } from "solid-js";
import { CharacterForm, Character, CharacterSpell, CharacterLevel, CharacterRace } from "../../../models/character.model";
import { useDnDClasses } from "../../../shared/customHooks/dndInfo/info/all/classes";
import { Class5E, Race } from "../../../models/data";
import { charClasses } from "./classesSection/classesSection";

export function toCharacter5e(form: CharacterForm,formSpells: string[],charClasses: Accessor<string[]>, classLevel: [Accessor<Record<string, number>>,Setter<Record<string, number>>],currRace:Accessor<Race>,currSubrace: Accessor<string>) {
    
    if (currSubrace() === "-"|| "") return new Character();

    const [classLevels,setClassLevels] = classLevel;
    const classes = useDnDClasses();

    const getCharacterLevel = (className: string): number => {
  
      return classLevels()[className] ?? 0;
    }
    const setCharacterLevel = (className: string, level: number): void => {
        setClassLevels(old => ({...old,[className]: level}));
    }
    const getClass = (className: string): Class5E => {
        return classes().find(c => c.name === className) ?? {} as Class5E;
    }
    const hitDieToNumber = (hitdie:string): number => {
        switch (hitdie) {
            case "d12":
                return 12;
            case "d10":
                return 10;
            case "d8":
                return 8;
            case "d6":
                return 6;

            default:
                return 0;
        }
    }

    // features map
    const charLevels: CharacterLevel[] = [];
    
    const fulllevel = createMemo(()=>{
        let toreturn = 0;
        charClasses().forEach(value => toreturn += getCharacterLevel(value));

        return toreturn
    })

    let level = 1;

    charClasses().forEach((charClass)=>{
        const class5e = getClass(charClass);
        

        for (let index = 1; index < fulllevel() - 1 && index < getCharacterLevel(charClass); index++) {
        charLevels.push({
            class: charClass,
            subclass: "",
            level: level,
            hitDie: hitDieToNumber(class5e.hitDie),
            features: [...class5e?.features?.[index] ?? []]
        })
        level += 1;
        
        }
    })

    // spells map
    const spells: CharacterSpell[] = [];

    if (formSpells.length > 0) {
        formSpells.forEach(formSpell => spells.push({
            name: formSpell.trim(),
            prepared: false
        }))
    }
    
    // create race map
    const race: CharacterRace = {
        species: currRace().name,
        subrace: currSubrace(),
        age: "",
        size: currRace().size,
        speed: `${currRace().speed}ft`,
        features: currRace().traits.flatMap(t => t.details),
    }

    // everthing else...


    const payload = createCharacter({
        name: form.name.trim(),
        level: charLevels.length,
        levels: charLevels,
        spells: spells,
        race: race,
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
            ...form.languages
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

function createCharacter(character: Character) {
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

