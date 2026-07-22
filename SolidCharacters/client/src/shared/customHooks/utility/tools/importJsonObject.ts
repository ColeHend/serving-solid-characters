import { Trade } from "../../../../models/trade.model";
import {addSnackbar} from "coles-solid-library";
import homebrewManager from "../../homebrewManager";
import characterManager from "../../dndInfo/useCharacters";
import { srdItem } from "../../../../models/data/generated";

export function importJsonObject(data: Trade) {
  addSnackbar({
    severity:"info",
    message:"running"
  })
  if (data.spells.length > 0) {
    addSnackbar({
      severity:"info",
      message:`Importing ${data.spells.length} Spells`,
      closeTimeout: 4000,
    })
    data.spells.forEach(spell => homebrewManager.addSpell(spell));
  }
    
  if (data.feats.length > 0) {
    addSnackbar({
      severity:"info",
      message:`Importing ${data.feats.length} Feats`,
      closeTimeout: 4000,
    })
    data.feats.forEach(feat => homebrewManager.addFeat(feat));
  }

  if (data.backgrounds.length > 0) {
    addSnackbar({
      severity:"info",
      message:`Importing ${data.backgrounds.length} Backgrounds`,
      closeTimeout: 4000,
    })
    data.backgrounds.forEach(background => homebrewManager.addBackground(background));
  }

  if (data.items.length > 0) {
    addSnackbar({
      severity:"info",
      message:`Importing ${data.items.length} Items`,
      closeTimeout: 4000,
    })
    data.items.forEach(item => homebrewManager.addItem(item as srdItem));
  }

  if (data.races.length > 0) {
    addSnackbar({
      severity:"info",
      message:`Importing ${data.races.length} Race`,
      closeTimeout: 4000,
    })
    data.races.forEach(race => homebrewManager.addRace(race));
  }

  if (data.subraces.length > 0) {
    addSnackbar({
      severity: "info",
      message: `Importing ${data.subraces.length} Subraces`
    })
    data.subraces.forEach(subrace => homebrewManager.saveSubrace(subrace))
  }

  if (data.srdclasses.length > 0) {
    addSnackbar({
      severity:"info",
      message:`Importing ${data.srdclasses.length} Classes`,
      closeTimeout:4000,
    })
    data.srdclasses.forEach(srdClass => homebrewManager.addClass(srdClass));
  }

  if (data.srdSubclasses.length > 0) {
    addSnackbar({
      severity: "info",
      message: `Importing ${data.srdSubclasses.length} subclasses`
    })
    data.srdSubclasses.forEach(subclass => homebrewManager.addSubclass(subclass));
  }
    
  if (data.characters.length > 0) {
    addSnackbar({
        severity:"info",
        message:`Importing ${data.characters.length} Characters`,
        closeTimeout:4000,
    })
    data.characters.forEach(character => characterManager.createCharacter(character));
  }
    

}

