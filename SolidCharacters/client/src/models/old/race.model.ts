import { Choice, Feature } from "./core.model";

export interface Race {
    id: string;
    name: string;
    speed: number;
    age: string;
    alignment: string;
    size: string;
    sizeDescription: string;
    languages: string[];
    languageChoice: Choice<string>;
    languageDesc: string;
    traits: Feature<string[], string>[];
    traitChoice: Choice<Feature<string[], string>>;
    startingProficencies: Feature<string, string>[];
    startingProficiencyChoices: Choice<Feature<string, string>>;
    abilityBonuses: Feature<number, string>[];
    abilityBonusChoice: Choice<Feature<number, string>>;
    subRaces: Subrace[];
}

export interface Subrace {
    id: string;
    name: string;
    desc: string;
    traits: Feature<string[], string>[];
    traitChoice: Choice<Feature<string[], string>>;
    abilityBonuses: Feature<number, string>[];
    abilityBonusChoice: Choice<Feature<number, string>>;
    age: string;
    alignment: string;
    size: string;
    sizeDescription: string;
    languages: string[];
    languageChoice: Choice<string>;
    startingProficencies?: Array<Feature<string, string>> ;
    startingProficiencyChoices: Choice<Feature<string, string>>;
}