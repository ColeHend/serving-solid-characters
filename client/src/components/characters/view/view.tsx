import { Component, For, createMemo, createSignal } from "solid-js";
import styles from "./view.module.scss";
import useCharacters from "../../../shared/customHooks/dndInfo/useCharacters";
import StatBar from "./stat-bar/statBar";
import { useSearchParams } from "@solidjs/router";
import { effect } from "solid-js/web";
import useGetFullStats from "../../../shared/customHooks/dndInfo/useGetFullStats";
import useStyles from "../../../shared/customHooks/utility/style/styleHook";
import getUserSettings from "../../../shared/customHooks/userSettings";
import { Body, Select, Option, Input, FormField } from "coles-solid-library";
import { Character } from "../../../models/character.model";

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
    <Body class={`${stylin().accent} ${styles.mainBody}`}>
      <h1>Characters View</h1>
      <div>
        <div class={`${stylin().box} ${styles.baseInfoBox}`}>
          <Select value={currentCharacter()} onChange={(e)=>setCurrentCharacter(e)}>
            <For each={characters()}>{(character) => (
              <Option value={character}>{character.name}</Option>
            )}</For>
          </Select>

          <div style={{display: "flex", "flex-direction": "row", "gap": "15px", "flex-wrap": "wrap",height:"19vh","margin-top":"2%"}}>
            <div class={`${styles.infoBox}`}>
              <Input transparent />
              <hr />
              <span>Background</span>
            </div>

            <div class={`${styles.infoBox}`}>
              <Input transparent />
              <hr />
              <span>Class</span>
            </div>


            <div class={`${styles.infoBox}`}>
              <Input transparent />
              <hr />
              <span>Speices</span>
            </div>

            <div class={`${styles.infoBox}`}>
              <Input transparent />
              <hr />
              <span>Subclass</span>
            </div>

            <div class={`${styles.levelBox}`}>
              <div class={`${styles.centerdInputBox}`}>
                <Input transparent type="number" class={`${styles.levelInput}`} />
                <hr class={`${styles.bigHR}`}/>
                <span>Level</span>
              </div>
              <div class={`${styles.centerdInputBox}`}>
                <Input transparent type="number" class={`${styles.expInput}`} />
                <hr class={`${styles.smallHR}`}/>
                <span>Exp</span>
              </div>
            </div>

          </div>


          
        </div>
        <div>
          <div>
            {/* <h2>Stats</h2> */}
            <hr class={`${styles.Divider}`}/>

            <StatBar fullStats={fullStats} currentCharacter={currentCharacter}/>
          </div>
        </div>
      </div>
    </Body>
  )
};

export default CharacterView;