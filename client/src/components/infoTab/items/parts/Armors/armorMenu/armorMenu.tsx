import { Component, createSignal } from "solid-js";
import { Armor, homebrewManager } from "../../../../../../shared";
import { useNavigate } from "@solidjs/router";
import { ItemType } from "../../../../../../models/data";
import { Button, Icon, Menu, MenuItem } from "coles-solid-library";

interface menuProps {
    armor: Armor;
}

export const ArmorMenu: Component<menuProps> = (props) => {

  const [anchorEl, setAnchorEl] = createSignal<HTMLElement | undefined>();
  const [showMenu, setShowMenu] = createSignal<boolean>(false);

  const navigate = useNavigate();

  const checkForHomebrew = (SrdArmor:Armor):boolean => {
    const itemsHomebrew = homebrewManager.items().filter(x=>x.equipmentCategory === ItemType[2]);

    itemsHomebrew.forEach(armor=>{
      if (armor.name.toLowerCase() === SrdArmor.name.toLowerCase()) {
        return true;
      }
    })

    return false
  }

  return <>
    <Button ref={setAnchorEl} onClick={()=>setShowMenu((old)=>!old)}>
      <Icon name="more_vert"/>
    </Button>

    <Menu anchorElement={anchorEl} show={[showMenu, setShowMenu]}>
      <MenuItem onClick={
        () => navigate(`/homebrew/create/items?itemType=${props.armor.equipmentCategory}&name=${props.armor.name}`)
      }>
        {checkForHomebrew(props.armor)?"Edit":"Clone & Edit"}
      </MenuItem>
    </Menu>
  </>
}