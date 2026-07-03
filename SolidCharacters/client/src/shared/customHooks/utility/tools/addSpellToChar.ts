import { addSnackbar } from "coles-solid-library";
import { Spell } from "../../../../models/generated";
import { CharacterSpell } from "../../../../models/character.model";
import characterManager from "../../dndInfo/useCharacters";
import { Clone } from "./Tools";

export const AddSpell = (spell: Spell, charName: string) => {
  addSnackbar({
    message: `Adding Spell to ${charName}`,
    severity: "info",
  });
  const newSpell: CharacterSpell = {
    name: spell.name,
    prepared: false,
  };
  const character = characterManager.getCharacter(charName);

  console.log("new spell", newSpell);
  
  
  if (character) {
    const newSpellArr = [...character.spells, newSpell];

    console.log("new spell arr", newSpellArr);
    
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
      message: `Couldn't find ${charName}`,
      severity: "error",
    });
    return;
  }
};
