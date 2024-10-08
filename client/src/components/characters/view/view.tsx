import { Component, For, createMemo, createSignal } from "solid-js";
import useStyle from "../../../shared/customHooks/utility/style/styleHook";
import styles from "./view.module.scss";
import useCharacters, { Character, Stats } from "../../../shared/customHooks/dndInfo/useCharacters";
import StatBlock from "./stat-bar/stat/stat";
import StatBar from "./stat-bar/statBar";
import { useParams, useSearchParams } from "@solidjs/router";
import { effect } from "solid-js/web";
import useGetClasses from "../../../shared/customHooks/data/useGetClasses";
import useGetSpells from "../../../shared/customHooks/data/useGetSpells";
import useGetFeats from "../../../shared/customHooks/data/useGetFeats";
import useGetRaces from "../../../shared/customHooks/data/useGetRaces";
import useGetItems from "../../../shared/customHooks/data/useGetItems";
import useGetBackgrounds from "../../../shared/customHooks/data/useGetBackgrounds";
import useGetFullStats from "../../../shared/customHooks/dndInfo/useGetFullStats";
import useStyles from "../../../shared/customHooks/utility/style/styleHook";
import getUserSettings from "../../../shared/customHooks/userSettings";


const CharacterView: Component = () => {
    const [userSettings, setUserSettings] = getUserSettings();
  const stylin = createMemo(()=>useStyles(userSettings().theme));

    const routedSelected = useParams()
    const [searchParam, setSearchParam] = useSearchParams();
    const [characters, setCharacters] = useCharacters();
    if(!!!searchParam.name) setSearchParam({name: characters()[0].name});
    const selectedCharacter = characters().filter(x=>x.name.toLowerCase() === (searchParam.name || characters()[0].name).toLowerCase())[0];
    const [currentCharacter, setCurrentCharacter] = createSignal<Character>(selectedCharacter);
    const fullStats = useGetFullStats(currentCharacter);
    const getStatMod = (stat: number) => Math.floor((stat - 10)/2);
    const getProficiencyBonus = (level: number) => Math.ceil(level/4) + 1;
    const dndSrdClasses = useGetClasses();
    const dndSrdSpells = useGetSpells();
    const dndSrdFeats = useGetFeats();
    const dndSrdRaces = useGetRaces();
    const dndSrdItems = useGetItems();
    const dndSrdBackgrounds = useGetBackgrounds();
    effect(()=>{
        setSearchParam({name: currentCharacter().name})
    })
    return (
        <div class={`${stylin().accent} ${styles.mainBody}`}>
            <h1>Characters View</h1>
            <div>
                <div>
                    <select value={JSON.stringify(currentCharacter())} onChange={(e)=>setCurrentCharacter(()=>JSON.parse(e.target.value))}>
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