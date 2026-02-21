import { Component, For, createMemo, createSignal, onCleanup, onMount } from "solid-js";
import styles from "./characters.module.scss";
import useStyles from "../../shared/customHooks/utility/style/styleHook";
import getUserSettings from "../../shared/customHooks/userSettings";
import { Body, Button, Cell, Column, Header, Icon, Menu, MenuItem, Row, Table } from "coles-solid-library";
import { Character } from "../../models/character.model";
import { characterManager } from "../../shared";
import { useNavigate } from "@solidjs/router";
import { CharacterMenu } from "./characterMenu/characterMenu";


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

    document.body.classList.add("character-view-bg");
  })

  onCleanup(() => {
    document.body.classList.remove("character-view-bg");
  })
  return (
    <Body class={`${stylin().accent} ${styles.body}`}>
      <h1 class={`${styles.header}`}>Characters</h1>
      <div class={`${styles.allCharsTables}`}>
        <Table 
        columns={[
          "name",
          "race",
          "background",
          "level",
          "class",
          "menu"
        ]}
        data={characters}>
          <Column name="name">
            <Header>Name</Header>
            <Cell<Character>>
              {(character)=><span>
                {character.name}
              </span>}
            </Cell>
          </Column>
          <Column name="race">
            <Header>Race</Header>
            <Cell<Character>>
              {(character)=><span>
                {character.race.species}
              </span>}
            </Cell>
          </Column>
          <Column name="background">
            <Header>Background</Header>
            <Cell<Character>>
              {(character)=><span>
                {character.background}
              </span>}
            </Cell>
          </Column>
          <Column name="level">
            <Header>Level</Header>
            <Cell<Character>>
              {(character)=><span>
                {character.levels.length}
              </span>}
            </Cell>
          </Column>
          <Column name="class">
            <Header>Class</Header>
            <Cell<Character>>
              {(character)=><span>
                <For each={character.className.split(",")}>
                  { (className,i) => <div> {className}{i() !== character.className.split(",").length - 1 ? "," : ""} </div> }
                </For>
              </span>}
            </Cell>
          </Column>
          <Column name="menu">
            <Header><></></Header>
            <Cell<Character> onClick={(e)=>e.stopPropagation()}>
              {(character)=><CharacterMenu character={character} />}
            </Cell>
          </Column>
          
          <Row onClick={(e,character)=>navigate(`/characters/view?name=${character.name}`)} />
        </Table>
      </div>
    </Body>
  )
};

export default Characters;