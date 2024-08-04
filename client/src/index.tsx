/* @refresh reload */
import { effect, render } from "solid-js/web";
import { Router, Route, RouteSectionProps, A } from "@solidjs/router";
import { Component, createSignal, For, lazy, onMount, Show } from "solid-js";
import "./index.scss";
import App from "./App";
import 'solid-devtools';
const Characters = lazy(() => import("./components/characters/characters"));
const CharacterCreate = lazy(
  () => import("./components/characters/create/create")
);
const CharacterView = lazy(() => import("./components/characters/view/view"));
import { useRegisterSW } from "virtual:pwa-register/solid";
import Homebrew from "./components/homebrew/homebrew";
import Create from "./components/homebrew/create/create";
import View from "./components/homebrew/view/view";
import Classes from "./components/homebrew/create/parts/classes/classes";
import Items from "./components/homebrew/create/parts/items/items";
import Feats from "./components/homebrew/create/parts/feats/feats";
import Backgrounds from "./components/homebrew/create/parts/backgrounds/backgrounds";
import Spells from "./components/homebrew/create/parts/spells/spells";
import Races from "./components/homebrew/create/parts/races/races";
import masterSpells from "./components/infoTab/Spells/Spells";
import featsList from "./components/infoTab/Feats/feats";
import races from "./components/infoTab/Races/races";
import Viewbackgrounds from "./components/infoTab/Backgrounds/backgrounds";
import viewClasses from "./components/infoTab/viewClasses/viewClasses";
import Subclasses from "./components/homebrew/create/parts/subclasses/subclasses";
import RootApp from "./components/rootApp";
const root = document.getElementById("root");
if (import.meta.env.DEV && !(root instanceof HTMLElement)) {
  throw new Error(
    "Root element not found. Did you forget to add it to your index.html? Or maybe the id attribute got misspelled?"
  );
}

const intervalMS = 60 * 1000;
const { needRefresh, offlineReady, updateServiceWorker } = useRegisterSW({
  onRegisteredSW(url, r) {
    r &&
      setInterval(() => {
        Characters.preload();
        CharacterCreate.preload();
        CharacterView.preload();
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
const [needRefreshSig, setNeedRefresh] = needRefresh;
const [offlineReadySig, setOfflineReady] = offlineReady;

render(
  () => (
    <Router root={RootApp}>
      <Route path="/" component={App} />
      <Route path="/characters">
        <Route path="/" component={Characters} />
        <Route path="/view" component={CharacterView} />
        <Route path="/create" component={CharacterCreate} />
      </Route>
      <Route path="/info" >
        <Route path="/races" component={races} />
        <Route path="/spells" component={masterSpells} />
        <Route path="/feats" component={featsList} />
        <Route path="/classes" component={viewClasses} />
        <Route path="/backgrounds" component={Viewbackgrounds} />
        <Route path="/*any" component={masterSpells} />
      </Route>
      <Route path="/homebrew">
        <Route path="/" component={Homebrew} />
        <Route path="/view" component={View} />
        <Route path="/create" >
          <Route path="/" component={Create} />
          <Route path="/classes" component={Classes} />
          <Route path={"/subclasses"} component={Subclasses} />
          <Route path="/items" component={Items} />
          <Route path="/feats" component={Feats} />
          <Route path="/backgrounds" component={Backgrounds} />
          <Route path="/spells" component={Spells} />
          <Route path="/races" component={Races} />
        </Route>
        <Route path="/*any" component={View} />
      </Route>
    </Router>
  ),
  root!
);