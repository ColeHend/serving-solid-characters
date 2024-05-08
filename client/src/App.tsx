import { type Component, For, createResource } from 'solid-js';
import { effect } from 'solid-js/web';
import useDnDClasses from './customHooks/dndInfo/useDnDClasses';
import useStyle from './customHooks/utility/style/styleHook';
import useDnDSpells from './customHooks/dndInfo/useDnDSpells';
import useDnDFeats from './customHooks/dndInfo/useDnDFeats';
import useDnDRaces from './customHooks/dndInfo/useDnDRaces';
import useDnDBackgrounds from './customHooks/dndInfo/useDnDBackgrounds';
import useDnDItems from './customHooks/dndInfo/useDnDItems';
import styles from './App.module.css';

const App: Component = () => {
  const stylin = useStyle();      
  const dndSrdClasses = useDnDClasses();
  const dndSrdSpells = useDnDSpells();
  const dndSrdFeats = useDnDFeats();
  const dndSrdRaces = useDnDRaces();
  const dndSrdItems = useDnDItems();
  const dndSrdBackgrounds = useDnDBackgrounds();
  
  effect(()=>{
    console.log("dndSrdClasses", dndSrdClasses());
  });
  effect(()=>{
    console.log("dndSrdSpells", dndSrdSpells());
  });
  effect(()=>{
    console.log("dndSrdFeats", dndSrdFeats());
  });
  effect(()=>{
    console.log("dndSrdRaces", dndSrdRaces());
  });
  effect(()=>{
    console.log("dndSrdItems", dndSrdItems());
  });
  effect(()=>{
    console.log("dndSrdBackgrounds", dndSrdBackgrounds());
  });
  
  return (
      <div class={`${stylin.accent} ${styles.AppBody}`}>
        <h1>Home</h1>
        <ul>
          <For each={dndSrdClasses()}>
            {(dndClass) => (
              <li>{dndClass.name}</li>
            )}
          </For>
        </ul>
      </div>
  );
};

export default App;
