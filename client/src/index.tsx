/* @refresh reload */
import { effect, render } from "solid-js/web";
import { Router, Route } from "@solidjs/router";
import { lazy, Show, ErrorBoundary } from "solid-js";
import "./index.scss";
// Import PDF.js global configuration first
import './pdf-config';
import App from "./App";
import 'solid-devtools';
const Characters = lazy(() => import("./components/characters/characters"));
const CharacterCreate = lazy(() => import("./components/characters/create/create"));
const CharacterView = lazy(() => import("./components/characters/view/view"));
import ReloadPrompt from "./ReloadPrompt";
import { registerServiceWorker, needRefresh, offlineReady, swVersion, swBuildTime, applyUpdateAndReload } from './pwa/register';
import Homebrew from "./components/homebrew/homebrew";
import View from "./components/homebrew/view/view";
import { Classes } from "./components/homebrew/create/parts/classes/classes";
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
import ItemsViewTab from "./components/infoTab/items/item";
import Subraces from "./components/homebrew/create/parts/subraces/subraces";
import { aboutPage } from "./components/aboutPage/about";

console.log("Application initializing...");

const root = document.getElementById("root");
if (!root) {
  console.error("ROOT ELEMENT NOT FOUND! Application cannot mount!");
  document.body.innerHTML = `
    <div style="color: red; background: white; padding: 20px; font-family: sans-serif;">
      <h1>Critical Error</h1>
      <p>The application could not find the root element to mount on.</p>
    </div>
  `;
} else {
  console.log("Root element found, continuing initialization");
}

if (root) {
  root.innerHTML = `
    <div style="display: flex; justify-content: center; align-items: center; height: 100vh; flex-direction: column;">
      <h2>Loading application...</h2>
      <p>Please wait while the app initializes</p>
    </div>
  `;

  setTimeout(() => {
    root.innerHTML = '';
    render(() => (
      <ErrorBoundary fallback={(err) => (
        <div style="padding: 20px; color: red; background: white;">
          <h2>Something went wrong rendering the application</h2>
          <pre>{err.toString()}</pre>
          <button onClick={() => window.location.reload()}>Reload Application</button>
        </div>
      )}>
        <ReloadPrompt
          needRefresh={needRefresh()}
          offlineReady={offlineReady()}
          updateServiceWorker={applyUpdateAndReload}
          version={swVersion() || (import.meta as any).env?.VITE_APP_VERSION}
        />
        <Show when={swVersion()}>
          <div style="position:fixed;bottom:4px;right:8px;font-size:11px;opacity:.6;background:#222;color:#fff;padding:2px 6px;border-radius:4px;z-index:9999;">
            v{swVersion()}<Show when={swBuildTime()}> <span>{new Date(swBuildTime()!).toLocaleTimeString()}</span></Show>
          </div>
        </Show>
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
            <Route path="/items" component={ItemsViewTab} />
            <Route path="/*any" component={masterSpells} />
          </Route>
          <Route path="/homebrew">
            <Route path="/" component={Homebrew} />
            <Route path="/view" component={View} />
            <Route path="/create" >
              <Route path="/classes" component={Classes} />
              <Route path={"/subclasses"} component={Subclasses} />
              <Route path="/items" component={Items} />
              <Route path="/feats" component={Feats} />
              <Route path="/backgrounds" component={Backgrounds} />
              <Route path="/spells" component={Spells} />
              <Route path="/races" component={Races} />
              <Route path="/subraces" component={Subraces} />
            </Route>
            <Route path="/*any" component={View} />
          </Route>
          <Route path="/about" component={aboutPage}></Route>
        </Router>
      </ErrorBoundary>
    ), root);
  }, 100);
}

if (root) registerServiceWorker();