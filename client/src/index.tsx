/* @refresh reload */
import { effect, render } from "solid-js/web";
import { Router, Route, RouteSectionProps, A } from "@solidjs/router";
import { Component, createSignal, For, lazy, onMount, Show, ErrorBoundary } from "solid-js";
import "./index.scss";
import App from "./App";
import 'solid-devtools';
const Characters = lazy(() => import("./components/characters/characters"));
const CharacterCreate = lazy(
  () => import("./components/characters/create/create")
);
const CharacterView = lazy(() => import("./components/characters/view/view"));
import ReloadPrompt from "./ReloadPrompt";
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

console.log("Application initializing...");

const root = document.getElementById("root");
if (!root) {
  // This is more critical than we thought - if there's no root element, log it clearly
  console.error("ROOT ELEMENT NOT FOUND! Application cannot mount!");
  
  // Try to create a visible error for the user
  document.body.innerHTML = `
    <div style="color: red; background: white; padding: 20px; font-family: sans-serif;">
      <h1>Critical Error</h1>
      <p>The application could not find the root element to mount on.</p>
      <p>This may be due to a missing div with id="root" in the HTML template.</p>
    </div>
  `;
} else {
  console.log("Root element found, continuing initialization");
}

// Initialize basic signals for PWA functionality
const [needRefresh, setNeedRefresh] = createSignal(false);
const [offlineReady, setOfflineReady] = createSignal(false);
let updateServiceWorker = () => Promise.resolve();

// Continue only if root element exists
if (root) {
  // Render a basic loading indicator immediately to show the app is working
  root.innerHTML = `
    <div style="display: flex; justify-content: center; align-items: center; height: 100vh; flex-direction: column;">
      <h2>Loading application...</h2>
      <p>Please wait while the app initializes</p>
    </div>
  `;

  // Delay the actual render to allow indexedDB to initialize
  setTimeout(() => {
    // Clear the loading indicator
    root.innerHTML = '';
    
    // Now render the actual application
    render(
      () => {
        console.log("Rendering application root component");
        return (
          <ErrorBoundary fallback={(err) => {
            console.error("Rendering error:", err);
            return <div style="padding: 20px; color: red; background: white;">
              <h2>Something went wrong rendering the application</h2>
              <pre>{err.toString()}</pre>
              <button onClick={() => window.location.reload()}>Reload Application</button>
            </div>;
          }}>
            <ReloadPrompt 
              needRefresh={needRefresh()} 
              offlineReady={offlineReady()} 
              updateServiceWorker={updateServiceWorker} 
            />
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
            </Router>
          </ErrorBoundary>
        );
      },
      root
    );

    console.log("Application mounted successfully");
  }, 100); // Small delay to ensure browser has time to process
}

// Register service worker after the app renders to prevent it from blocking
if (root) {
  try {
    import('virtual:pwa-register/solid').then(({ useRegisterSW }) => {
      console.log("Registering service worker...");
      const { updateServiceWorker: swUpdate } = useRegisterSW({
        immediate: false,
        onRegisteredSW(swUrl, registration) {
          console.log(`Service worker registered at: ${swUrl}`);
        },
        onRegisterError(error) {
          console.error("SW registration error", error);
        },
        onNeedRefresh() {
          console.log("New content available, refresh needed");
          setNeedRefresh(true);
        },
        onOfflineReady() {
          console.log("App ready to work offline");
          setOfflineReady(true);
        },
      });
      
      // Store the update function for the ReloadPrompt component
      updateServiceWorker = swUpdate;
      
      console.log("Service worker registered successfully");
    }).catch(error => {
      console.error("Failed to register service worker:", error);
    });
  } catch (error) {
    console.error("Error setting up service worker:", error);
  }
}