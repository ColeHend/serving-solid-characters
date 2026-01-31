import { Component, createSignal } from "solid-js";
// import { Race } from "../../../../models";
import { Race } from "../../../../models/data";
import { homebrewManager } from "../../../../shared";
import { useNavigate } from "@solidjs/router";
import { Button, Icon, Menu, MenuItem } from "coles-solid-library";

interface menuProps {
  race: Race
}

export const RaceMenu:Component<menuProps> = (props) => {

  const [anchorEl, setAnchorEl] = createSignal<HTMLElement | undefined>();
  const [showMenu, setShowMenu] = createSignal<boolean>(false);

  const navigate = useNavigate();

  const checkForHomebrew = (race: Race):boolean => {

    homebrewManager.races().forEach(customRace=> {
      if (customRace.name.toLowerCase() === race.name.toLowerCase()) {
        return true
      }
    })

    return false
  }

  return <>
    <Button ref={setAnchorEl} onclick={()=>setShowMenu((old)=>!old)}>
      <Icon name="more_vert" />
    </Button>

    <Menu anchorElement={anchorEl} show={[showMenu, setShowMenu]}>
      <MenuItem onClick={
        ()=> {navigate(`/homebrew/create/races?name=${props.race.name}`)}
      }>
        {checkForHomebrew(props.race) ? "Edit" : "Clone and Edit"}
      </MenuItem>
    </Menu>
  </>
}