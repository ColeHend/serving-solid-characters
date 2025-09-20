import { Component, For, createMemo, createSignal, onMount } from "solid-js";
import styles from "./characters.module.scss";
import useStyles from "../../shared/customHooks/utility/style/styleHook";
import getUserSettings from "../../shared/customHooks/userSettings";
import { Body, Button, Icon, Menu, MenuItem } from "coles-solid-library";
import { Character } from "../../models/character.model";
import { characterManager } from "../../shared";
import { useNavigate } from "@solidjs/router";


const Characters: Component = () => {
  // eslint-disable-next-line
  const [userSettings, setUserSettings] = getUserSettings();
  const stylin = createMemo(()=>useStyles(userSettings().theme));

  const navigate = useNavigate();
   
  const [characters, setCharacters] = createSignal(characterManager.characters());
  const [showMenu,setShowMenu] = createSignal<boolean>(false);
  const [anchorEle,setAnchorEle] = createSignal<HTMLElement | undefined>();

  onMount(()=>{
    setCharacters(characterManager.characters());
  })
  return (
    <Body class={`${stylin().accent} ${styles.mainBody}`}>
      <h1 style={{margin: "0 auto", width: "min-content"}}>Characters</h1>
      <div>
        <table style={{width: "50%", margin: "0 auto"}}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Race</th>
              <th>Background</th>
              <th>Level</th>
              <th>Class</th>
              <th>Subclass</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <For each={characters()}>{(character: Character) => (
              <tr>
                <td>{character.name}</td>
                <td>{character.race.species}</td>
                <td>{character.background}</td>
                <td>{character.level}</td>
                <td>{character.className}</td>
                <td>{character.subclass}</td>
                <td class={`${styles.menuButton}`} >
                  <Button ref={setAnchorEle} onClick={()=>setShowMenu((old)=>!old)}>
                    <Icon name="more_vert"/>
                  </Button>
                  <Menu  anchorElement={anchorEle} show={[showMenu,setShowMenu]} position="left" >
                    <MenuItem onClick={() => {window.location.href = `/characters/view?name=${character.name}`}}>
                      View Character
                    </MenuItem>
                    <MenuItem onClick={() => navigate(`/characters/create?name=${character.name}`)}>
                      Edit
                    </MenuItem>
                  </Menu>
                </td>
              </tr>
            )}</For>
          </tbody>
        </table>
      </div>
    </Body>
  )
};

export default Characters;