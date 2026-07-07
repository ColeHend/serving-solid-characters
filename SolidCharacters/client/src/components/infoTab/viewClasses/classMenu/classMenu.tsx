import { useNavigate } from "@solidjs/router";
import { Button, Icon, Menu, MenuItem } from "coles-solid-library";
import { MoreVert } from "coles-solid-library/icons";
import { Component, createSignal } from "solid-js";
import { homebrewManager } from "../../../../shared";
// import { DnDClass } from "../../../../models";
import { Class5E } from "../../../../models/generated";

interface menuProps {
    dndClass: Class5E;
    openDialog: (e: Event) => void;
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
    <Button ref={setAnchorEl} onClick={(e)=>{
      e.stopPropagation()
      setShowMenu((old)=>!old)
    }}>
      <Icon icon={MoreVert} size={"medium"}/>
    </Button>

    <Menu anchorElement={anchorEl} show={[showMenu, setShowMenu]}>
      <MenuItem onClick={() => {
        // Encode in case of spaces / special chars
        const encoded = encodeURIComponent(props.dndClass.name);
        navigate(`/homebrew/create/classes?name=${encoded}`);
      }}>
        {checkForHomebrew(props.dndClass)?"Edit":"Clone and Edit"}
      </MenuItem>
      <MenuItem onClick={props.openDialog}>View</MenuItem>
    </Menu>
  </>
}