import { RouteSectionProps, useNavigate } from "@solidjs/router";
import mobileCheck from '../shared/customHooks/utility/tools/mobileCheck'
import useStyle from "../shared/customHooks/utility/style/styleHook";
import { getUserSettings, useInjectServices } from "../shared";
import { Component, createSignal, createContext, createMemo, onMount, onCleanup, createEffect, ErrorBoundary, For, Show } from "solid-js";
import { effect } from "solid-js/web";
import Navbar from "./navbar/navbar";
import { HookContext, ProviderProps } from "../models/hookContext";
import NavMenu from "./navMenu/navMenu";
import { addTheme, Button, Container, SnackbarController } from "coles-solid-library";
import { UserSettings } from "../models/userSettings";
import { useDnDSpells } from "../shared/customHooks/dndInfo/info/all/spells";
import styles from './rootApp.module.scss';

const defaultValue: HookContext = {
  isMobile: createSignal(mobileCheck())[0], 
  showList: createSignal(false), 
  useStyle: ()=>({body: "", primary: "", accent: "", tertiary: "", warn: "", hover: "", popup: "", table: "", box: ""}),
  getMouse: ()=>({x: 0, y: 0})
};
export const SharedHookContext = createContext<HookContext>(defaultValue);

const Provider: Component<ProviderProps<HookContext>> = (props: ProviderProps<HookContext>) => {
  return <SharedHookContext.Provider value={props.value}>{props.children}</SharedHookContext.Provider>
}

const RootApp: Component<RouteSectionProps<unknown>> = (props) => {
  let [defaultUserSettings, setDefaultUserSettings] = createSignal<UserSettings>({
    theme: 'default',
    userId: 0,
    username: "",
    email: "",
    dndSystem: '2024'
  });
  
  try {
    // Try to get user settings but fall back to defaults if it fails
    [defaultUserSettings, setDefaultUserSettings] = getUserSettings();
  } catch (error) {
    console.error("Failed to load user settings:", error);
    // Keep using the default theme
  }
  
  const userStyle = createMemo(() => {
    try {
      const theme = defaultUserSettings().theme;
      return useStyle(theme);
    } catch (error) {
      console.error("Failed to apply style:", error);
      return {body: "", primary: "", accent: "", tertiary: "", warn: "", hover: "", popup: "", table: "", box: ""};
    }
  });
  
  const [defaultShowList, setDefaultShowList] = createSignal(false);
  const [defaultIsMobile, setDefaultIsMobile] = createSignal(mobileCheck());
  const [mouse, setMouse] = createSignal({x: 0, y: 0});
  
  effect(() => {
    defaultShowList()
    setDefaultIsMobile(mobileCheck());
  })
  useDnDSpells();
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
      addTheme(theme);
    } catch (error) {
      console.error("Failed to add theme:", error);
    }
  })

  const mouseCapture = (e: MouseEvent) => setMouse({x: e.clientX, y: e.clientY});

  onMount(() => {
    window.addEventListener('mousemove', mouseCapture)
  })

  onCleanup(() => {
    window.removeEventListener('mousemove', mouseCapture)
  })
  
  let isMobile;
  try {
    const services = useInjectServices();
    isMobile = services.isMobile;
  } catch (error) {
    console.error("Failed to inject services:", error);
    // Fallback to our direct check
    isMobile = () => defaultIsMobile();
  }
  
  const [menuAnchor, setMenuAnchor] = createSignal<HTMLElement | undefined>();
  
  const navigate = useNavigate();

  // --------quickLinks Memo---------
  const quickLinks = createMemo<{
    name: string;
    link: string;
  }[]>(()=>[
    {name:"Characters", link:"/characters"},
    {name:"Create Characters", link:"/characters/create"},
    {name:"Spells", link:"/info/spells"}
  ])

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
          <Container theme="subheader"   class={`${styles.subheader}`}>
            <span></span> {/* empty span to push buttons over */}
            <For each={quickLinks()}>
              {(quickLink,i)=><>
                <Button transparent onClick={()=>navigate(quickLink.link)}>
                  {quickLink.name}
                  
                </Button>
                {/* <Show when={quickLinks().length !== i()}>
                  
                </Show> */}
                </>}
            </For>
          </Container>
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
          <footer
            style={{
              opacity: "45%",
              width: "70%",
              "margin-top": "8px",
              bottom: 0,
              "margin-left": "15%",
            }}

          >
            <Button onClick={()=>navigate("/about")}>About</Button>
          </footer>
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