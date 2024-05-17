import { type Component, For, createResource, JSX } from 'solid-js';
import { effect } from 'solid-js/web';
import useDnDClasses from './customHooks/dndInfo/srdinfo/useDnDClasses';
import useStyle from './customHooks/utility/style/styleHook';
import useDnDSpells from './customHooks/dndInfo/srdinfo/useDnDSpells';
import useDnDFeats from './customHooks/dndInfo/srdinfo/useDnDFeats';
import useDnDRaces from './customHooks/dndInfo/srdinfo/useDnDRaces';
import useDnDBackgrounds from './customHooks/dndInfo/srdinfo/useDnDBackgrounds';
import useDnDItems from './customHooks/dndInfo/srdinfo/useDnDItems';
import styles from './App.module.css';
import ReloadPrompt from './ReloadPrompt';
import { DnDClass } from './models/class.model';

const App: Component = () => {
  const stylin = useStyle();       
  const dndSrdClasses = useDnDClasses();
  const dndSrdSpells = useDnDSpells();
  const dndSrdFeats = useDnDFeats();
  const dndSrdRaces = useDnDRaces();
  const dndSrdItems = useDnDItems();
  const dndSrdBackgrounds = useDnDBackgrounds();

  return (
      <div class={`${stylin.accent} ${styles.AppBody}`}>
        <h1>Home</h1>
        <div>
          Welcome to my app. This is a work in progress.
        </div>
        <ReloadPrompt />
      </div>
  );
};

export default App;
