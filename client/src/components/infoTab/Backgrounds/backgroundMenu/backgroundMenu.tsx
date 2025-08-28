import { useNavigate } from "@solidjs/router";
import { Button, Icon, Menu, MenuItem } from "coles-solid-library";
import { Component, createSignal } from "solid-js";
import { Background } from "../../../../models/data";
import { homebrewManager } from "../../../../shared";

interface menuProps {
    background: Background;
}

export const BackgroundMenu: Component<menuProps> = (props) => {

  const [anchorEl,setAnchorEl] = createSignal<HTMLElement | undefined>();
  const [showMenu,setShowMenu] = createSignal<boolean>(false);

  const navigate = useNavigate();


  const checkForHomebrew = (background: Background): boolean => {
    homebrewManager.backgrounds().forEach(customBackground =>{
      if (background.name.toLowerCase() === customBackground.name.toLowerCase()) {
        return true
      }
    })
    
    return false
  }

  return <>
    <Button ref={setAnchorEl} onClick={()=>setShowMenu((old)=>!old)}>
      <Icon name="more_vert" />
    </Button>

    <Menu anchorElement={anchorEl} show={[showMenu,setShowMenu]}>
      <MenuItem onClick={
        () => {navigate(`/homebrew/create/backgrounds?name=${props.background.name}`)}
      }>
        {checkForHomebrew(props.background) ? "Edit" :"Clone and Edit"}
      </MenuItem>
    </Menu>
  </>
}