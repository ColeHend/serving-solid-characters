import { Component, For, createMemo, createSignal } from "solid-js";
import useStyle from "../../../customHooks/utility/style/styleHook";
import styles from "./view.module.scss";
import useCharacters, { Character, Stats } from "../../../customHooks/dndInfo/useCharacters";
import useDnDBackgrounds from "../../../customHooks/dndInfo/srdinfo/useDnDBackgrounds";
import useDnDClasses from "../../../customHooks/dndInfo/srdinfo/useDnDClasses";
import useDnDFeats from "../../../customHooks/dndInfo/srdinfo/useDnDFeats";
import useDnDItems from "../../../customHooks/dndInfo/srdinfo/useDnDItems";
import useDnDRaces from "../../../customHooks/dndInfo/srdinfo/useDnDRaces";
import useDnDSpells from "../../../customHooks/dndInfo/srdinfo/useDnDSpells";
import StatBlock from "./stat-bar/stat/stat";
import StatBar from "./stat-bar/statBar";


const CharacterView: Component = () => {
    const stylin = useStyle();
    const [characters, setCharacters] = useCharacters();
    const [currentCharacter, setCurrentCharacter] = createSignal<Character>(characters()[0]);
    const dndSrdClasses = useDnDClasses();
    const dndSrdSpells = useDnDSpells();
    const dndSrdFeats = useDnDFeats();
    const dndSrdRaces = useDnDRaces();
    const dndSrdItems = useDnDItems();
    const dndSrdBackgrounds = useDnDBackgrounds();
    const getStatMod = (stat: number) => Math.floor((stat - 10)/2);
    const getProficiencyBonus = (level: number) => Math.ceil(level/4) + 1;
    const fullStats = createMemo(()=>{
        const race = dndSrdRaces().filter(x => x.name.toLowerCase() === currentCharacter().race.toLowerCase())[0];
        
        let fullStats: Stats = {
            str: currentCharacter().stats.str,
            dex: currentCharacter().stats.dex,
            con: currentCharacter().stats.con,
            int: currentCharacter().stats.int,
            wis: currentCharacter().stats.wis,
            cha: currentCharacter().stats.cha,
        };
        if (!!race && race.abilityBonuses.length > 0) {
            race.abilityBonuses.forEach((bonus) => {
                Object.keys(fullStats).forEach((key) => {
                    if (bonus.name.toLowerCase() === key) {
                        fullStats[key as keyof Stats] += bonus.value;
                    }
                });
            });
        }
        
        const subrace = race.subRaces?.filter(x => x.name.toLowerCase() === currentCharacter().subrace?.toLowerCase())[0];
        if (!!subrace) {
            subrace.abilityBonuses.forEach((bonus) => {
                Object.keys(fullStats).forEach((key) => {
                    if (bonus.name.toLowerCase() === key) {
                        fullStats[key as keyof Stats] += bonus.value;
                    }
                });
            });
            
        }

        return fullStats;
    });
    return (
        <div class={`${stylin.accent} ${styles.mainBody}`}>
            <h1>Characters View</h1>
            <div>
                <div>
                    <select onChange={(e)=>setCurrentCharacter(()=>JSON.parse(e.target.value))}>
                        <For each={characters()}>{(character) => (
                            <option value={JSON.stringify(character)}>{character.name}</option>
                        )}</For>
                    </select>
                </div>
                <div>
                    <div>
                        <h2>Stats</h2>
                        <StatBar fullStats={fullStats} currentCharacter={currentCharacter}/>
                    </div>
                </div>
            </div>
        </div>
    )
};

export default CharacterView;