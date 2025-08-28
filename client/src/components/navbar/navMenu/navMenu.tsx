import { Component, For, Show, createSignal } from "solid-js";
import { Icon, Modal } from "coles-solid-library";
import useStyle from "../../../shared/customHooks/utility/style/styleHook";
import menuStyles from "./navMenu.module.scss";

interface MenuButton {
    name: string,
    condition: () => boolean,
    action: () => void
}

const NavMenu: Component = () => {
  const [showMenu, setShowMenu] = createSignal(false);
  const stylin = useStyle(); 
  const [loggedIn, setLoggedIn] = createSignal(false);
  const menuButtons: MenuButton[] = [
    {
      name: "Login",
      condition: ()=>!loggedIn(),
      action: ()=>{setLoggedIn(true)}
    },
    {
      name: "Register",
      condition: ()=>!loggedIn(),
      action: ()=>{}
    },
    {
      name: "Logout",
      condition: loggedIn,
      action: ()=>{setLoggedIn(false)}
    },
    {
      name: "Profile",
      condition: loggedIn,
      action: ()=>{}
    },
    {
      name: "Settings",
      condition: ()=>true,
      action: ()=>{}
    }
  ]

  return (
    <>
      <button type="button" class={`${stylin.accent} ${stylin.hover}`} onClick={()=>setShowMenu(old =>!old)}>
        <Icon name="settings" />
      </button>
      <Show when={showMenu()}>
        <Modal title="menu" width="10%" height="25%" translate={{x:"36vw",y:"-40vh"}}  show={[showMenu, setShowMenu]} >
          <ul class={`${menuStyles.menuButtons}`}>
            <For each={menuButtons}>
              {(button) => (
                <Show when={button.condition()}>
                  <li style={{height:`${100 / menuButtons.filter(x=>x.condition()).length}%`}} class={`${stylin.hover}`}>
                    <button class={`${stylin.accent} ${menuStyles.menuButton}`} onClick={button.action}>
                      {button.name}
                    </button>
                  </li>
                </Show>
              )}
            </For>
          </ul>
        </Modal>
      </Show>
    </>
  );
};

export default NavMenu;