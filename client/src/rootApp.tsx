import { RouteSectionProps, A } from "@solidjs/router";
import { Component, createSignal, Show, For, Accessor, createContext, JSX, Setter, children, useContext, createMemo } from "solid-js";
import { effect } from "solid-js/web";
import Navbar, { Tab } from "./components/navbar/navbar";
import { MenuButton, Button, Select } from "./shared/components";
import useBaseStyle, { Style } from "./shared/customHooks/utility/style/styleHook";
import { Clone } from "./shared/customHooks/utility/Tools";
import { UpArrow, DownArrow } from "./shared/svgs/arrows";
import Eye from "./shared/svgs/eye";
import Gear from "./shared/svgs/gear";
import Pencil from "./shared/svgs/pencil";
import SkinnySnowman from "./shared/svgs/skinnySnowman";
import { HookContext, ProviderProps } from "./models/hookContext";
import { ExtendedTab } from "./models/extendedTab";
import Modal from "./shared/components/popup/popup.component";
import { UserSettings } from "./models/userSettings";
import getUserSettings from "./shared/customHooks/userSettings";
import { useInjectServices } from "./shared/customHooks/injectServices";
import { mobileCheck } from "./shared/customHooks/utility/mobileCheck";

const defaultValue: HookContext = {
  isMobile: createSignal(mobileCheck())[0], 
  showList: createSignal(false), 
  useStyle: useBaseStyle
};
export const SharedHookContext = createContext<HookContext>(defaultValue);

const Provider: Component<ProviderProps<HookContext>> = (props) => {
    return <SharedHookContext.Provider value={props.value}>{props.children}</SharedHookContext.Provider>
}

const RootApp: Component<RouteSectionProps<unknown>> = (props) => {
  const [defaultUserSettings, setDefaultUserSettings] = getUserSettings();
    const userStyle = createMemo(()=>useBaseStyle(defaultUserSettings().theme));
    const [defaultShowList, setDefaultShowList] = createSignal(!mobileCheck());
    const [defaultIsMobile, setDefaultIsMobile] = createSignal(mobileCheck());
    effect(()=>{
      console.log('User Settings: ', defaultUserSettings());
    })
    effect(()=>{
      defaultShowList()
      setDefaultIsMobile(mobileCheck());
    })
    const clickIntercept = () => setDefaultShowList(window.matchMedia("only screen and (max-width: 768px)").matches);
    setDefaultIsMobile(mobileCheck());
      window.addEventListener('resize', clickIntercept);
    
    effect(() => {
      const check = mobileCheck() || window.innerWidth <= 768 ? true : false;
      setDefaultShowList(!check);
    });
  
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
          { Name: "Spells", Link: "/homebrew/view/spells", isOpen: false },
          { Name: "Feats", Link: "/homebrew/view/feats", isOpen: false },
          { Name: "Classes", Link: "/homebrew/view/classes", isOpen: false },
          { Name: "Subclasses", Link: "/homebrew/view/subclasses", isOpen: false },
          { Name: "Backgrounds", Link: "/homebrew/view/backgrounds", isOpen: false },
          { Name: "Items", Link: "/homebrew/view/items", isOpen: false },
          { Name: "Races", Link: "/homebrew/view/races", isOpen: false }
        ]
      }
    ].sort((a, b) => a.Name > b.Name ? 1 : -1));

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
  const [showSettings, setShowSettings] = createSignal(false);
  const {isMobile} = useInjectServices();
    return (
      <SharedHookContext.Provider value={{
        isMobile: defaultIsMobile,
        showList: [defaultShowList, setDefaultShowList],
        useStyle: useBaseStyle
      }}>
        <div style={{ height: "100vh" }} class={userStyle().body}>
        <Navbar isMobile={isMobile()} style={"margin-bottom: 15px;"} list={[defaultShowList, setDefaultShowList]} />
        <div class="body">
          <span class={`${defaultShowList() ? "openFirst": "closeFirst"}`}>
            {props.children}
          </span>
          <Show when={defaultShowList()}>
            <span class={`${userStyle().primary} ${defaultShowList() ? `navOpen` : `navClosed`}`}>
              <div class={`${userStyle().accent} topper`}>
                <h1>
                  Navigation
                </h1>
                <span>
                  <Button class={userStyle().hover}>
                    <Gear onClick={(e)=>setShowSettings(old=>!old)}/>
                      <Show when={showSettings()}>
                        <Modal title="Settings" width="45vw" height="60vh" backgroundClick={[showSettings, setShowSettings]}>
                          <div>
                            <div>
                              <h3>Theme</h3>
                              <Select onChange={(e)=>setDefaultUserSettings(old=> {
                                old.theme = e.target.value;
                                return Clone(old)
                              })} >
                                <option value="dark">Dark</option>
                                <option value="light">Light</option>
                              </Select>
                            </div>
                          </div>
                        </Modal>
                      </Show>
                  </Button>
                  <Button class={`${userStyle().hover}`} enableBackgroundClick={true} menuItems={settingsOptions()} overrideX={isMobile() ? "42vw" : "93vw"} >
                    <SkinnySnowman  /> 
                  </Button>
                </span>
              </div>
              <div class="theLine"/>
              <For each={MenuItems()}>{(item)=>{
                return <div class="sidebar">
                  <div class="sideHead">
                    <h2>
                      <A onClick={()=>setDefaultShowList(old=>!old)} href={item.Link}>
                        {item.Name}
                      </A>
                    </h2>
                    <span class={`${userStyle().hover}`} onClick={()=>setMenuItems(old => {
                      item.isOpen = !item.isOpen;
                      return Clone([...old.filter(x=>x.Name!== item.Name), item].sort((a, b) => a.Name > b.Name ? 1 : -1));
                    })}>
                      {item.isOpen ? <UpArrow/> : <DownArrow/>}
                    </span>
                  </div>
                  <div class="theLine"/>
                  <Show when={item.isOpen}>
                    <ul class="sideBody">
                      <For each={item.children}>{(child)=>{
                        return <li>
                          <h3>
                            <A onClick={()=>setDefaultShowList(old=>!old)} href={child.Link}>
                              {child.Name}
                            </A>
                          </h3>
                          <Show when={child.Link.includes("homebrew")}>
                            <span>
                              <A onClick={()=>setDefaultShowList(old=>!old)} href={child.Link.replace('view','create')}>
                                <Pencil />
                              </A>
                              <A onClick={()=>setDefaultShowList(old=>!old)} href={child.Link}>
                                <Eye  />
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
          </Show>
  
          </div>
        </div>
      </SharedHookContext.Provider>
    );
  };

  export default RootApp;