import { addSnackbar } from "coles-solid-library";
import { Spell } from "../../../../models/generated";
import { CharacterSpell } from "../../../../models/character.model";
import characterManager from "../../dndInfo/useCharacters";

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

    characterManager.updateCharacter({
      name: character.name,
      level: character.level,
      levels: character.levels,
      spells: newSpellArr,
      race: character.race,
      className: character.className,
      subclass: character.subclass,
      vulnerabilities: character.vulnerabilities,
      savingThrows: character.savingThrows,
      resistances: character.resistances,
      immunities: character.immunities,
      features: character.features,
      ArmorClass: character.ArmorClass,
      Speed: character.Speed,      
      background: character.background,
      alignment: character.alignment,
      proficiencies: character.proficiencies,
      languages: character.languages,
      health: character.health,
      stats: character.stats,
      items: character.items,
    });
    return;
  } else {
    addSnackbar({
      message: `Couldn't find ${charName}`,
      severity: "error",
    });
    return;
  }
};
