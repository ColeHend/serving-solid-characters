import { Button, Icon, Menu, MenuItem } from "coles-solid-library";
import { Component, createSignal } from "solid-js";
import { homebrewManager } from "../../../../shared";
import { Spell } from "../../../../models";
import { useNavigate } from "@solidjs/router";
import styles from "./spellMenu.module.scss";


interface SpellMenuProps {
    spell: Spell;
}

export const SpellMenu: Component<SpellMenuProps> = (props) => {
  const [anchorEl, setAnchorEl] = createSignal<HTMLElement | undefined>();
  const [showMenu, setShowMenu] = createSignal<boolean>(false);

  const navigate = useNavigate();

  const checkForHomebrew = (spell:Spell):boolean => {
    homebrewManager.spells().forEach(customSpell=>{
      if (spell.name.toLowerCase() === customSpell.name.toLowerCase()) {
        return true;
      } 
    })

    return false;
  };

  return <>
    <Button class={`${styles.spellMenu}`} ref={setAnchorEl} onClick={()=>setShowMenu((old)=>!old)}>
      <Icon size={"medium"} name="menu" />
    </Button>    

    <Menu anchorElement={anchorEl} show={[showMenu, setShowMenu]}>
      <MenuItem 
        onclick={
          () => navigate(`/homebrew/create/spells?name=${props.spell.name}`)
        }>
        {checkForHomebrew(props.spell)?"Edit":"Clone and Edit"}
      </MenuItem>
    </Menu>
  </>
}