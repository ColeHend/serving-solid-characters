import { useNavigate } from "@solidjs/router";
import { Button, Icon, Menu, MenuItem } from "coles-solid-library";
import { Component, createSignal } from "solid-js";
import { homebrewManager, Weapon } from "../../../../../../shared";
import { ItemType } from "../../../../../../models/data";

interface menuProps {
    weapon: Weapon;
}

export const WeaponMenu: Component<menuProps> = (props) => {

  const [anchorEl, setAnchorEl] = createSignal<HTMLElement | undefined>();
  const [showMenu, setShowMenu] = createSignal<boolean>(false);

  const navigate = useNavigate();

  const checkForHomebrew = (weapon:Weapon): boolean => {
    const itemsHomebrew = homebrewManager.items().filter(x=>x.equipmentCategory === ItemType[1]);
    
    itemsHomebrew.forEach((customWeapon) => {
      if (customWeapon.name.toLowerCase() === weapon.name.toLowerCase()) {
        return true 
      }
    })
    
    return false
  }
    

  return <>
    <Button ref={setAnchorEl} onClick={()=>setShowMenu((old)=>!old)}>
      <Icon name="more_vert" />
    </Button>
    
    <Menu anchorElement={anchorEl} show={[showMenu, setShowMenu]}>
      <MenuItem onClick={
        ()=> navigate(`/homebrew/create/items?itemType=${props.weapon.equipmentCategory}&name=${props.weapon.name}`)
      }>
        {checkForHomebrew(props.weapon) ? "Edit" : "Clone & Edit"}
      </MenuItem>
    </Menu>
  </>
}