import { useNavigate } from "@solidjs/router";
import { Button, Icon, Menu, MenuItem } from "coles-solid-library";
import { Component, createSignal } from "solid-js";
import { homebrewManager } from "../../../../shared";
// import { DnDClass } from "../../../../models";
import { Class5E } from "../../../../models/generated";

interface menuProps {
    dndClass: Class5E;
}

export const ClassMenu: Component<menuProps> = (props) => {
  const [anchorEl,setAnchorEl] = createSignal<HTMLElement | undefined>();
  const [showMenu, setShowMenu] = createSignal<boolean>(false);

  const navigate = useNavigate();

  const checkForHomebrew = (dndClass: Class5E): boolean => {
    return homebrewManager
      .classes()
      .some(customClass => (customClass.name || '').toLowerCase() === (dndClass.name || '').toLowerCase());
  };

  return <>
    <Button ref={setAnchorEl} onClick={()=>setShowMenu((old)=>!old)}>
      <Icon name="more_vert" size={"medium"}/>
    </Button>

    <Menu anchorElement={anchorEl} show={[showMenu, setShowMenu]}>
      <MenuItem onClick={() => {
        // Encode in case of spaces / special chars
        const encoded = encodeURIComponent(props.dndClass.name);
        navigate(`/homebrew/create/classes?name=${encoded}`);
      }}>
        {checkForHomebrew(props.dndClass)?"Edit":"Clone and Edit"}
      </MenuItem>
    </Menu>
  </>
}