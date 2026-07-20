import { addSnackbar } from "coles-solid-library";
import { Spell } from "../../../../models/generated";
import { CharacterSpell } from "../../../../models/character.model";
import characterManager from "../../dndInfo/useCharacters";
import { Clone } from "./Tools";

export const AddSpell = (spell: Spell, charId: string) => {
  const newSpell: CharacterSpell = {
    name: spell.name,
    prepared: false,
    id: spell.id || undefined,
  };
  const character = characterManager.getCharacter(charId);

  if (character) {
    addSnackbar({
      message: `Adding Spell to ${character.name}`,
      severity: "info",
    });
    const newSpellArr = [...character.spells, newSpell];

    addSnackbar({
      message: `Added ${spell.name} sucsessfully`,
      severity: "info",
    });

    const updated = Clone(character);
    updated.spells = newSpellArr;
    characterManager.updateCharacter(updated);
    return;
  } else {
    addSnackbar({
      message: `Couldn't find that character`,
      severity: "error",
    });
    return;
  }
};
