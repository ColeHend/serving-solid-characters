import { Button, Icon, Menu, MenuItem } from "coles-solid-library";
import { Accessor, Component, createSignal, Setter, Show } from "solid-js";
import { homebrewManager } from "../../../../shared";
import { Spell } from "../../../../models";
import { useNavigate } from "@solidjs/router";
import styles from "./spellMenu.module.scss";
import { AddSpellPopup } from "../addSpellPopup/addSpellPopup";
import { AddSpell } from "../../../../shared/customHooks/utility/tools/addSpellToChar";


interface SpellMenuProps {
  spell: Spell;
  lastChar: [Accessor<string>, Setter<string>]
}

export const SpellMenu: Component<SpellMenuProps> = (props) => {
  const [anchorEl, setAnchorEl] = createSignal<HTMLElement | undefined>();
  const [showMenu, setShowMenu] = createSignal<boolean>(false);

  const navigate = useNavigate();

  const [showAddSpell,setShowAddSpell] = createSignal<boolean>(false);
  const [lastChar,setLastChar] = props.lastChar;

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
      <Icon size={"medium"} name="more_vert" />
    </Button>    

    <Menu anchorElement={anchorEl} show={[showMenu, setShowMenu]}>
      <MenuItem 
        onclick={
          () => navigate(`/homebrew/create/spells?name=${props.spell.name}`)
        }>
        {checkForHomebrew(props.spell)?"Edit":"Clone & Edit"}
      </MenuItem>
      <MenuItem onClick={()=>setShowAddSpell(old => !old)}>
        Add to Character
      </MenuItem>
      <Show when={lastChar() !== ""}>
        <MenuItem onClick={()=>AddSpell(props.spell,lastChar())}>
          Add to {lastChar()}
        </MenuItem>
      </Show>
    </Menu>

    <Show when={showAddSpell()}>
          <AddSpellPopup 
            show={[showAddSpell,setShowAddSpell]}
            character={setLastChar}
            spell={props.spell as any}
          />
    </Show>
  </>
}