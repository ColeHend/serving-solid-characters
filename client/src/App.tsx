import { type Component, For, createResource, JSX, useContext, createMemo, createSignal, Show } from 'solid-js';
import { Body, TextArea, useStyle, getUserSettings, useInjectServices, useDnDClasses, useDnDSpells, useDnDFeats, useDnDRaces, useDnDBackgrounds, useDnDItems, ExpansionPanel, Markdown, Input, Select, Option, Button } from './shared';
import { effect } from 'solid-js/web';
import styles from './App.module.scss';
import ReloadPrompt from './ReloadPrompt';
import { DnDClass } from './models/class.model';
import { SnackbarController, addSnackbar } from './shared/components/Snackbar/snackbar';
import { Tabs, Tab } from './shared/components/Tabs/tabs';
import Table from './shared/components/Table/table';
import { SecondRow, Cell, Column, Header, Row } from './shared/components/Table/innerTable';
import FormField from './shared/components/FormField/formField';
import DataTransferModal from './components/DataTransfering/dataTransferModal';
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
  const [testText, setTestText] = createSignal("This **is** _a_ \n# test");
  const [bannerText, setBannerText] = createSignal("It'll be great eventually.");
  const [testFieldText, setTestFieldText] = createSignal("");
  const [testCheckbox, setTestCheckbox] = createSignal(false);
  const [showDataTransfer,setShowDataTransfer] = createSignal(false);

  return (
      <Body>
		<div class={`${styles.topRow}`}>
			<h1>Home</h1>
			
			<Button title='Import & Export' class={`${styles.fabBtn}`} onClick={()=>setShowDataTransfer(!showDataTransfer())}>+</Button>

		</div>
        <Tabs>
					<Tab name="Welcome">
						<ExpansionPanel>
							<div>
								Welcome to my app. This is a work in progress.
							</div>
							<div style={{width:"100%",padding: "15px"}}>
								<TextArea readOnly={true} transparent={true} tooltip='Testing' text={bannerText} setText={setBannerText} />
							</div>
						</ExpansionPanel>
					</Tab>
					<Tab name="Table">
						<div>
							<Table dropdownArrow={{width:"30px", height:"30px"}} dropdown data={dndSrdClasses} columns={['hitDie', "className", 'saves']}>
                <Column name='className'>
                  <Header>Class Name</Header>
                  <Cell<DnDClass>>{(x, i)=> x.name }</Cell>
                </Column>
								<Column name='hitDie'>
                  <Header>Hit Die</Header>
                  <Cell<DnDClass>>{(x)=> x.hitDie }</Cell> 
                </Column>
								<Column name='saves'>
                  <Header>Saves</Header>
                  <Cell<DnDClass>>{(x)=> x.savingThrows?.join(', ') }</Cell> 
                </Column>
								<Row style={{height:"40px"}} />
								<SecondRow<DnDClass> >{(item, i)=>(
									<div style={{border: "1px solid", padding: "5px", 'border-radius': "10px"}}>
										<div>{item?.name}</div>
										<div>{item?.hitDie}</div>
										<span>{item?.spellcasting?.spellcastingAbility}</span>
									</div>
								)}</SecondRow>
							</Table>
						</div>
					</Tab>
					<Tab name="Markdown">
						<div style={{height:"100%"}}>
							<div style={{width: "100%", height: "max-content !important"}}>
								<Markdown text={testText} />
							</div>
							<div style={{width:"100%", height: "max-content", "min-height": "200px"}}>
								<TextArea buttons={{styleType: "tertiary"}} picToTextEnabled={true} onChange={(e)=>setTestText(e.currentTarget.value)} readOnly={false} transparent={false} tooltip='Testing' text={testText} setText={setTestText} />
							</div>
						</div>
					</Tab>
          <Tab name="Field Test">
            <div style={{display:"flex", "flex-direction":"row","flex-wrap": "wrap"}}>
              <FormField name='Input Test' style={{height: 'min-content'}}>
                <Input type='text' value={testFieldText()} onChange={(e)=>setTestFieldText(e.currentTarget.value)}  
									width={700} 
									style={{"max-width" : "800px !important"}} />
              </FormField>
              <FormField name='TextArea Test'>
                <TextArea text={testFieldText} setText={setTestFieldText} />
              </FormField>
            </div>
          </Tab>
        </Tabs>

		<Show when={showDataTransfer()}>
			<DataTransferModal setBackClick={setShowDataTransfer} />
		</Show>

        <ReloadPrompt />
      </Body>
  );
};

export default App;
