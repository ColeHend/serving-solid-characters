import { RouteSectionProps } from "@solidjs/router";
import mobileCheck from '../shared/customHooks/utility/mobileCheck'
import useStyle from "../shared/customHooks/utility/style/styleHook";
import { getUserSettings, useInjectServices, useDnDClasses, useDnDFeats, useDnDItems, useDnDRaces, useDnDSpells  } from "../shared";
import { Component, createSignal, Show, createContext, createMemo, onMount, onCleanup } from "solid-js";
import { effect } from "solid-js/web";
import Navbar from "./navbar/navbar";
import { HookContext, ProviderProps } from "../models/hookContext";
import NavMenu from "./navMenu/navMenu";
import { SnackbarController } from "../shared/components/Snackbar/snackbar";

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
    document.body.setAttribute("data-theme", defaultUserSettings().theme);
  })
  const mouseCapture = (e: MouseEvent) => setMouse({x: e.clientX, y: e.clientY});

  onMount(()=>{
    useDnDClasses();
    useDnDSpells();
    useDnDFeats();
    useDnDRaces();
    useDnDItems();
    window.addEventListener('mousemove', mouseCapture)
  })

  onCleanup(()=>{
    window.removeEventListener('mousemove', mouseCapture)
  })
  console.log("theme", defaultUserSettings().theme);
  
  const {isMobile} = useInjectServices();
  return (
    <Provider value={{
      isMobile: defaultIsMobile,
      showList: [defaultShowList, setDefaultShowList],
      useStyle: useStyle,
      getMouse: ()=>mouse()
    }}>
      <div 
        style={{ height: "100vh" }} 
        class={userStyle().body}>
        <Navbar 
          isMobile={isMobile()} 
          style={"margin-bottom: 15px;"} 
          list={[defaultShowList, setDefaultShowList]} />
        <div class="body">
          <span class={`${defaultShowList() ? "openFirst": "closeFirst"}`}>
            {props.children}
          </span>
          <Show when={defaultShowList()}>
            <NavMenu 
              userStyle={userStyle} 
              defaultShowList={defaultShowList} 
              setDefaultShowList={setDefaultShowList} 
              defaultIsMobile={defaultIsMobile} 
              setDefaultIsMobile={setDefaultIsMobile} 
              defaultUserSettings={defaultUserSettings} 
              setDefaultUserSettings={setDefaultUserSettings} />
          </Show>
        </div>
      </div>
      <SnackbarController />
    </Provider>
  );
};

export default RootApp;