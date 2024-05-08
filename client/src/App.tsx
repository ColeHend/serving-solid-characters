import { type Component, For } from 'solid-js';
import useDnDClasses from './customHooks/dndInfo/useDnDClasses';
import styles from './App.module.css';
import useStyle from './customHooks/utility/style/styleHook';
import useDnDSpells from './customHooks/dndInfo/useDnDSpells';
import { effect } from 'solid-js/web';
import useDnDFeats from './customHooks/dndInfo/useDnDFeats';
import useDnDRaces from './customHooks/dndInfo/useDnDRaces';
import useDnDBackgrounds from './customHooks/dndInfo/useDnDBackgrounds';
import useDnDItems from './customHooks/dndInfo/useDnDItems';
const App: Component = () => {
  const dndSrdClasses = useDnDClasses();
  const dndSrdSpells = useDnDSpells();
  const dndSrdFeats = useDnDFeats();
  const dndSrdRaces = useDnDRaces();
  const dndSrdItems = useDnDItems();
  const dndSrdBackgrounds = useDnDBackgrounds();

  const stylin = useStyle();      
  
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
