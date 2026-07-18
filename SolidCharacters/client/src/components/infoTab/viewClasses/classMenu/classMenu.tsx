import { useNavigate } from "@solidjs/router";
import { Button, Icon, Menu, MenuItem } from "coles-solid-library";
import { MoreVert } from "coles-solid-library/icons";
import { Accessor, Component, Show, createMemo, createSignal } from "solid-js";
import { homebrewManager } from "../../../../shared";
// import { DnDClass } from "../../../../models";
import { Class5E, Subclass } from "../../../../models/generated";
import { subclassBelongsTo } from "../../../../models/data/subclasses";
import { CloneSubclassDialog } from "./cloneSubclassDialog";
import style from "./classMenu.module.scss";

interface menuProps {
    dndClass: Class5E;
    subclasses: Accessor<Subclass[]>;
    openDialog: (e: Event) => void;
}

export const ClassMenu: Component<menuProps> = (props) => {
  const [anchorEl,setAnchorEl] = createSignal<HTMLElement | undefined>();
  const [showMenu, setShowMenu] = createSignal<boolean>(false);
  const [showCloneDialog, setShowCloneDialog] = createSignal<boolean>(false);

  const classSubclasses = createMemo(() =>
    props.subclasses().filter(s => subclassBelongsTo(s, props.dndClass)));

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
    }} class={`${style.menu}`}>
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
      <Show when={classSubclasses().length > 0}>
        <MenuItem onClick={() => setShowCloneDialog(true)}>Clone/Edit Subclass</MenuItem>
      </Show>
      <MenuItem onClick={props.openDialog}>View</MenuItem>
    </Menu>

    <CloneSubclassDialog
      show={[showCloneDialog, setShowCloneDialog]}
      parentClassName={props.dndClass.name}
      subclasses={classSubclasses}
    />
  </>
}