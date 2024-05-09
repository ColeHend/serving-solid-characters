/* @refresh reload */
import { render } from 'solid-js/web';

import './index.css';
import App from './App';
import { Router, Route, RouteSectionProps } from "@solidjs/router";
import Navbar from './components/navbar/navbar';
import useStyle from './customHooks/utility/style/styleHook';
import useTabs from './customHooks/utility/tabBar';
import { Component, JSX } from 'solid-js';
import masterSpells from './components/infoTab/Spells/Spells';

const root = document.getElementById('root');

if (import.meta.env.DEV && !(root instanceof HTMLElement)) {
  throw new Error(
    'Root element not found. Did you forget to add it to your index.html? Or maybe the id attribute got misspelled?',
  );
}


const RootApp: Component<RouteSectionProps<unknown>> = (props)=>{
  const stylin = useStyle(); 
  
  return <div style={{"height": "100vh", "max-height": "100vh","overflow-y": "hidden"}} class={stylin.primary}>
  <Navbar style={stylin.accent} />
  {props.children}
  </div>
}    

render(()=> <Router root={RootApp}>
<Route path="/" component={App} /> 
<Route path="/info/spells" component={masterSpells} />
</Router>, root!)

