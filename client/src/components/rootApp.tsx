import { RouteSectionProps, A } from "@solidjs/router";
import { Component, createSignal, Show, For, Accessor, createContext, JSX, Setter, children, useContext, createMemo } from "solid-js";
import { effect } from "solid-js/web";
import Navbar, { Tab } from "./navbar/navbar";
import { MenuButton, Button, Select } from "../shared/components";
import useBaseStyle, { Style } from "../shared/customHooks/utility/style/styleHook";
import { Clone } from "../shared/customHooks/utility/Tools";
import { UpArrow, DownArrow } from "../shared/svgs/arrows";
import Eye from "../shared/svgs/eye";
import Gear from "../shared/svgs/gear";
import Pencil from "../shared/svgs/pencil";
import SkinnySnowman from "../shared/svgs/skinnySnowman";
import { HookContext, ProviderProps } from "../models/hookContext";
import { ExtendedTab } from "../models/extendedTab";
import Modal from "../shared/components/popup/popup.component";
import { UserSettings } from "../models/userSettings";
import getUserSettings from "../shared/customHooks/userSettings";
import { useInjectServices } from "../shared/customHooks/injectServices";
import { mobileCheck } from "../shared/customHooks/utility/mobileCheck";
import NavMenu from "./navMenu/navMenu";

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
            <NavMenu userStyle={userStyle} defaultShowList={defaultShowList} setDefaultShowList={setDefaultShowList} defaultIsMobile={defaultIsMobile} setDefaultIsMobile={setDefaultIsMobile} defaultUserSettings={defaultUserSettings} setDefaultUserSettings={setDefaultUserSettings} />
          </Show>
  
          </div>
        </div>
      </SharedHookContext.Provider>
    );
  };

  export default RootApp;