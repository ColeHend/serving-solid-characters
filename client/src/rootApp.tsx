import { RouteSectionProps, A } from "@solidjs/router";
import { Component, createSignal, Show, For, Accessor, createContext, JSX, Setter } from "solid-js";
import { effect } from "solid-js/web";
import Navbar, { Tab } from "./components/navbar/navbar";
import { MenuButton, Button } from "./shared/components";
import useStyle, { Style } from "./shared/customHooks/utility/style/styleHook";
import { Clone } from "./shared/customHooks/utility/Tools";
import { UpArrow, DownArrow } from "./shared/svgs/arrows";
import Eye from "./shared/svgs/eye";
import Gear from "./shared/svgs/gear";
import Pencil from "./shared/svgs/pencil";
import SkinnySnowman from "./shared/svgs/skinnySnowman";
import { HookContext, ProviderProps } from "./models/hookContext";
import { ExtendedTab } from "./models/extendedTab";

export const SharedHookContext = createContext<HookContext>();

const Provider: Component<ProviderProps<HookContext>> = (props) => {
    return <SharedHookContext.Provider value={props.value}>{props.children}</SharedHookContext.Provider>
}

const RootApp: Component<RouteSectionProps<unknown>> = (props) => {
    const stylin = useStyle();
    const mobileCheck = function() {
      let check = false;
      (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor);
      return check;
    };
    const [showList, setShowList] = createSignal(!mobileCheck());
    const [isMobile, setIsMobile] = createSignal(mobileCheck());
    effect(()=>{
      showList()
      setIsMobile(mobileCheck());
    })
    const clickIntercept = () => setShowList(window.matchMedia("only screen and (max-width: 768px)").matches);
      setIsMobile(mobileCheck());
      window.addEventListener('resize', clickIntercept);
    
    effect(() => {
      const check = mobileCheck() || window.innerWidth <= 768 ? true : false;
      setShowList(!check);
    });
  
    const [MenuItems, setMenuItems] = createSignal<ExtendedTab[]>([
      {
        Name: "Characters", Link: "/characters",
        isOpen: false
      }, 
      {
        Name: "Info", Link: "/info",
        isOpen: false
      }, 
      {
        Name: "Homebrew", Link: "/homebrew",
        isOpen: false
      }
    ].sort((a, b) => a.Name > b.Name ? 1 : -1));
    const charChildMenu: ExtendedTab[] = [
      { Name: "View", Link: "/view", isOpen: false },
      { Name: "Create", Link: "/create", isOpen: false }
    ];
    const infoChildMenu: ExtendedTab[] = [
      { Name: "Spells", Link: "/info/spells", isOpen: false },
      { Name: "Feats", Link: "/info/feats", isOpen: false },
      { Name: "Classes", Link: "/info/classes", isOpen: false },
      { Name: "Backgrounds", Link: "/info/backgrounds", isOpen: false },
      { Name: "Items", Link: "/info/items", isOpen: false },
      { Name: "Races", Link: "/info/races", isOpen: false }
    ];
    const homebrewChildMenu: ExtendedTab[] = [
      { Name: "Spells", Link: "/homebrew/view/spells", isOpen: false },
      { Name: "Feats", Link: "/homebrew/view/feats", isOpen: false },
      { Name: "Classes", Link: "/homebrew/view/classes", isOpen: false },
      { Name: "Subclasses", Link: "/homebrew/view/subclasses", isOpen: false },
      { Name: "Backgrounds", Link: "/homebrew/view/backgrounds", isOpen: false },
      { Name: "Items", Link: "/homebrew/view/items", isOpen: false },
      { Name: "Races", Link: "/homebrew/view/races", isOpen: false }
    ];
    const menuChildButtons: (tab: ExtendedTab) => ExtendedTab[] = (tab) => {
      switch (tab.Name) {
        case "Characters":
          return charChildMenu;
        case "Info":
          return infoChildMenu;
        case "Homebrew":
          return homebrewChildMenu;
      };
      return [];
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
      <SharedHookContext.Provider value={{
        isMobile,
        showList: [showList, setShowList],
        useStyle
      }}>
        <div style={{ height: "100vh" }} class={stylin.body}>
        <Navbar isMobile={isMobile()} style={"margin-bottom: 15px;"} list={[showList, setShowList]} />
        <div class="body">
          <span class={`${showList() ? "openFirst": "closeFirst"}`}>
            {props.children}
          </span>
          <Show when={showList()}>
            <span class={`${stylin.primary} ${showList() ? `navOpen` : `navClosed`}`}>
              <div class={`${stylin.accent} topper`}>
                <h1>
                  Navigation
                </h1>
                <span>
                  <Button class={`${stylin.hover}`} >
                    <Gear />
                  </Button>
                  <Button class={`${stylin.hover}`} enableBackgroundClick={true} menuItems={settingsOptions()} overrideX={isMobile() ? "42vw" : "93vw"} >
                    <SkinnySnowman  /> 
                  </Button>
                </span>
              </div>
              <div class="theLine"/>
              <For each={MenuItems()}>{(item)=>{
                return <div class="sidebar">
                  <div class="sideHead">
                    <h2>
                      <A onClick={()=>setShowList(old=>!old)} href={item.Link}>
                        {item.Name}
                      </A>
                    </h2>
                    <span class={`${stylin.hover}`} onClick={()=>setMenuItems(old => {
                      item.isOpen = !item.isOpen;
                      return Clone([...old.filter(x=>x.Name!== item.Name), item].sort((a, b) => a.Name > b.Name ? 1 : -1));
                    })}>
                      {item.isOpen ? <UpArrow/> : <DownArrow/>}
                    </span>
                  </div>
                  <div class="theLine"/>
                  <Show when={item.isOpen}>
                    <ul class="sideBody">
                      <For each={menuChildButtons(item)}>{(child)=>{
                        return <li>
                          <h3>
                            <A onClick={()=>setShowList(old=>!old)} href={child.Link}>
                              {child.Name}
                            </A>
                          </h3>
                          <Show when={child.Link.includes("homebrew")}>
                            <span>
                              <A onClick={()=>setShowList(old=>!old)} href={child.Link.replace('view','create')}>
                                <Pencil />
                              </A>
                              <A onClick={()=>setShowList(old=>!old)} href={child.Link}>
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