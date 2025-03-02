import { A } from "@solidjs/router";
import { Accessor, Component, createSignal, For, Setter, Show, splitProps } from "solid-js";
import { Button, MenuButton } from "../../shared/components";
import Modal from "../../shared/components/popup/popup.component";
import { Clone } from "../../shared/customHooks/utility/Tools";
import { UpArrow, DownArrow } from "../../shared/svgs/arrows";
import Eye from "../../shared/svgs/eye";
import Gear from "../../shared/svgs/gear";
import Pencil from "../../shared/svgs/pencil";
import SkinnySnowman from "../../shared/svgs/skinnySnowman";
import { Style } from "../../shared/customHooks/utility/style/styleHook";
import { UserSettings } from "../../models/userSettings";
import { ExtendedTab } from "../../models/extendedTab";
import SettingsPopup from "./settingsPopup";
import { useInjectServices } from "../../shared/customHooks/injectServices";
import Styles from "./navMenu.module.scss";

interface Props {
    userStyle: Accessor<Style>,
    defaultShowList: Accessor<boolean>,
    setDefaultShowList: Setter<boolean>,
    defaultIsMobile: Accessor<boolean>,
    setDefaultIsMobile: Setter<boolean>,
    defaultUserSettings: Accessor<UserSettings>,
    setDefaultUserSettings: Setter<UserSettings>
}

const NavMenu: Component<Props> = (props) => {
  const [{ userStyle, defaultShowList, setDefaultShowList, defaultIsMobile: isMobile, defaultUserSettings, setDefaultUserSettings }] = splitProps(props, ["userStyle", "defaultShowList", "setDefaultShowList", "defaultIsMobile", "setDefaultIsMobile", "defaultUserSettings", "setDefaultUserSettings"]);
  const [showSettings, setShowSettings] = createSignal(false);
  const services = useInjectServices();
  const [MenuItems, setMenuItems] = createSignal<ExtendedTab[]>([
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

  const settingsOptions: ()=>MenuButton[] = ()=>[
    {
      name: "Login",
      action: ()=>{console.log("Login")},
      condition: ()=>true
    },
    {
      name: "Register",
      action: ()=>{console.log("Register")},
      condition: ()=>true
    },
    {
      name: "Logout",
      action: ()=>{console.log("Logout")},
      condition: ()=>true
    },
    {
      name: "Profile",
      action: ()=>{console.log("Profile")},
      condition: ()=>true
    },
  ];
  return (
    <span class={`${userStyle().primary} ${defaultShowList() ? `${Styles.navOpen}` : `${Styles.navClosed}`}`}>
      <div class={`${userStyle().accent} ${Styles.topper}`}>
        <h2>Navigation</h2>
        <Button >
          <Gear height={30} onClick={() => setShowSettings(old => !old)} />
          <Show when={showSettings()}>
            <Modal title="Settings" width={services.isMobile() ? "90vw":"45vw"} height={services.isMobile() ? "90vh" :"60vh"} backgroundClick={[showSettings, setShowSettings]}>
              <SettingsPopup 
                userStyle={userStyle}
                defaultUserSettings={defaultUserSettings} 
                setDefaultUserSettings={setDefaultUserSettings} />
            </Modal> 
          </Show>
        </Button>
        <Button enableBackgroundClick={true} menuItems={settingsOptions()} overrideX={isMobile() ? "42vw" : "93vw"} >
          <SkinnySnowman height={30} />
        </Button>
      </div>
      <div class="theLine" />
      <For each={MenuItems()}>{(item) => {
        return <div class="sidebar">
          <div class="sideHead">
            <h2>
              <A onClick={() => setDefaultShowList(old => !old)} href={item.Link}>
                {item.Name}
              </A>
            </h2>
            <span class={`${userStyle().hover}`} onClick={() => setMenuItems(old => {
              item.isOpen = !item.isOpen;
              return Clone([...old.filter(x => x.Name !== item.Name), item].sort((a, b) => a.Name > b.Name ? 1 : -1));
            })}>
              {item.isOpen ? <UpArrow /> : <DownArrow />}
            </span>
          </div>
          <div class="theLine" />
          <Show when={item.isOpen}>
            <ul class="sideBody">
              <For each={item.children}>{(child) => {
                return <li>
                  <h3>
                    <A onClick={() => setDefaultShowList(old => !old)} href={child.Link}>
                      {child.Name}
                    </A>
                  </h3>
                  <Show when={child.Link.includes("homebrew")}>
                    <span>
                      <A onClick={() => setDefaultShowList(old => !old)} href={convertHombrewViewToCreate(child.Link)}>
                        <Pencil />
                      </A>
                      <A onClick={() => setDefaultShowList(old => !old)} href={child.Link}>
                        <Eye />
                      </A>
                    </span>
                  </Show>
                </li>
              }}</For>
            </ul>
          </Show>
        </div>
      }}</For>
    </span>
  )
}
export default NavMenu;