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
    // Guard every read: a character can be undefined mid-load, and older saves may omit stats.
    // Without `?? 0` these become undefined and every derived modifier turns into NaN.
    const stats = currentCharacter()?.stats;
    const fullStats: Stats = {
      str: stats?.str ?? 0,
      dex: stats?.dex ?? 0,
      con: stats?.con ?? 0,
      int: stats?.int ?? 0,
      wis: stats?.wis ?? 0,
      cha: stats?.cha ?? 0,
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