import { type Component, For, createResource, JSX, useContext, createMemo, createSignal } from 'solid-js';
import { Body, TextArea, useStyle, getUserSettings, useInjectServices, useDnDClasses, useDnDSpells, useDnDFeats, useDnDRaces, useDnDBackgrounds, useDnDItems, ExpansionPanel, Markdown } from './shared';
import { effect } from 'solid-js/web';
import styles from './App.module.scss';
import ReloadPrompt from './ReloadPrompt';
import { DnDClass } from './models/class.model';
const App: Component = () => {
  const [userSettings, setUserSettings] = getUserSettings();
  const sharedHooks = useInjectServices();
  const stylin = createMemo(()=>useStyle(userSettings().theme)); ;       
  const dndSrdClasses = useDnDClasses();
  const dndSrdSpells = useDnDSpells();
  const dndSrdFeats = useDnDFeats();
  const dndSrdRaces = useDnDRaces();
  const dndSrdItems = useDnDItems();
  const dndSrdBackgrounds = useDnDBackgrounds();
  const [testText, setTestText] = createSignal("This \nis \na test");
  const [bannerText, setBannerText] = createSignal("It'll be great eventually.");
  return (
      <Body>
        <h1>Home</h1>
        <div style={{width: "100%", height: "200px"}}>
          <Markdown text={testText} />
        </div>
        <div style={{width:"100%"}}>
          <TextArea picToTextEnabled={true} onChange={(e)=>setTestText(e.currentTarget.value)} readOnly={false} transparent={false} tooltip='Testing' text={testText} setText={setTestText} />
        </div>
        <div>
          <ExpansionPanel>
            <div>
                Welcome to my app. This is a work in progress.
            </div>
            <div style={{width:"100%",padding: "15px"}}>
              <TextArea readOnly={true} transparent={true} tooltip='Testing' text={bannerText} setText={setBannerText} />
            </div>
          </ExpansionPanel>
        </div>
        <ReloadPrompt />
      </Body>
  );
};

export default App;
