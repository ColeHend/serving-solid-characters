import { type Component, For, createResource, JSX, useContext, createMemo, createSignal, Show, Switch, Match, createEffect, ErrorBoundary } from 'solid-js';
import { TextArea, getUserSettings, useInjectServices, useDnDClasses, useDnDSpells, useDnDFeats, useDnDRaces, useDnDBackgrounds, useDnDItems, Markdown, Clone } from './shared';
import styles from './App.module.scss';
import ReloadPrompt from './ReloadPrompt';
import DataTransferModal from './components/DataTransfering/dataTransferModal';
import { Button, Cell, Column, Container, ExpansionPanel, Header, Input, Row, Select, TabBar, Option, FormField, Table, Checkbox } from 'coles-solid-library';
import { DnDClass } from './models/old/class.model';
import { useGetSRDClasses$ } from './shared/customHooks/api/useGetSrdClasses';
import { combineLatest, concatMap, of } from 'rxjs';
import { useTest } from './useTest';

const App: Component = () => {
  console.log("App component initializing");
  
  // Initialize state with safe defaults
  const [testText, setTestText] = createSignal("This **is** _a_ \n# test");
  const [bannerText, setBannerText] = createSignal("It'll be great eventually.");
  const [testFieldText, setTestFieldText] = createSignal("");
  const [showDataTransfer, setShowDataTransfer] = createSignal(false);
  const [testValues, setTestValues] = createSignal<string[]>(["one", "two", "three"]);
  const [testSelect, setTestSelect] = createSignal<string>();
  const [activeTab, setActiveTab] = createSignal(0);
  const [isTableRowOpen, setIsTableRowOpen] = createSignal<boolean[]>([]);
  const [isNewChoice, setIsNewChoice] = createSignal<boolean>(false);
  const [userSettings, setUserSettings] = createSignal({ theme: 'dark' });
  const [dndClasses, setDndClasses] = createSignal<DnDClass[]>([]);
  const [isLoading, setIsLoading] = createSignal(true);
  const [hasError, setHasError] = createSignal(false);
  const [errorMessage, setErrorMessage] = createSignal("");

  try {
    // Safely get user settings
    const [settings, setSettings] = getUserSettings();
    createEffect(() => {
      try {
        setUserSettings((old)=>({
          ...old,
          theme: settings().theme,
        }));
      } catch (error) {
        console.error("Failed to update user settings:", error);
      }
    });
  } catch (error) {
    console.error("Failed to initialize user settings:", error);
  }

  // Safely load DnD data
  try {
    const dnClassesAccessor = useDnDClasses();
    createEffect(() => {
      try {
        const classes = dnClassesAccessor();
        console.log(`Loaded ${classes.length} DnD classes`);
        setDndClasses(classes);
        setIsTableRowOpen(Array(classes.length).fill(false));
      } catch (error) {
        console.error("Failed to process DnD classes:", error);
      }
    });
    
    // Load other data services safely
    try { useDnDSpells(); } catch (e) { console.error("Failed to load spells:", e); }
    try { useDnDFeats(); } catch (e) { console.error("Failed to load feats:", e); }
    try { useDnDRaces(); } catch (e) { console.error("Failed to load races:", e); }
    try { useDnDItems(); } catch (e) { console.error("Failed to load items:", e); }
    try { useDnDBackgrounds(); } catch (e) { console.error("Failed to load backgrounds:", e); }
  } catch (error) {
    console.error("Failed to initialize DnD data hooks:", error);
    setHasError(true);
    setErrorMessage("Failed to load game data. Please refresh the page.");
  }

  // Mark loading as complete after a short delay to ensure UI renders
  setTimeout(() => {
    setIsLoading(false);
    console.log("App component finished loading");
  }, 500);

  return (
    <ErrorBoundary fallback={(err) => (
      <Container theme='surface' class={styles.errorContainer}>
        <h2>Something went wrong in the application</h2>
        <p>We encountered an error while loading the application:</p>
        <pre>{err.toString()}</pre>
        <Button onClick={() => window.location.reload()}>Reload Application</Button>
      </Container>
    )}>
      {isLoading() ? (
        <Container theme='surface' class={styles.loadingContainer}>
          <h2>Loading application data...</h2>
          <p>Please wait while we load your content</p>
        </Container>
      ) : (
        <Container class={`${styles.body}`} theme='container'>
          <div class={`${styles.topRow}`}>
            <h1>Home</h1>
            <Button 
              title='Import & Export' 
              class={`${styles.fabBtn}`} 
              onClick={() => setShowDataTransfer(!showDataTransfer())}>
              +
            </Button>
          </div>
          
          <div>
            <TabBar 
              activeTab={activeTab()} 
              tabs={['Welcome', 'Table', 'Markdown', 'Field Test']} 
              onTabChange={(label, i) => {
                setActiveTab(i);
              }} 
            />
          </div>
          
          <div>
            <Switch>
              <Match when={activeTab() === 0}>
                <ExpansionPanel>
                  <div>
                    Welcome to my app. This is a work in progress.
                  </div>
                  <div>
                    <TextArea 
                      readOnly={true} 
                      transparent={true} 
                      tooltip='Testing' 
                      text={bannerText} 
                      setText={setBannerText} 
                    />
                  </div>
                </ExpansionPanel>
                <Checkbox checked={isNewChoice()} onChange={setIsNewChoice} />
                <Checkbox />
              </Match>
              
              <Match when={activeTab() === 1}>
                <div>
                  <Table data={() => dndClasses()} columns={['hitDie', "className", 'saves']}>
                    <Column name='className'>
                      <Header>Class Name</Header>
                      <Cell<DnDClass>>{(x) => x?.name || 'Loading...'}</Cell>
                    </Column>
                    <Column name='hitDie'>
                      <Header>Hit Die</Header>
                      <Cell<DnDClass>>{(x) => x?.hitDie || 'Loading...'}</Cell>
                      <Cell<DnDClass> rowNumber={2}>{(item) => (
                        <div style={{border: "1px solid", padding: "5px", 'border-radius': "10px"}}>
                          <div>{item?.name || 'Loading...'}</div>
                          <div>{item?.hitDie || 'Loading...'}</div>
                          <span>{item?.spellcasting?.spellcastingAbility || 'N/A'}</span>
                        </div>
                      )}</Cell> 
                    </Column>
                    <Column name='saves'>
                      <Header>Saves</Header>
                      <Cell<DnDClass>>{(x) => x?.savingThrows?.join(', ') || 'Loading...'}</Cell> 
                    </Column>
                    <Row style={{height:"40px"}} isDropHeader />
                    <Row rowNumber={2} isDropRow />
                  </Table>
                </div>
              </Match>
              
              <Match when={activeTab() === 2}>
                <div style={{height:"100%"}}>
                  <div style={{width: "100%", height: "max-content !important"}}>
                    {/* <Markdown text={testText()} /> */}
                  </div>
                  <div style={{width:"100%", height: "max-content", "min-height": "200px"}}>
                    <TextArea 
                      buttons={{styleType: "tertiary"}} 
                      picToTextEnabled={true} 
                      onChange={(e) => setTestText(e.currentTarget.value)} 
                      readOnly={false} 
                      transparent={false} 
                      tooltip='Testing' 
                      text={testText} 
                      setText={setTestText} 
                    />
                  </div>
                </div>
              </Match>
              
              <Match when={activeTab() === 3}>
                <div style={{display:"flex", "flex-direction":"row","flex-wrap": "wrap"}}>
                  <FormField name='Input Test' style={{height: 'min-content'}}>
                    <Input 
                      type='text' 
                      value={testFieldText()} 
                      onChange={(e) => setTestFieldText(e.currentTarget.value)}  
                      width={700} 
                      style={{"max-width" : "800px !important"}} 
                    />
                  </FormField>
                  <FormField name='TextArea Test'>
                    <TextArea text={testFieldText} setText={setTestFieldText} />
                  </FormField>
                  <Select 
                    multiple={false} 
                    value={testSelect()}
                    onChange={setTestSelect}>
                    <For each={testValues()}>{(item) => {
                      return <Option value={item}>{item}</Option>
                    }}</For>
                  </Select>
                </div>
              </Match>
            </Switch>
          </div>

          <Show when={showDataTransfer()}>
            <DataTransferModal setBackClick={setShowDataTransfer} />
          </Show>

          <ReloadPrompt />
        </Container>
      )}
    </ErrorBoundary>
  );
};

export default App;
