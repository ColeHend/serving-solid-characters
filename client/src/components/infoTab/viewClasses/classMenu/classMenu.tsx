import { useNavigate } from "@solidjs/router";
import { Button, Icon, Menu, MenuItem } from "coles-solid-library";
import { Component, createSignal } from "solid-js";
import { homebrewManager } from "../../../../shared";
// import { DnDClass } from "../../../../models";
import { Class5E } from "../../../../models/data";

interface menuProps {
    dndClass: Class5E;
}

export const ClassMenu: Component<menuProps> = (props) => {
  const [anchorEl,setAnchorEl] = createSignal<HTMLElement | undefined>();
  const [showMenu, setShowMenu] = createSignal<boolean>(false);

  const navigate = useNavigate();

  const checkForHomebrew = (dndClass:Class5E):boolean => {
          
    homebrewManager.classes().forEach(customClass => {
      if (dndClass.name.toLowerCase() === customClass.name.toLowerCase()) {
        return true;
      }
    })

    return false;
  };

  return <>
    <Button ref={setAnchorEl} onClick={()=>setShowMenu((old)=>!old)}>
      <Icon name="more_vert" size={"medium"}/>
    </Button>

    <Menu anchorElement={anchorEl} show={[showMenu, setShowMenu]}>
      <MenuItem onClick={() => {
        navigate(`/homebrew/create/classes?name=${props.dndClass.name}`)
      }}>
        {checkForHomebrew(props.dndClass)?"Edit":"Clone and Edit"}
      </MenuItem>
    </Menu>
  </>
}