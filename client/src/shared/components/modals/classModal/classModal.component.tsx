import {
  Accessor,
  Component,
  createMemo,
  createSignal,
  For,
  JSX,
  Setter,
  Show,
  useContext,
} from "solid-js";
import FeatureTable from "./featureTable/featureTable";
import { Class5E, Subclass } from "../../../../models/data";
import { SharedHookContext } from "../../../../components/rootApp";
import getUserSettings from "../../../customHooks/userSettings";
import useStyles from "../../../../shared/customHooks/utility/style/styleHook";
import styles from "./classModal.module.scss";
import { classFeatureNullCheck } from "../../../customHooks/utility/tools/Tools";
import { Modal,TabBar } from "coles-solid-library";
import { useDnDSubclasses } from "../../../customHooks/dndInfo/info/all/subclasses";

type props = {
  currentClass: Accessor<Class5E>;
  boolean: Accessor<boolean>;
  booleanSetter: Setter<boolean>;
};

enum ClassModalTabs {
  Core = 0,
  Items = 1,
  Features = 2
}

const ClassModal: Component<props> = (props) => {
  const [userSettings,] = getUserSettings();
  const stylin = createMemo(() => useStyles(userSettings().theme));
  const [activeTab,setActiveTab] = createSignal<number>(0);

  const allSubclasses = useDnDSubclasses();
  const starting_equipment = createMemo(() => props.currentClass().starting_equipment || []);
  const startingItemsOptionKeys = createMemo(()=>starting_equipment().flatMap(x=>x.optionKeys || []));
  const startItems = createMemo(()=>starting_equipment().flatMap(x=>x.items || []));
  const classLevels = createMemo(() => Object.keys(props.currentClass().features || {}));
  const features = createMemo(() => props.currentClass().features || []);
  const choices = createMemo(() => props.currentClass().choices || {});
  const choiceKeys = createMemo(() => Object.keys(props.currentClass().choices || {}));
  const currentSubclasses = createMemo<Subclass[]>(() => {
    console.log("all:", allSubclasses());
    
    return allSubclasses().filter(s => s.parent_class === props.currentClass().name);
  });

  console.log("x:", choiceKeys())

  return (
    <Modal
      title={props.currentClass().name}
      show={[props.boolean, props.booleanSetter]}
    >
      <div class={`${stylin()?.primary} ${styles.CenterPage}`}>
        <div class={`${styles.eachPage}`}>
          {/* <h1>{props.currentClass().name}</h1> */}

          {/* the feature table */}
          <FeatureTable DndClass={() => props.currentClass()} />

          <div class={`${styles.tabBar}`}>
            <TabBar 
            tabs={["Core","Items","Features", ...currentSubclasses().map(s=>s.name)]} 
            activeTab={activeTab()} 
            onTabChange={(label,index)=>setActiveTab(index)}/>

           <Show when={activeTab() === ClassModalTabs.Core}>
              <span class={`${styles.left} ${styles.flexBoxColumn}`}>
                <Show when={props.currentClass().hit_die}>
                  <span>
                    Hit die:

                    {props.currentClass().hit_die}
                  </span>

                </Show>
                <Show when={props.currentClass().primary_ability}>
                  <span>
                    Primary Ability: 

                    {props.currentClass().primary_ability}
                  </span>
                </Show>
                <span>
                  Armor: 

                  {props.currentClass().proficiencies.armor.join(", ") || 
                    "None"}
                </span>
                <span>
                  Weapons: 
                  {props.currentClass().proficiencies.weapons.join(", ") ||
                    "None"}
                </span>
                <span>
                  Tools: 
                  {props.currentClass().proficiencies.tools.join(", ") || 
                    "None"}
                </span>
                <Show when={props.currentClass().saving_throws?.length > 0}>
                  <span>
                    Saving Throws: 
                    {props.currentClass().saving_throws?.join(", ")}
                  </span>
                </Show>
              </span>
            </Show> 

            <Show when={activeTab() === ClassModalTabs.Items}>
              <span>
                <For each={startItems()}>
                    { (item) => <span>
                      {startingItemsOptionKeys()[0]}: {item}
                    </span>}
                </For>
              </span>

              <Show when={choices().starting_equipment && choiceKeys().length !== 0}>
                <For each={choiceKeys()}>
                  { (choiceKey) => <span>
                  <div>
                    {choiceKey}:
                  </div> 
                  
                  <div>
                    Choose: { choices()[`${choiceKey}`].amount }
                  </div>
                  
                  <div>
                    <Show when={choices()[`${choiceKey}`].options.length < 3} fallback={
                      <For each={choices()[`${choiceKey}`].options || []}>
                        { (option,i) => <span>
                          {option}<Show when={i() !== choices()[`${choiceKey}`].options.length - 1}>, </Show>
                        </span>}
                      </For>
                    }>
                      <span>
                        A:{
                          choices()[`${choiceKey}`].options[0]
                        } 
                      </span>
                      <br />
                      <span>
                        B:{
                          choices()[`${choiceKey}`].options[1]
                        }
                      </span>
                    </Show>

                    


                  </div>
                </span>

                  }
                </For>
              </Show>
              
            </Show>

            <Show when={activeTab() === ClassModalTabs.Features}>
              <span>
                <For each={classLevels()}>
                  { (level) => <span>
                    <For each={features()?.[+level]}>
                      { (feature) => <span>
                        <h2> {feature.name} </h2>

                        <span> {feature.description} </span>
                      </span>}
                    </For>

                  </span>}
                </For>
              </span>   
            </Show>

            <For each={currentSubclasses()}>{(subclass)=>{
              return <Show when={activeTab() === currentSubclasses().indexOf(subclass) + 3}>
                <span class={`${styles.flexBoxColumn}`}>
                  <h2>{subclass.name}</h2>
                  <span>{subclass.description}</span>
                  <Show when={subclass.features && Object.keys(subclass.features).length > 0}>
                    <For each={Object.keys(subclass.features || {})}>
                      { (level) => <span>
                        <h3>Level {level} Features:</h3>
                        <For each={subclass.features?.[+level]}>
                          { (feature) => <span>
                            <h4>{feature.name}</h4>
                            <span>{feature.description}</span>
                          </span>}
                        </For>
                      </span>}
                    </For>
                  </Show>
                </span>
              </Show>
            }}</For>
           
          </div>
        </div>
      </div>
    </Modal>
  );
};
export default ClassModal;
