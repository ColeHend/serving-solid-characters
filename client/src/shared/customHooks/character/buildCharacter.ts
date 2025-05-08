import { Item, ItemType } from "../../../models/data/items";
import { Character,  CharacterEquipItems, Stat } from "./character.model";

export type Operation = "util.add" | "util.set" | "util.remove" | "util.advantage" | "util.disadvantage" | "util.replace.sameTarget" | "util.resist" | string;
export interface Modifier {
  operation: Operation;
  target: string;
  value: any;
  condition?: string[];  // Conditions under which this modifier applies (e.g., ["WhileRaging"])
}

function resolveTarget(character: Character, target: string) {
  // Remove leading "char." if present
  if (target.startsWith("char.")) {
    target = target.slice(5);
  }
  // Split by dots for nested properties
  const parts = target.split(".");
  let ref: any = character;
  for (const part of parts) {
    if (!part) continue;
    // If part contains ":", it indicates a dynamic key (e.g., "stat:STR" or "slots:1")
    if (part.includes(":")) {
      const [objKey, keyName] = part.split(":");
      // Navigate into the object by objKey, then by keyName
      ref = ref[objKey as keyof typeof ref];
      // If the keyName is numeric (like slots:1), use it as number index/key
      const dynamicKey: any = isNaN(Number(keyName)) ? keyName : Number(keyName);
      ref = ref[dynamicKey];
    } else {
      // Static property
      ref = ref[part as keyof typeof ref];
    }
    if (ref === undefined) break;  // in case of invalid path, break out
  }
  return ref;
}

// Helper to apply a single modifier to the character (for immediate effects)
export function applyModifier(character: Character, mod: Modifier) {
  const { operation, target, value } = mod;
  // Resolve the target reference in the character object
  const targetRef = resolveTarget(character, target);
  if (targetRef === undefined) {
    console.warn(`Invalid target path: ${target}`);
    return;
  }
  switch (operation) {
    case "util.add":
      if (typeof targetRef === "number") {
        // Simple numeric addition
        (function updateNumber() {
          // We need to find the parent object and key of targetRef to assign new value
          // Since resolveTarget returns the value, we must re-resolve up to parent.
          const parts = target.split(".");
          const lastPart = parts.pop()!;
          const parentRef = resolveTarget(character, parts.join("."));
          if (parentRef && typeof parentRef === "object") {
            if (parentRef[lastPart] === undefined) {
              console.warn(`Cannot apply add: target ${target} not found on character`);
            } else if (typeof parentRef[lastPart] === "number") {
              parentRef[lastPart] += value;
            } else {
              // If target is an array or other type, handle accordingly (e.g., HP might be an object).
              parentRef[lastPart] = (parentRef[lastPart] as any) + value;
            }
          }
        })();
      } else {
        // If target is not a plain number (could be an array like slots or a complex object), handle if needed.
        // Example: adding a spell slot could mean incrementing the slot count.
        // We'll handle known structures:
        if (Array.isArray(targetRef)) {
          // e.g., if targetRef is an array (though most char properties aren't arrays except maybe slot levels which we treat as object)$had0w$had3
          
          targetRef.push(value);
        } else {
          console.warn(`util.add: Unsupported target type for ${target}`);
        }
      }
      break;
    case "util.set":
      (function setValue() {
        const parts = target.split(".");
        const propName = parts.pop()!;
        const parentRef = resolveTarget(character, parts.join("."));
        if (parentRef && typeof parentRef === "object") {
          // For certain stats like ability scores, ensure we don't lower a value if set is meant to cap (e.g., belts)
          if (typeof parentRef[propName] === "number") {
            // If value is numeric or same type, set it
            parentRef[propName] = value;
          } else {
            parentRef[propName] = value;
          }
        }
      })();
      break;
    case "util.disadvantage":
      if (character.advantageOn[target] === true) {
        character.advantageOn = { [target]: null } 
      } else {
        character.advantageOn = { [target]: false } 
      }
      console.log(`Tagged ${operation} on ${target} (value: ${value || ""})`);
    break;
    case "util.advantage":
      if (character.advantageOn[target] === false) {
        character.advantageOn = { [target]: null }
      } else {
        character.advantageOn = { [target]: true }
      }
      console.log(`Tagged ${operation} on ${target} (value: ${value || ""})`);
      break;
    case "util.resist":
      // Similar to advantage; mark resistance to a damage type.
      // The target might be a damage type or category. We could collect in character.resistances.
      if (!(character.resist)) {
        character.resist = [];
      }
      character.resist.push(value);  // assuming value holds damage type string
      console.log(`Added resistance to ${value}`);
      break;
    // Other operations like util.remove, util.replace, etc. can be implemented as needed.
    default:
      console.warn(`Unsupported operation: ${operation}`);
      break;
  }
}
