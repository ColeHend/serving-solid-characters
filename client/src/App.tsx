import { type Component, For, createResource, JSX } from 'solid-js';
import { effect } from 'solid-js/web';
import useDnDClasses from './shared/customHooks/dndInfo/srdinfo/useDnDClasses';
import useStyle from './shared/customHooks/utility/style/styleHook';
import useDnDSpells from './shared/customHooks/dndInfo/srdinfo/useDnDSpells';
import useDnDFeats from './shared/customHooks/dndInfo/srdinfo/useDnDFeats';
import useDnDRaces from './shared/customHooks/dndInfo/srdinfo/useDnDRaces';
import useDnDBackgrounds from './shared/customHooks/dndInfo/srdinfo/useDnDBackgrounds';
import useDnDItems from './shared/customHooks/dndInfo/srdinfo/useDnDItems';
import styles from './App.module.css';
import ReloadPrompt from './ReloadPrompt';
import { DnDClass } from './models/class.model';
import ExpansionPanel from './shared/components/expansion/expansion';

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
        <div style={{width: "30%"}}>
          <ExpansionPanel>
            <div>
                Welcome to my app. This is a work in progress.
            </div>
            <div style={{padding: "15px"}}>
                It'll be great eventually.
            </div>
          </ExpansionPanel>
        </div>
        <ReloadPrompt />
      </div>
  );
};

export default App;
