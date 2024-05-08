import type { Choice, Feature, Item } from "./core.model";

export interface Background {
    Name:                     string;
    StartingProficiencies:    Feature<string, string>[];
    LanguageChoice:           Choice<string>;
    StartingEquipment:        Item[];
    StartingEquipmentChoices: Choice<Item>[];
    Feature:                  Feature<string[], string>[];
}
