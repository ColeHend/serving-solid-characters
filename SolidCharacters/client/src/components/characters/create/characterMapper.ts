import { Accessor, createMemo, Setter } from "solid-js";
import { CharacterForm, Character, CharacterSpell, CharacterLevel, CharacterRace } from "../../../models/character.model";
import { useDnDClasses } from "../../../shared/customHooks/dndInfo/info/all/classes";
import { Class5E, FeatureDetail, Race } from "../../../models/generated";
import { charClasses } from "./classesSection/classesSection";
import { Background } from "../../../models";
import { group } from "console";
import { useDnDFeats } from "../../../shared/customHooks/dndInfo/info/all/feats";

type stats = {
    str: number;
    dex: number;
    con: number;
    int: number;
    wis: number;
    cha: number;
}

export function toCharacter5e(form: CharacterForm,charClasses: Accessor<string[]>, classLevel: [Accessor<Record<string, number>>,Setter<Record<string, number>>],currRace:Accessor<Race>,stats: stats,knownSpells: Accessor<string[]>,inventory: Accessor<string[]>, equipped: Accessor<string[]>, attuned: Accessor<string[]>) {
    const feats = useDnDFeats();

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

    const getFeature = (name: string) => {
        if (name.toLowerCase().includes("magic initiate")) {
            name = "Magic Initiate"
        }

        return feats().find(f => f.details.name === name);
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

    charLevels[0].features.push()
    
    // create race map
    const race: CharacterRace = {
        species: currRace().name,
        age: "",
        size: currRace().size,
        speed: `${currRace().speed}ft`,
        features: currRace().traits.flatMap(t => t.details),
    }

    // spell map

    const spells:CharacterSpell[] = knownSpells().map((spell) => {
        return {name: spell, prepared: false};
    })

    // features that arnt class features or race features, consistingo of primarly feats and other choseen feats and features.

    const features:FeatureDetail[] = [];

    features.push({
        name: form.BackgrndFeat,
        description: getFeature(form.BackgrndFeat)?.details.description ?? ""
    })

    

    const payload = createCharacter({
        name: form.name.trim(),
        level: charLevels.length,
        levels: charLevels,
        spells: spells,
        race: race,
        className: form.className.trim(),
        subclass: form.subclass,
        background: form.background.trim(),
        alignment: form.alignment,
        features: features,
        vulnerabilities: [],
        savingThrows: [],
        resistances: [],
        immunities: [],
        ArmorClass: 0,
        Speed: 0,
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
            max: form.maxHP,
            current: form.currentHP,
            temp: form.tempHP,
        },
        stats: {
            str: stats.str,
            dex: stats.dex,
            con: stats.con,
            int: stats.int,
            wis: stats.wis,
            cha: stats.cha,
        },
        items: {
            inventory: inventory(),
            currency: {
                platinumPieces: form.PP,
                goldPieces: form.GP,
                electrumPieces: form.EP,
                sliverPieces: form.SP,
                copperPieces: form.CP,
            },
            equipped: equipped(),
            attuned: attuned(),
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

