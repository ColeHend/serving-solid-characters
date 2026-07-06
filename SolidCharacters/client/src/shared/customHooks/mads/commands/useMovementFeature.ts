import { Character, MovementSpeedKey, MovementType } from "../../../../models/character.model";
import { MadFeature } from "../madModels";
import { DebugConsole } from "../../DebugConsole";

/** value.movementType → MovementType enum entry. */
const MOVEMENT_TYPES: Record<string, MovementType> = {
    walk: MovementType.Walk,
    fly: MovementType.Fly,
    swim: MovementType.Swim,
    climb: MovementType.Climb,
    burrow: MovementType.Burrow,
};

/** Canonical lowercase name for a MovementType ("fly", "swim", ...) — movementSpeeds key + labels. */
const movementTypeName = (type: MovementType): string =>
    Object.keys(MOVEMENT_TYPES).find(k => MOVEMENT_TYPES[k] === type) ?? "";

const parseMovementType = (feature: MadFeature): { name: string; type: MovementType } | null => {
    const name = feature.value?.["movementType"]?.trim().toLowerCase() ?? "";
    const type = MOVEMENT_TYPES[name];
    return type === undefined ? null : { name, type };
};

const addMovementFeature = (character: Character, feature: MadFeature): Character => {
    const parsed = parseMovementType(feature);

    if (!parsed) {
        DebugConsole.error("Invalid or missing movementType for AddMovement command");
        return character;
    }

    // old DB rows predate these fields
    character.movementTypes = character.movementTypes ?? [MovementType.Walk];

    if (!character.movementTypes.includes(parsed.type)) {
        character.movementTypes.push(parsed.type);
    }

    // An explicit speed is stored per mode; a mode without one moves at the walking Speed.
    // Walking speed itself lives on character.Speed (the Speed command), never in movementSpeeds.
    const speed = +(feature.value?.["speed"] ?? "");
    if (parsed.type !== MovementType.Walk && feature.value?.["speed"] && !isNaN(speed)) {
        character.movementSpeeds = character.movementSpeeds ?? {};
        const key = parsed.name as MovementSpeedKey;
        // overlapping grants keep the best speed
        character.movementSpeeds[key] = Math.max(character.movementSpeeds[key] ?? 0, speed);
    }

    return character;
};

const removeMovementFeature = (character: Character, feature: MadFeature): Character => {
    const parsed = parseMovementType(feature);

    if (!parsed) {
        DebugConsole.error("Invalid or missing movementType for RemoveMovement command");
        return character;
    }

    character.movementTypes = (character.movementTypes ?? []).filter(t => t !== parsed.type);
    if (character.movementSpeeds) {
        delete character.movementSpeeds[parsed.name as MovementSpeedKey];
    }

    return character;
};

export { addMovementFeature, removeMovementFeature, movementTypeName };
