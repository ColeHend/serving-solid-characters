import { useNavigate } from "@solidjs/router";
import { Button, Icon, Menu, MenuItem } from "coles-solid-library";
import { MoreVert } from "coles-solid-library/icons";
import { Component, createSignal } from "solid-js";
import styles from "./featMenu.module.scss";
// import { Feat } from "../../../../models";
import { Feat } from "../../../../models/generated";
import { homebrewManager } from "../../../../shared";

interface menuProps {
    feat: Feat
}

export const FeatMenu:Component<menuProps> = (props) => {
  const navigate = useNavigate();

  const [anchorEl, setAnchorEl] = createSignal<HTMLElement | undefined>();
  const [showMenu, setShowMenu] = createSignal<boolean>(false);

  const checkForHomebrew = (feat:Feat):boolean => {
    homebrewManager.feats().forEach(customFeat => {
      if (feat.details.name.toLowerCase() === customFeat.name.toLowerCase()) {
        return true
      }  
    })

    return false;
  }

  return <div  class={`${styles.menuBtn}`}>
    <Button ref={setAnchorEl} onClick={()=>setShowMenu((old)=>!old)}>
      <Icon icon={MoreVert} />
    </Button>

    <Menu 
      anchorElement={anchorEl} 
      show={[showMenu, setShowMenu]}>
      <MenuItem onClick={
        ()=>navigate(`/homebrew/create/feats?name=${props.feat.details.name}`)
      }>
        {checkForHomebrew(props.feat)?"Edit":"Clone and Edit"}
      </MenuItem>
    </Menu>
  </div>
}