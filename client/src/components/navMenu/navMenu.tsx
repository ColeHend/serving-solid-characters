import { useNavigate } from "@solidjs/router";
import { Accessor, Component, createEffect, createSignal, For, Setter, Show, splitProps } from "solid-js";
import Gear from "../../shared/svgs/gear";
import { Style } from "../../shared/customHooks/utility/style/styleHook";
import { UserSettings } from "../../models/userSettings";
import { ExtendedTab } from "../../models/extendedTab";
import SettingsPopup from "./settingsPopup";
import styles from "./navMenu.module.scss";
import { Button, Menu, MenuItem, Modal, MenuDropdown, Icon } from "coles-solid-library";

interface Props {
    userStyle: Accessor<Style>,
    defaultShowList: Accessor<boolean>,
    setDefaultShowList: Setter<boolean>,
    defaultIsMobile: Accessor<boolean>,
    setDefaultIsMobile: Setter<boolean>,
    defaultUserSettings: Accessor<UserSettings>,
    setDefaultUserSettings: Setter<UserSettings>,
    anchorElement: Accessor<HTMLElement | undefined>
}

const NavMenu: Component<Props> = (props) => {
  const Navigate = useNavigate();
  const [showSettings, setShowSettings] = createSignal(false);
  
  const [MenuItems,] = createSignal<ExtendedTab[]>([
    {
      Name: "Characters", 
      Link: "/characters",
      isOpen: false,
      children: [
        { Name: "View", Link: "/characters/view", isOpen: false },
        { Name: "Create", Link: "/characters/create", isOpen: false }
      ]
    }, 
    {
      Name: "Info", 
      Link: "/info",
      isOpen: false,
      children: [
        { Name: "Spells", Link: "/info/spells", isOpen: false },
        { Name: "Feats", Link: "/info/feats", isOpen: false },
        { Name: "Classes", Link: "/info/classes", isOpen: false },
        { Name: "Backgrounds", Link: "/info/backgrounds", isOpen: false },
        { Name: "Items", Link: "/info/items", isOpen: false },
        { Name: "Races", Link: "/info/races", isOpen: false }
      ]
    }, 
    {
      Name: "Homebrew", 
      Link: "/homebrew",
      isOpen: false,
      children: [
        { Name: "Spells", Link: "/homebrew/view?name=spells", isOpen: false },
        { Name: "Feats", Link: "/homebrew/view?name=feats", isOpen: false },
        { Name: "Classes", Link: "/homebrew/view?name=classes", isOpen: false },
        { Name: "Subclasses", Link: "/homebrew/view?name=subclasses", isOpen: false },
        { Name: "Backgrounds", Link: "/homebrew/view?name=backgrounds", isOpen: false },
        { Name: "Items", Link: "/homebrew/view?name=items", isOpen: false },
        { Name: "Races", Link: "/homebrew/view?name=races", isOpen: false },
        { Name: "Subraces", Link: "/homebrew/view?name=subraces",isOpen: false}
      ]
    }
  ].sort((a, b) => a.Name > b.Name ? 1 : -1));

  const convertHombrewViewToCreate = (link: string) => {
    return link.replace('view', 'create').replace("?name=", "/");
  };
  createEffect(() => {
    console.log('showSettings', showSettings());
  });

  return (
    <>
      <Menu 
        position="right"
        style={{width: '180px'}}
        show={[props.defaultShowList, props.setDefaultShowList]} 
        anchorElement={props.anchorElement} >
        <MenuItem class={`${styles.headerItem}`}>
          <h3 onClick={()=>Navigate("/")}>Navigation</h3>
          <Button transparent onClick={(e) => {
            e.stopPropagation();
            setShowSettings(old=>!old);
          }} >
            <Gear height={30} />
          </Button>
        </MenuItem>
        <MenuDropdown header={()=>"User Settings"} >
          <MenuItem>Login</MenuItem>
          <MenuItem>Logout</MenuItem>
          <MenuItem>Register</MenuItem>
        </MenuDropdown>
        <For each={MenuItems()}>{(menuItem)=>(
          <>
            <Show when={menuItem.Name !== "Homebrew"}>
              <MenuDropdown header={()=><><span class={`${styles.linkFix}`}  onClick={(e)=>Navigate(menuItem.Link)}>{menuItem.Name}</span></>} >
                <For each={menuItem?.children ?? []}>{(child)=>(
                  <MenuItem onClick={()=>Navigate(child.Link)} class={`${styles.menuItem}`}>
                    <span class={`${styles.linkFix}`} onClick={()=>Navigate(child.Link)}>
                      {child.Name}
                    </span>
                  </MenuItem>
                )}</For>
              </MenuDropdown>
            </Show>
            <Show when={menuItem.Name === "Homebrew"}>
              <MenuDropdown header={()=><><span class={`${styles.linkFix}`}  onClick={(e)=>Navigate(menuItem.Link)}>{menuItem.Name}</span></>} >
                <For each={menuItem?.children ?? []}>{(child)=>(
                  <MenuItem class={`${styles.menuItem}`}>
                    <span>{child.Name}</span>
                    <Button transparent onClick={()=>Navigate(child.Link)} >
                      <Icon name="visibility" size={'small'} />
                    </Button>
                    <Button transparent onClick={()=>Navigate(convertHombrewViewToCreate(child.Link))}>
                      <Icon name="edit" size={'small'} />
                    </Button>
                  </MenuItem>
                )}</For>
              </MenuDropdown>
            </Show>
          </>
        )}</For>
      </Menu>
      <Modal title="Settings" show={[showSettings, setShowSettings]}>
        <SettingsPopup 
          defaultUserSettings={props.defaultUserSettings} 
          setDefaultUserSettings={props.setDefaultUserSettings} />
      </Modal>
    </>
  );
}
export default NavMenu;