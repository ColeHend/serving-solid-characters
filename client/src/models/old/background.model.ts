import { Item } from "../../shared";
import type { Choice, Feature } from "./core.model";

export interface Background {
    name:                     string;
		desc:										 	string;
    startingProficiencies:    Feature<string, string>[];
    languageChoice:           Choice<string>;
    startingEquipment:        Item[];
    startingEquipmentChoices: Choice<Item>[];
    feature:                  Feature<string[], string>[];
}
