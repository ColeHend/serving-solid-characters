import { useNavigate } from "@solidjs/router";
import { Button, Icon, Menu, MenuItem } from "coles-solid-library";
import { Component, createMemo, createSignal } from "solid-js";
import { Character } from "../../../models/character.model";
import useExportFullStats from "../../../shared/customHooks/dndInfo/useGetFullStats";
import useExportProficiencies from "../../../shared/customHooks/dndInfo/useExportProficiencies";
import { createCharacterSheet } from "../../../shared/sheetMapping/pdf/createCharacterSheet";
import styles from "../characters.module.scss";

interface menuProps {
    character: Character;
}

export const CharacterMenu: Component<menuProps> = (props) => {
    const [showMenu,setShowMenu] = createSignal<boolean>(false);
    const [anchorEle,setAnchorEle] = createSignal<HTMLElement | undefined>();

    const navigate = useNavigate();

    const character = createMemo(() => props.character);
    // Effective stats for the sheet, computed in owner context (headless
    // createCharacterSheet must not call the hook itself).
    const fullStats = useExportFullStats(character);
    const profs = useExportProficiencies(character);

    return <span class={`${styles.menuButton}`}>
        <Button ref={setAnchorEle} onClick={()=>setShowMenu((old)=>!old)} transparent>
            <Icon name="more_vert"/>
        </Button>
        <Menu anchorElement={anchorEle} show={[showMenu,setShowMenu]} position="left" class={`${styles.menu}`} >
            <MenuItem onClick={() => navigate(`/characters/create?name=${character().name}`)}>
            Edit
            </MenuItem>
            <MenuItem onClick={() => createCharacterSheet(character(), fullStats(), profs())}>
            Create Character Sheet
            </MenuItem>
        </Menu>
    </span>
}