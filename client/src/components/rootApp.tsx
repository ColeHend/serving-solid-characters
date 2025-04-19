import { RouteSectionProps } from "@solidjs/router";
import mobileCheck from '../shared/customHooks/utility/mobileCheck'
import useStyle from "../shared/customHooks/utility/style/styleHook";
import { getUserSettings, useInjectServices, useDnDClasses, useDnDFeats, useDnDItems, useDnDRaces, useDnDSpells } from "../shared";
import { Component, createSignal, createContext, createMemo, onMount, onCleanup, createEffect, ErrorBoundary } from "solid-js";
import { effect } from "solid-js/web";
import Navbar from "./navbar/navbar";
import { HookContext, ProviderProps } from "../models/hookContext";
import NavMenu from "./navMenu/navMenu";
import { addTheme, Container, SnackbarController } from "coles-solid-library";
import { UserSettings } from "../models/userSettings";

const defaultValue: HookContext = {
  isMobile: createSignal(mobileCheck())[0], 
  showList: createSignal(false), 
  useStyle: ()=>({body: "", primary: "", accent: "", tertiary: "", warn: "", hover: "", popup: "", table: ""}),
  getMouse: ()=>({x: 0, y: 0})
};
export const SharedHookContext = createContext<HookContext>(defaultValue);

const Provider: Component<ProviderProps<HookContext>> = (props: ProviderProps<HookContext>) => {
  return <SharedHookContext.Provider value={props.value}>{props.children}</SharedHookContext.Provider>
}

const RootApp: Component<RouteSectionProps<unknown>> = (props) => {
  console.log("RootApp component initializing");
  
  let [defaultUserSettings, setDefaultUserSettings] = createSignal<UserSettings>({
    theme: 'default',
    userId: 0,
    username: "",
    email: ""
  });
  
  try {
    // Try to get user settings but fall back to defaults if it fails
    [defaultUserSettings, setDefaultUserSettings] = getUserSettings();
    console.log("User settings loaded:", defaultUserSettings());
  } catch (error) {
    console.error("Failed to load user settings:", error);
    // Keep using the default theme
  }
  
  const userStyle = createMemo(() => {
    try {
      const theme = defaultUserSettings().theme;
      console.log("Applying theme:", theme);
      return useStyle(theme);
    } catch (error) {
      console.error("Failed to apply style:", error);
      return {body: "", primary: "", accent: "", tertiary: "", warn: "", hover: "", popup: "", table: ""};
    }
  });
  
  const [defaultShowList, setDefaultShowList] = createSignal(false);
  const [defaultIsMobile, setDefaultIsMobile] = createSignal(mobileCheck());
  const [mouse, setMouse] = createSignal({x: 0, y: 0});
  
  effect(() => {
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

  createEffect(() => {
    try {
      const theme = defaultUserSettings().theme;
      console.log("Adding theme:", theme);
      addTheme(theme);
    } catch (error) {
      console.error("Failed to add theme:", error);
    }
  })

  const mouseCapture = (e: MouseEvent) => setMouse({x: e.clientX, y: e.clientY});

  onMount(() => {
    console.log("RootApp mounted");
    try {
      console.log("Loading DnD data...");
      useDnDClasses();
      useDnDSpells();
      useDnDFeats();
      useDnDRaces();
      useDnDItems();
      console.log("DnD data loaded successfully");
    } catch (error) {
      console.error("Failed to load DnD data:", error);
    }
    
    window.addEventListener('mousemove', mouseCapture)
  })

  onCleanup(() => {
    window.removeEventListener('mousemove', mouseCapture)
  })
  
  console.log("Current theme:", defaultUserSettings().theme);
  
  let isMobile;
  try {
    const services = useInjectServices();
    isMobile = services.isMobile;
    console.log("Services injected successfully");
  } catch (error) {
    console.error("Failed to inject services:", error);
    // Fallback to our direct check
    isMobile = () => defaultIsMobile();
  }
  
  const [menuAnchor, setMenuAnchor] = createSignal<HTMLElement | undefined>();
  
  return (
    <ErrorBoundary fallback={(err) => {
      console.error("Error in RootApp render:", err);
      return (
        <div style="padding: 20px; color: red; background: white; position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 9999;">
          <h2>Something went wrong in the application shell</h2>
          <pre>{err.toString()}</pre>
          <button onClick={() => window.location.reload()}>Reload Application</button>
        </div>
      );
    }}>
      <Provider value={{
        isMobile: defaultIsMobile,
        showList: [defaultShowList, setDefaultShowList],
        useStyle: useStyle,
        getMouse: () => mouse()
      }}>
        <div 
          style={{ height: "100vh" }} 
          class={userStyle().body || "fallback-body-class"}>
          <Navbar
            setAnchor={setMenuAnchor} 
            isMobile={isMobile()} 
            style={"margin-bottom: 15px;"} 
            list={[defaultShowList, setDefaultShowList]} />
          <Container theme="subheader" style={{"margin-bottom": '8px'}} ><></></Container>
          <div class="body">
            <ErrorBoundary fallback={(err) => {
              console.error("Error in route content:", err);
              return (
                <div style="padding: 20px; color: red;">
                  <h3>Error rendering this route</h3>
                  <pre>{err.toString()}</pre>
                </div>
              );
            }}>
              {props.children}
            </ErrorBoundary>
          </div>
        </div>
        <NavMenu
          anchorElement={menuAnchor} 
          userStyle={userStyle} 
          defaultShowList={defaultShowList} 
          setDefaultShowList={setDefaultShowList} 
          defaultIsMobile={defaultIsMobile} 
          setDefaultIsMobile={setDefaultIsMobile} 
          defaultUserSettings={defaultUserSettings as any} 
          setDefaultUserSettings={setDefaultUserSettings as any} />
        <SnackbarController />
      </Provider>
    </ErrorBoundary>
  );
};

export default RootApp;