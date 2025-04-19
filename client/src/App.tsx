import { type Component, For, createResource, JSX, useContext, createMemo, createSignal, Show, Switch, Match, createEffect } from 'solid-js';
import { TextArea, getUserSettings, useInjectServices, useDnDClasses, useDnDSpells, useDnDFeats, useDnDRaces, useDnDBackgrounds, useDnDItems, Markdown, Clone } from './shared';
import styles from './App.module.scss';
import ReloadPrompt from './ReloadPrompt';
import { DnDClass } from './models/class.model';
import DataTransferModal from './components/DataTransfering/dataTransferModal';
import { Button, Cell, Column, Container, ExpansionPanel, Header, Input, Row, Select, TabBar, Option, FormField, Table, Checkbox } from 'coles-solid-library';
import { useGetSRDClasses } from './shared/customHooks/api/useGetSrdClasses';
const App: Component = () => {
  const [userSettings, setUserSettings] = getUserSettings(); 
  const dndSrdClasses = useDnDClasses();
  useDnDSpells(); useDnDFeats();
  useDnDRaces(); useDnDItems();
  useDnDBackgrounds();
  const [testText, setTestText] = createSignal("This **is** _a_ \n# test");
  const [bannerText, setBannerText] = createSignal("It'll be great eventually.");
  const [testFieldText, setTestFieldText] = createSignal("");
  const [showDataTransfer,setShowDataTransfer] = createSignal(false);

  const [testValues, setTestValues] = createSignal<string[]>(["one", "two", "three"]);
  const [testSelect, setTestSelect] = createSignal<string>();

  const [activeTab, setActiveTab] = createSignal(0);
  const [isTableRowOpen, setIsTableRowOpen] = createSignal<boolean[]>([]);
  // useGetSRDClasses().subscribe(x=>console.log('SRD Classes: ',x));
  
  createEffect(() => {
    const classes = dndSrdClasses();
    setIsTableRowOpen(Array(classes.length).fill(false));
  });
  const [isNewChoice, setIsNewChoice] = createSignal<boolean>(false);
  return (
    <Container class={`${styles.body}`} theme='container'>
      <div class={`${styles.topRow}`}>
        <h1>Home</h1>
			
        <Button title='Import & Export' class={`${styles.fabBtn}`} onClick={()=>setShowDataTransfer(!showDataTransfer())}>+</Button>

      </div>
      <div>
        <TabBar activeTab={activeTab()} tabs={['Welcome', 'Table', 'Markdown', 'Field Test']} onTabChange={(label, i)=> {
          setActiveTab(i);
        }} />
      </div>
      <div>
        <Switch>
          <Match when={activeTab() === 0}>
            <ExpansionPanel>
              <div>
                  Welcome to my app. This is a work in progress.
              </div>
              <div>
                <TextArea readOnly={true} transparent={true} tooltip='Testing' text={bannerText} setText={setBannerText} />
              </div>
            </ExpansionPanel>
            <Checkbox checked={isNewChoice()} onChange={setIsNewChoice} />
            <Checkbox />
          </Match>
          <Match when={activeTab() === 1}>
            <div>
              <Table data={dndSrdClasses} columns={['hitDie', "className", 'saves']}>
                <Column name='className'>
                  <Header>Class Name</Header>
                  <Cell<DnDClass>>{(x)=> x.name }</Cell>
                </Column>
                <Column name='hitDie'>
                  <Header>Hit Die</Header>
                  <Cell<DnDClass>>{(x)=> x.hitDie }</Cell>
                  <Cell<DnDClass> rowNumber={2}>{(item)=> (
                    <div style={{border: "1px solid", padding: "5px", 'border-radius': "10px"}}>
                      <div>{item?.name}</div>
                      <div>{item?.hitDie}</div>
                      <span>{item?.spellcasting?.spellcastingAbility}</span>
                    </div>
                  ) }</Cell> 
                </Column>
                <Column name='saves'>
                  <Header>Saves</Header>
                  <Cell<DnDClass>>{(x)=> x.savingThrows?.join(', ') }</Cell> 
                </Column>
                <Row style={{height:"40px"}} isDropHeader />
                <Row rowNumber={2} isDropRow />

              </Table>
            </div>
          </Match>
          <Match when={activeTab() === 2}>
            <div style={{height:"100%"}}>
              <div style={{width: "100%", height: "max-content !important"}}>
                <Markdown text={testText} />
              </div>
              <div style={{width:"100%", height: "max-content", "min-height": "200px"}}>
                <TextArea buttons={{styleType: "tertiary"}} picToTextEnabled={true} onChange={(e)=>setTestText(e.currentTarget.value)} readOnly={false} transparent={false} tooltip='Testing' text={testText} setText={setTestText} />
              </div>
            </div>
          </Match>
          <Match when={activeTab() === 3}>
            <div style={{display:"flex", "flex-direction":"row","flex-wrap": "wrap"}}>
              <FormField name='Input Test' style={{height: 'min-content'}}>
                <Input type='text' value={testFieldText()} onChange={(e)=>setTestFieldText(e.currentTarget.value)}  
                  width={700} 
                  style={{"max-width" : "800px !important"}} />
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
  );
};

export default App;
