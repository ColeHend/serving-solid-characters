export interface DnDClass {
    name: string;
    hitDie: number;
    proficiencyChoices: string[];
    proficiencies: string[];
    savingThrows: string[];
    startingEquipment: string[];
    classLevels: LevelUp[];
    features: ({ [name: string]: string })[];
    subclasses: Subclass[];
    skills: Skills;
    invocations?: Invocation[];
}
export interface LevelUp {
    level: number;
    proficiency_bonus: number;
    features: string;
    spellcasting?: {
        spellsKnown: number;
        spellSlotsLevel1?: string;
        spellSlotsLevel2?: string;
        spellSlotsLevel3?: string;
        spellSlotsLevel4?: string;
        spellSlotsLevel5?: string;
        spellSlotsLevel6?: string;
        spellSlotsLevel7?: string;
        spellSlotsLevel8?: string;
        spellSlotsLevel9?: string;
        cantripsKnown: number;
        slotLevel?: string;

        invocationsKnown?: string;
    };
    other: {
        [key: string]: any;
    };
}
export interface Subclass {
    name: string;
    description: string[];
    features: ({ [name: string]: string[] })[];
}
export interface Invocation {
    name: string;
    desc: string[] | string;
    level: number;
    pact?: string;
}
export interface Skills {
    amount: number;
    skillsSkills: string[];
}