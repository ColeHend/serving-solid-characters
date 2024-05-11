/* @refresh reload */
import { effect, render } from "solid-js/web";
import { Router, Route, RouteSectionProps } from "@solidjs/router";
import { Component, createSignal, lazy, onMount } from "solid-js";
import "./index.css";
import App from "./App";
import Navbar from "./components/navbar/navbar";
import useStyle from "./customHooks/utility/style/styleHook";
const Characters = lazy(() => import("./components/characters/characters"));
const CharacterCreate = lazy(
  () => import("./components/characters/create/create")
);
const CharacterView = lazy(() => import("./components/characters/view/view"));
import { useRegisterSW } from "virtual:pwa-register/solid";
import masterSpells from "./components/infoTab/Spells/Spells";
const root = document.getElementById("root");
if (import.meta.env.DEV && !(root instanceof HTMLElement)) {
  throw new Error(
    "Root element not found. Did you forget to add it to your index.html? Or maybe the id attribute got misspelled?"
  );
}

const intervalMS = 20 * 1000;
const { needRefresh, offlineReady, updateServiceWorker } = useRegisterSW({
  onRegisteredSW(url, r) {
    r &&
      setInterval(() => {
        Characters.preload();
        CharacterCreate.preload();
        CharacterView.preload();
        console.log("onRegisteredSW: ", r);
        console.log("onRegisteredSW.url: ", url);
        r.update();
      }, intervalMS);
  },
  onRegisterError(error) {
    console.log("SW registration error", error);
  },
  onNeedRefresh() {
    console.log("onNeedRefresh");
  },
  onOfflineReady() {
    console.log("onOfflineReady");
  },
});

const RootApp: Component<RouteSectionProps<unknown>> = (props) => {
  const stylin = useStyle();

  effect(() => {
    console.log("updateServiceWorker.needRefresh: ", needRefresh[0]());
  });
  effect(() => {
    console.log("updateServiceWorker.offlineReady: ", offlineReady[0]());
  });
  const [showList, setShowList] = createSignal(window.innerWidth <= 768);

  onMount(() => {
    window.addEventListener("load", (ev) => {
      setShowList(window.innerWidth <= 768);
    });
  });

  effect(() => {
    console.log("showlist:", window.innerWidth, showList());
  });

  return (
    <div style={{ height: "100vh" }} class={stylin.primary}>
      <Navbar list={[showList, setShowList]} style={stylin.accent} />
      {props.children}
    </div>
  );
};

render(
  () => (
    <Router root={RootApp}>
      <Route path="/" component={App} />
      <Route path="/characters">
        <Route path="/" component={Characters} />
        <Route path="/view" component={CharacterView} />
        <Route path="/create" component={CharacterCreate} />
        <Route path="/info/spells" component={masterSpells} />
      </Route>
    </Router>
  ),
  root!
);
