import { Component, For, createMemo, createSignal } from "solid-js";
import styles from "./view.module.scss";
import useCharacters, { Character } from "../../../shared/customHooks/dndInfo/useCharacters";
import StatBar from "./stat-bar/statBar";
import { useSearchParams } from "@solidjs/router";
import { effect } from "solid-js/web";
import useGetFullStats from "../../../shared/customHooks/dndInfo/useGetFullStats";
import useStyles from "../../../shared/customHooks/utility/style/styleHook";
import getUserSettings from "../../../shared/customHooks/userSettings";


const CharacterView: Component = () => {
  // eslint-disable-next-line
  const [userSettings, setUserSettings] = getUserSettings();
  const stylin = createMemo(()=>useStyles(userSettings().theme));


  const [searchParam, setSearchParam] = useSearchParams();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [characters, setCharacters] = useCharacters();
  if(!searchParam.name) setSearchParam({name: characters()[0].name});
  const selectedCharacter = characters().filter(x=>x.name.toLowerCase() === (searchParam.name || characters()[0].name).toLowerCase())[0];
  const [currentCharacter, setCurrentCharacter] = createSignal<Character>(selectedCharacter);
  const fullStats = useGetFullStats(currentCharacter);
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