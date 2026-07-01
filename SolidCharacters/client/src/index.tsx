/* @refresh reload */
import { render } from "solid-js/web";
import { Router, Route } from "@solidjs/router";
import { Show, ErrorBoundary, lazy } from "solid-js";
import "./index.scss";
import App from "./App";
import 'solid-devtools';
import ReloadPrompt from "./ReloadPrompt";
import { registerServiceWorker, needRefresh, offlineReady, swVersion, swBuildTime, applyUpdateAndReload } from './pwa/register';
import { initInstallFlow } from './pwa/install';
import { initPreloadRecovery } from './pwa/preloadRecovery';
import RootApp from "./components/rootApp";
import ErrorFallback from "./shared/components/errorFallback";

// Auto-heal lazy chunk / CSS preload failures (stale-SW transitions) before anything renders.
initPreloadRecovery();

// Route components are lazy-loaded so each splits into its own chunk, keeping the initial
// bundle small. Heavy, route-local deps (e.g. pdf-lib via the PDF route) ride along with
// their own chunk instead of bloating the entry. The Router supplies the Suspense boundary.
const Homebrew = lazy(() => import("./components/homebrew/homebrew"));
const Classes = lazy(() => import("./components/homebrew/create/parts/classes/classes").then(m => ({ default: m.Classes })));
const Items = lazy(() => import("./components/homebrew/create/parts/items/items"));
const Feats = lazy(() => import("./components/homebrew/create/parts/feats/feats"));
const Spells = lazy(() => import("./components/homebrew/create/parts/spells/spells"));
const Races = lazy(() => import("./components/homebrew/create/parts/races/races"));
const masterSpells = lazy(() => import("./components/infoTab/Spells/Spells"));
const featsList = lazy(() => import("./components/infoTab/Feats/feats"));
const races = lazy(() => import("./components/infoTab/Races/races"));
const Viewbackgrounds = lazy(() => import("./components/infoTab/Backgrounds/backgrounds"));
const viewClasses = lazy(() => import("./components/infoTab/viewClasses/viewClasses"));
const Subclasses = lazy(() => import("./components/homebrew/create/parts/subclasses/subclasses"));
const ItemsViewTab = lazy(() => import("./components/infoTab/items/item"));
const Subraces = lazy(() => import("./components/homebrew/create/parts/subraces/subraces"));
const aboutPage = lazy(() => import("./components/aboutPage/about").then(m => ({ default: m.aboutPage })));
const Characters = lazy(() => import("./components/characters/characters"));
const CharacterCreate = lazy(() => import("./components/characters/create/create"));
const CharacterView = lazy(() => import("./components/characters/view/view"));
const CreateCharacterPDF = lazy(() => import("./components/characters/characterCreatePDF/characterCreatePDF").then(m => ({ default: m.CreateCharacterPDF })));
const HomebrewBackgrounds = lazy(() => import("./components/homebrew/Parts/background/Background").then(m => ({ default: m.HomebrewBackgrounds })));
const DMCommand = lazy(() => import("./components/dmCommand/dmCommand"));

console.log("Application initializing...");

const root = document.getElementById("root");
if (!root) {
  console.error("ROOT ELEMENT NOT FOUND! Application cannot mount!");
  document.body.innerHTML = `
    <div style="min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;background:#121212;color:#fff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;padding:20px;text-align:center;">
      <h1 style="margin:0;">Something went wrong</h1>
      <p style="opacity:.8;margin:0;">The app couldn't find its mount point. Please reload the page.</p>
    </div>
  `;
} else {
  console.log("Root element found, continuing initialization");
}

if (root) {
  // Clear the static HTML app-shell loader (index.html) and mount synchronously — no artificial
  // delay; the Router's Suspense + lazy routes handle async chunk loading from here.
  root.innerHTML = '';
  render(() => (
      <ErrorBoundary fallback={(err) => <ErrorFallback error={err} title="Couldn't load the app" />}>
        <ReloadPrompt
          needRefresh={needRefresh()}
          offlineReady={offlineReady()}
          updateServiceWorker={applyUpdateAndReload}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          version={swVersion() || (import.meta as any).env?.VITE_APP_VERSION}
        />
        {/* Dev-only build/version badge — never shipped to production. Sits below the update
            toast's z-index so it can't occlude the "Reload" prompt. */}
        <Show when={(import.meta as any).env?.DEV && swVersion()}>
          <div aria-label="App version" style="position:fixed;bottom:4px;right:8px;font-size:11px;opacity:.6;background:var(--surface-color, #222);color:var(--on-surface-color, #fff);padding:2px 6px;border-radius:4px;z-index:50;">
            v{swVersion()}<Show when={swBuildTime()}> <span>{new Date(swBuildTime()!).toLocaleTimeString()}</span></Show>
          </div>
        </Show>
        <Router root={RootApp}>
          <Route path="/" component={App} />
          <Route path="/characters">
            <Route path="/" component={Characters} />
            <Route path="/view" component={CharacterView} />
            <Route path="/create" component={CharacterCreate} />
            <Route path="/pdfCreate" component={CreateCharacterPDF} />
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
            <Route path="/create" >
              <Route path="/classes" component={Classes} />
              <Route path="/subclasses" component={Subclasses} />
              <Route path="/items" component={Items} />
              <Route path="/feats" component={Feats} />
              <Route path="/backgrounds" component={HomebrewBackgrounds} />
              <Route path="/spells" component={Spells} />
              <Route path="/races" component={Races} />
              <Route path="/subraces" component={Subraces} />
            </Route>
            <Route path="/*any" component={Homebrew} />
          </Route>
          <Route path="/dm">
            <Route path="/command" component={DMCommand} />
          </Route>
          <Route path="/about" component={aboutPage}></Route>
        </Router>
      </ErrorBoundary>
  ), root);
}

if (root) {
  registerServiceWorker();
  initInstallFlow();
}