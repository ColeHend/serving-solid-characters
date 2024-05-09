/* @refresh reload */
import { render } from 'solid-js/web';
import { Router, Route, RouteSectionProps } from "@solidjs/router";
import { Component, JSX, lazy } from 'solid-js';
import './index.css';
import App from './App';
const Characters = lazy(() => import('./components/characters/characters'));
const CharacterCreate = lazy(() => import('./components/characters/create/create'));
const CharacterView = lazy(() => import('./components/characters/view/view'));
import Navbar from './components/navbar/navbar';

import useStyle from './customHooks/utility/style/styleHook';
import useTabs from './customHooks/utility/tabBar';

const root = document.getElementById('root');

if (import.meta.env.DEV && !(root instanceof HTMLElement)) {
  throw new Error(
    'Root element not found. Did you forget to add it to your index.html? Or maybe the id attribute got misspelled?',
  );
}


const RootApp: Component<RouteSectionProps<unknown>> = (props)=>{
  const stylin = useStyle(); 
  
  return <div style={{"height": "100vh"}} class={stylin.primary}>
  <Navbar style={stylin.accent} />
  {props.children}
  </div>
}    

render(()=> <Router root={RootApp}>
<Route path="/" component={App} />
<Route path="/characters">
  <Route path="/" component={Characters} />
  <Route path="/view" component={CharacterView} />
  <Route path="/create" component={CharacterCreate} />
</Route>
</Router>, root!)
