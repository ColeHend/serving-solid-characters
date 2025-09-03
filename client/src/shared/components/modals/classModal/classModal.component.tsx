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
import { ChoiceDetail, Choices, Class5E, Subclass } from "../../../../models/data";
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
    return allSubclasses().filter(s => s.parent_class === props.currentClass().name);
  });

  const armorChoiceKey = createMemo(()=>props.currentClass().startChoices?.armor ?? "");
  const equipChoiceKey = createMemo(()=>props.currentClass().startChoices?.equipment ?? "");
  const skillChoiceKey = createMemo(()=>props.currentClass().startChoices?.skills ?? "");
  const toolChoiceKey = createMemo(()=>props.currentClass().startChoices?.tools ?? "");
  const weaponChoiceKey = createMemo(()=>props.currentClass().startChoices?.weapon ?? "");


  console.log(props.currentClass());
  

  return (
    <Modal
      title={props.currentClass().name}
      show={[props.boolean, props.booleanSetter]}
    >

      {/*  */}
      <div class={`${stylin()?.primary} ${styles.CenterPage}`}>
        <div class={`${styles.eachPage}`}>
          {/* <h1>{props.currentClass().name}</h1> */}

          {/* the feature table */}
          <FeatureTable DndClass={() => props.currentClass()} />

          <div class={`${styles.tabBar}`}>
            <TabBar 
            tabs={["Core","Choices","Features", ...currentSubclasses().map(s=>s.name)]} 
            activeTab={activeTab()} 
            onTabChange={(label,index)=>setActiveTab(index)}/>

           <Show when={activeTab() === ClassModalTabs.Core}>
              <span class={`${styles.flexBoxColumn}`}>
                <Show when={props.currentClass().hitDie !== ""}>
                  <h3> Hit die: 
                    <span class={`${styles.smallerFont}`}>
                      {props.currentClass().hitDie}
                    </span>
                  </h3>
                </Show>
                <Show when={props.currentClass().primaryAbility !== ""}>
                  <h3>Primary Ability: 
                    <span class={`${styles.smallerFont}`}>
                      {props.currentClass().primaryAbility}
                    </span>
                  </h3>
                </Show>
                <h3>Armor: 
                  <span class={styles.smallerFont}>
                    {props.currentClass().proficiencies.armor.join(", ") || 
                      "None"}
                  </span>
                </h3> 
                <h3>Weapons: 
                  <span class={styles.smallerFont}>
                    {props.currentClass().proficiencies.weapons.join(", ") ||
                      "None"}
                  </span>
                </h3>
                <h3>Tools: 
                  <span class={styles.smallerFont}>
                    {props.currentClass().proficiencies.tools.join(", ") || 
                      "None"}
                  </span>
                </h3>
                <Show when={props.currentClass().savingThrows?.length > 0}>
                  <h3>Saving Throws: 
                    <span class={styles.smallerFont}>
                      {props.currentClass().savingThrows?.join(", ")}
                    </span>
                  </h3>
                </Show>
              </span>
            </Show> 

            <Show when={activeTab() === ClassModalTabs.Items}>
              <span>
                <For each={startItems()}>
                    { (item,i) => <span>
                      {startingItemsOptionKeys()[i()]}: {item}
                    </span>}
                </For>
              </span>

              <Show when={props.currentClass().startChoices?.armor !== null}>
                <h3>
                  {armorChoiceKey()}
                </h3>

                <h4>Choose:
                  <span>
                    { choices()[armorChoiceKey()].amount }
                  </span>
                </h4>

                <div>
                  { choices()[armorChoiceKey()].options.join(", ") }
                </div>
              </Show>

              <Show when={props.currentClass().startChoices?.equipment !== null}>
                <h3>
                  {equipChoiceKey()}
                </h3>

                <h4>Choose:
                  <span>
                    { choices()[equipChoiceKey()].amount }
                  </span>
                </h4>
                
                <div>
                  <span>A: 
                    { choices()[equipChoiceKey()].options[0] }
                  </span>
                  <br />
                  <span>B:
                    { choices()[equipChoiceKey()].options[1] }
                  </span>
                </div>
              </Show>

              <Show when={props.currentClass().startChoices?.skills !== null}>
                  <h3>
                    {skillChoiceKey()}
                  </h3>

                  <h4>Choose:
                    <span>
                      { choices()[skillChoiceKey()]?.amount }
                    </span>
                  </h4>

                  <div>
                    { choices()[skillChoiceKey()]?.options.join(", ") }
                  </div>
                {/*  */}
              </Show>

              <Show when={props.currentClass().startChoices?.tools !== null}>
                <h3>
                  {toolChoiceKey()}
                </h3>

                <h4>Choose:
                  <span>
                    { choices()[toolChoiceKey()]?.amount }
                  </span>
                </h4>

                <div>
                  { choices()[toolChoiceKey()]?.options.join(", ") }
                </div>
              </Show>

              <Show when={props.currentClass().startChoices?.weapon !== null}>
                <h3>
                  {weaponChoiceKey()}
                </h3>

                <h4>Choose:
                  <span>
                    { choices()[weaponChoiceKey()].amount }
                  </span>
                </h4>

                <div>
                  { choices()[weaponChoiceKey()].options.join(", ") }
                </div>
              </Show>

              {/* 
                other choices will have to wait. startChoices does not have all choices options 
                and im pretty sure that mapping the keys off "choices" object from the classes dont work either.
              */}
              
            </Show>

            <Show when={activeTab() === ClassModalTabs.Features}>
              <span>
                <For each={classLevels()}>
                  { (level) => <span>
                    <h2>Level {level} features</h2>
                    <For each={features()?.[+level]}>
                      { (feature) => <span>
                        <h3 class={`${styles.header2}`}> {feature.name} </h3>

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
                  <h2 class={`${styles.header2}`}>{subclass.name}</h2>
                  <span class={`${styles.infobox}`}>{subclass.description}</span>

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
