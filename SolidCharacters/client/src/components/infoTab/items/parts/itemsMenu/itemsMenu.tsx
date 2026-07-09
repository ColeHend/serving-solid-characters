import { Component, createMemo, createSignal, Show } from "solid-js";
import { srdItem } from "../../../../../models/data/generated";
import { useNavigate } from "@solidjs/router";
import { Button, Icon, Menu, MenuItem } from "coles-solid-library";
import { MoreVert } from "coles-solid-library/icons";
import { homebrewManager } from "../../../../../shared";
import styles from "./itemMenu.module.scss";


interface menuProps {
    item: srdItem;
    openDialog?: (e: Event) => void;
}

export const ItemsMenu:Component<menuProps> = (props) => {

    const hasFunc = createMemo(() => "openDialog" in props && props.openDialog !== undefined);

    const [anchorEl, setAnchorEl] = createSignal<HTMLElement | undefined>();
    const [showMenu, setShowMenu] = createSignal<boolean>(false);
    
    const navigate = useNavigate();

    const checkForHomebrew = (item: string) => {
        homebrewManager?.items()?.forEach((customItem:srdItem) => {
            if (customItem?.name?.toLowerCase() === item?.toLowerCase()) return true;
        })

        return false
    }

    return <>
        <Button id={`${styles.buttonOverwrite}`} ref={setAnchorEl} onClick={()=>setShowMenu(old=>!old)}>
            <Icon icon={MoreVert}/>
        </Button>

        <Menu anchorElement={anchorEl} show={[showMenu, setShowMenu]}>
            <MenuItem onClick={()=>navigate(`/homebrew/create/items?name=${props?.item?.name}`)}>
              {checkForHomebrew(props?.item?.name) ? "Edit" : "Clone & Edit"}
            </MenuItem>
            <Show when={hasFunc()} keyed>
                {keyed => (<MenuItem onClick={keyed ? props.openDialog : () => {}}>
                    view
                </MenuItem>)}
            </Show>
        </Menu>
    </>
}