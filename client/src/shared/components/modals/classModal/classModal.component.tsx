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

type props = {
  currentClass: Accessor<Class5E>;
  boolean: Accessor<boolean>;
  booleanSetter: Setter<boolean>;
};

const ClassModal: Component<props> = (props) => {
  const [userSettings,] = getUserSettings();
  const stylin = createMemo(() => useStyles(userSettings().theme));
  const [activeTab,setActiveTab] = createSignal<number>(0);

  const starting_equipment = createMemo(() => props.currentClass().starting_equipment || [])
  const startingItemsOptionKeys = createMemo(()=>starting_equipment().flatMap(x=>x.optionKeys || []))
  const startItems = createMemo(()=>starting_equipment().flatMap(x=>x.items || []))
  const classLevels = createMemo(() => Object.keys(props.currentClass().features || {}))
  const features = createMemo(() => props.currentClass().features || [])

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
            tabs={["Core","Items","Features"]} 
            activeTab={activeTab()} 
            onTabChange={(label,index)=>setActiveTab(index)}/>

           <Show when={activeTab() === 0}>
              <span class={`${styles.left} ${styles.flexBoxColumn}`}>
                <Show when={props.currentClass().hit_die}>
                  <span>
                    Hit die:

                    {props.currentClass().hit_die}
                  </span>

                </Show>
                <Show when={props.currentClass().primary_ability}>
                  <span>
                    Primay Abilty: 

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

            <Show when={activeTab() === 1}>
              <span>
                <For each={startItems()}>
                    { (item) => <span>
                      {startingItemsOptionKeys()[0]}: {item}
                    </span>}
                </For>
              </span>
            </Show>

            <Show when={activeTab() === 2}>
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
           
          </div>
        </div>
      </div>
    </Modal>
  );
};
export default ClassModal;
