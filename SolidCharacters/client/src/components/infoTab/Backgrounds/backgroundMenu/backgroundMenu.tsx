import { useNavigate } from "@solidjs/router";
import { Button, Icon, Menu, MenuItem } from "coles-solid-library";
import { MoreVert } from "coles-solid-library/icons";
import { Component, createSignal } from "solid-js";
import { Background } from "../../../../models/generated";
import { homebrewManager } from "../../../../shared";
import styles from "./backgroundMenu.module.scss";

interface menuProps {
  background: Background;
  openDialog: (e:Event) => void;
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
    <Button ref={setAnchorEl} onClick={()=>setShowMenu((old)=>!old)} class={`${styles.menu}`}>
      <Icon icon={MoreVert} />
    </Button>

    <Menu anchorElement={anchorEl} show={[showMenu,setShowMenu]}>
      <MenuItem onClick={
        () => {navigate(`/homebrew/create/backgrounds?name=${props.background.name}`)}
      }>
        {checkForHomebrew(props.background) ? "Edit" :"Clone and Edit"}
      </MenuItem>
      <MenuItem onClick={props.openDialog}>
        View
      </MenuItem>
    </Menu>
  </>
}