import { RouteSectionProps, A } from "@solidjs/router";
import mobileCheck from '../shared/customHooks/utility/mobileCheck'
import useStyle from "../shared/customHooks/utility/style/styleHook";
import { MenuButton, Button, Select, Clone, UpArrow, DownArrow, Eye, Gear, Pencil, SkinnySnowman, getUserSettings, useInjectServices  } from "../shared";
import { Component, createSignal, Show, For, Accessor, createContext, JSX, Setter, children, useContext, createMemo, onMount, onCleanup } from "solid-js";
import { effect } from "solid-js/web";
import Navbar, { Tab } from "./navbar/navbar";
import { HookContext, ProviderProps } from "../models/hookContext";
import { ExtendedTab } from "../models/extendedTab";
import Modal from "../shared/components/popup/popup.component";
import { UserSettings } from "../models/userSettings";
import NavMenu from "./navMenu/navMenu";

const defaultValue: HookContext = {
  isMobile: createSignal(mobileCheck())[0], 
  showList: createSignal(false), 
  useStyle: ()=>({body: "", primary: "", accent: "", tertiary: "", warn: "", hover: "", popup: "", table: ""}),
	getMouse: ()=>({x: 0, y: 0})
};
export const SharedHookContext = createContext<HookContext>(defaultValue);

const Provider: Component<ProviderProps<HookContext>> = (props) => {
    return <SharedHookContext.Provider value={props.value}>{props.children}</SharedHookContext.Provider>
}

const RootApp: Component<RouteSectionProps<unknown>> = (props) => {
  const [defaultUserSettings, setDefaultUserSettings] = getUserSettings();
    const userStyle = createMemo(()=>useStyle(defaultUserSettings().theme));
    const [defaultShowList, setDefaultShowList] = createSignal(!mobileCheck());
    const [defaultIsMobile, setDefaultIsMobile] = createSignal(mobileCheck());
		const [mouse, setMouse] = createSignal({x: 0, y: 0});
    effect(()=>{
      defaultShowList()
      setDefaultIsMobile(mobileCheck());
    })
    const clickIntercept = () => {
      if (mobileCheck()) {
        setDefaultShowList(false);
      } else {
        setDefaultShowList(window.matchMedia("only screen and (max-width: 768px)").matches)
      }
    };
    setDefaultIsMobile(mobileCheck());
      window.addEventListener('resize', clickIntercept);
    
    effect(() => {
      const check = mobileCheck() || window.innerWidth <= 768 ? true : false;
      // setDefaultShowList(!check);
    });
		const mouseCapture = (e: MouseEvent) => setMouse({x: e.clientX, y: e.clientY});

		onMount(()=>{
			window.addEventListener('mousemove', mouseCapture)
		})

		onCleanup(()=>{
			window.removeEventListener('mousemove', mouseCapture)
		})
  
  const {isMobile} = useInjectServices();
    return (
      <Provider value={{
        isMobile: defaultIsMobile,
        showList: [defaultShowList, setDefaultShowList],
        useStyle: useStyle,
				getMouse: ()=>mouse()
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
      </Provider>
    );
  };

  export default RootApp;