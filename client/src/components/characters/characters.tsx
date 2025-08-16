import { Component, For, createMemo, createSignal } from "solid-js";
import styles from "./characters.module.scss";
import useCharacters from "../../shared/customHooks/dndInfo/useCharacters";
import useStyles from "../../shared/customHooks/utility/style/styleHook";
import getUserSettings from "../../shared/customHooks/userSettings";
import { Body, Button, Menu, MenuItem } from "coles-solid-library";
import { Character } from "../../models/character.model";


const Characters: Component = () => {
  // eslint-disable-next-line
  const [userSettings, setUserSettings] = getUserSettings();
  const stylin = createMemo(()=>useStyles(userSettings().theme));

  // eslint-disable-next-line
  const [characters, setCharacters] = useCharacters();
  const [showMenu,setShowMenu] = createSignal<boolean>(false);
  const [anchorEle,setAnchorEle] = createSignal<HTMLElement | undefined>();
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
                <td>
                  <Button ref={setAnchorEle} onClick={()=>setShowMenu((old)=>!old)}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path d="M0 0h24v24H0z" fill="none"/><path d="M12 6a2 2 0 1 1 0 4 2 2 0 0 1 0-4zm0 6a2 2 0 1 1 0 4 2 2 0 0 1 0-4zm0 6a2 2 0 1 1 0 4 2 2 0 0 1 0-4z"/></svg>
                  </Button>
                  <Menu  anchorElement={anchorEle} show={[showMenu,setShowMenu]} position="left" >
                    <MenuItem onClick={() => {window.location.href = `/characters/view?name=${character.name}`}}>
                      View Character
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