import { Component, createSignal } from "solid-js";
import { srdItem } from "../../../../../models/data/generated";
import { useNavigate } from "@solidjs/router";
import { Button, Icon, Menu, MenuItem } from "coles-solid-library";
import { homebrewManager } from "../../../../../shared";


interface menuProps {
    item: srdItem;
}

export const ItemsMenu:Component<menuProps> = (props) => {

    const [anchorEl, setAnchorEl] = createSignal<HTMLElement | undefined>();
    const [showMenu, setShowMenu] = createSignal<boolean>(false);
    
    const navigate = useNavigate();

    const checkForHomebrew = (item: string) => {
        homebrewManager.items().forEach((customItem:srdItem) => {
            if (customItem.name.toLowerCase() === item.toLowerCase()) return true;
        })

        return false
    }

    return <>
        <Button ref={setAnchorEl} onClick={()=>setShowMenu(old=>!old)}>
            <Icon name="more_vert"/>
        </Button>

        <Menu anchorElement={anchorEl} show={[showMenu, setShowMenu]}>
            <MenuItem onClick={()=>navigate(`/homebrew/create/items?name=${props.item.name}`)}>
              {checkForHomebrew(props.item.name) ? "Edit" : "Clone & Edit"}
            </MenuItem>
        </Menu>
    </>
}