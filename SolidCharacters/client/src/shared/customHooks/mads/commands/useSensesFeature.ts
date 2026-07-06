import { Character, SenseKey } from "../../../../models/character.model";
import { MadFeature } from "../madModels";
import { DebugConsole } from "../../DebugConsole";

const SENSE_KEYS: readonly SenseKey[] = ["darkvision", "blindsight", "tremorsense", "truesight"];

const parseSense = (feature: MadFeature): SenseKey | null => {
    const sense = feature.value?.["sense"]?.trim().toLowerCase() ?? "";
    return (SENSE_KEYS as readonly string[]).includes(sense) ? (sense as SenseKey) : null;
};

const addSensesFeature = (character: Character, feature: MadFeature): Character => {
    const sense = parseSense(feature);
    const range = +(feature.value?.["range"] ?? "");

    if (!sense || isNaN(range) || range <= 0) {
        DebugConsole.error("Invalid or missing sense/range for AddSenses command");
        return character;
    }

    // old DB rows predate this field; overlapping grants keep the longest range
    character.senses = character.senses ?? {};
    character.senses[sense] = Math.max(character.senses[sense] ?? 0, range);

    return character;
};

const removeSensesFeature = (character: Character, feature: MadFeature): Character => {
    const sense = parseSense(feature);

    if (!sense) {
        DebugConsole.error("Invalid or missing sense for RemoveSenses command");
        return character;
    }

    if (character.senses) {
        delete character.senses[sense];
    }

    return character;
};

export { addSensesFeature, removeSensesFeature };
