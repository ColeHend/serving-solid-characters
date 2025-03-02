import { Accessor, createMemo } from "solid-js";
import { Character, Stats } from "./useCharacters";
import useGetBackgrounds from "../data/useGetBackgrounds";
import useGetClasses from "../data/useGetClasses";
import useGetFeats from "../data/useGetFeats";
import useGetItems from "../data/useGetItems";
import useGetRaces from "../data/useGetRaces";
import useGetSpells from "../data/useGetSpells";

const useExportFullStats = (currentCharacter: Accessor<Character>) => {
  
  const fullStats = createMemo(() => {
    const dndSrdClasses = useGetClasses();
    const dndSrdSpells = useGetSpells();
    const dndSrdFeats = useGetFeats();
    const dndSrdRaces = useGetRaces();
    const dndSrdItems = useGetItems();
    const dndSrdBackgrounds = useGetBackgrounds();

    const race = dndSrdRaces().filter(
      (x) => x.name.toLowerCase() === currentCharacter()?.race.toLowerCase()
    )[0];
    const fullStats: Stats = {
      str: currentCharacter()?.stats.str,
      dex: currentCharacter()?.stats.dex,
      con: currentCharacter()?.stats.con,
      int: currentCharacter()?.stats.int,
      wis: currentCharacter()?.stats.wis,
      cha: currentCharacter()?.stats.cha,
    };
    
    if (!!race && race.abilityBonuses.length > 0) {
      race.abilityBonuses.forEach((bonus) => {
        Object.keys(fullStats).forEach((key) => {
          if (bonus.name.toLowerCase() === key) {
            fullStats[key as keyof Stats] += bonus.value;
          }
        });
      });

      const subrace = race.subRaces?.filter(
        (x) => x.name.toLowerCase() === currentCharacter()?.subrace?.toLowerCase()
      )[0];
  
      if (subrace) {
        subrace.abilityBonuses.forEach((bonus) => {
          Object.keys(fullStats).forEach((key) => {
            if (bonus.name.toLowerCase() === key) {
              fullStats[key as keyof Stats] += bonus.value;
            }
          });
        });
      }
    }


    return fullStats;
  });

  return fullStats;
};

export default useExportFullStats;