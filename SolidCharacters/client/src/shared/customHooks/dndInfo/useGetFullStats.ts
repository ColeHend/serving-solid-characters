import { Accessor, createMemo } from "solid-js";
import { Stats } from "./useCharacters";
import { Character } from "../../../models/character.model";
import { useDnDSpells } from "./info/all/spells";
import { useDnDRaces } from "./info/all/races";
import { AbilityScores } from "../../../models/generated";

const useExportFullStats = (currentCharacter: Accessor<Character>) => {
  
  const fullStats = createMemo(() => {

    const dndSrdRaces = useDnDRaces();


    const race = dndSrdRaces().filter(
      (x) => x.name.toLowerCase() === currentCharacter()?.race.species.toLowerCase()
    )[0];
    const fullStats: Stats = {
      str: currentCharacter()?.stats.str,
      dex: currentCharacter()?.stats.dex,
      con: currentCharacter()?.stats.con,
      int: currentCharacter()?.stats.int,
      wis: currentCharacter()?.stats.wis,
      cha: currentCharacter()?.stats.cha,
    };

    // Characters saved by the rebuilt creator store final scores (statsInclusive) —
    // re-adding race bonuses here would double-count them.
    if (currentCharacter()?.statsInclusive) return fullStats;

    if (!!race && race.abilityBonuses.length > 0) {
      race.abilityBonuses.forEach((bonus) => {
        Object.keys(fullStats).forEach((key) => {
          if (AbilityScores[bonus.stat].toLowerCase() === key) {
            fullStats[key as keyof Stats] += bonus.value;
          }
        });
      });

      // const subrace = race.subRaces?.filter(
      //   (x) => x.name.toLowerCase() === currentCharacter()?.subrace?.toLowerCase()
      // )[0];
  
      // if (subrace) {
      //   subrace.abilityBonuses.forEach((bonus) => {
      //     Object.keys(fullStats).forEach((key) => {
      //       if (bonus.name.toLowerCase() === key) {
      //         fullStats[key as keyof Stats] += bonus.value;
      //       }
      //     });
      //   });
      // }
    }


    return fullStats;
  });

  return fullStats;
};

export default useExportFullStats;