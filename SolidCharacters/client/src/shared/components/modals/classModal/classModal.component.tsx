import {
  Accessor,
  Component,
  createMemo,
  createSignal,
  For,
  Setter,
  Show,
} from "solid-js";
import FeatureTable from "./featureTable/featureTable";
import { Class5E, Subclass } from "../../../../models/generated";
import getUserSettings from "../../../customHooks/userSettings";
import useStyles from "../../../../shared/customHooks/utility/style/styleHook";
import styles from "./classModal.module.scss";
import { Modal,TabBar } from "coles-solid-library";
import { useDnDSubclasses } from "../../../customHooks/dndInfo/info/all/subclasses";
import { incrementString } from "../../../customHooks/utility/tools/incrementChar";
import { ChoiceCard } from "../../choiceCard/choiceCard";

type props = {
  currentClass: Accessor<Class5E>;
  boolean: Accessor<boolean>;
  booleanSetter: Setter<boolean>;
  subclasses: Accessor<Subclass[]>
};

enum ClassModalTabs {
  Items = 0,
  Features = 1
}

const ClassModal: Component<props> = (props) => {
  const [userSettings,] = getUserSettings();
  const stylin = createMemo(() => useStyles(userSettings().theme));
  const [activeTab,setActiveTab] = createSignal<number>(0);
  const allSubclasses = props.subclasses;
  
  const starting_equipment = createMemo(() => props.currentClass().startingEquipment || []);
  const startingItemsOptionKeys = createMemo(()=>starting_equipment().flatMap(x=>x.optionKeys || []));
  const startItems = createMemo(()=>starting_equipment().flatMap(x=>x.items || []));
  const classLevels = createMemo(() => Object.keys(props.currentClass().features || {}));
  const features = createMemo(() => props.currentClass().features || []);
  const choices = createMemo(() => props.currentClass().choices || {});
  const currentSubclasses = createMemo<Subclass[]>(() => {
    return allSubclasses().filter(s => s.parentClass === props.currentClass().name);
  });

  const armorChoiceKey = createMemo(()=>props.currentClass().startChoices?.armor ?? "");
  const equipChoiceKey = createMemo(()=>props.currentClass().startChoices?.equipment ?? "");
  const skillChoiceKey = createMemo(()=>props.currentClass().startChoices?.skills ?? "");
  const toolChoiceKey = createMemo(()=>props.currentClass().startChoices?.tools ?? "");
  const weaponChoiceKey = createMemo(()=>props.currentClass().startChoices?.weapon ?? "");
  const itemOptions = createMemo(() => choices()?.[equipChoiceKey()]?.options ?? []);

  const getItemOptionKey = () => {
    const optionsLetters:string[] = [];
    const options = itemOptions();

    while (options.length !== optionsLetters.length) {
      const letterLength = optionsLetters.length;
      const optionLength = options.length;

      if (letterLength === 0) {
        optionsLetters.push("A")
      } else if (letterLength < optionLength) {
        optionsLetters.push(incrementString(optionsLetters?.[letterLength - 1]))
      }

      if (letterLength > optionLength) {
        break;
      }
    }

    return optionsLetters;
  }

  return (
    <Modal
      title={props.currentClass().name}
      show={[props.boolean, props.booleanSetter]}
    >
      <div class={`${stylin()?.primary} ${styles.CenterPage}`}>
        <div class={`${styles.eachPage}`}>

        <div class={`${styles.table}`}>
          <FeatureTable DndClass={() => props.currentClass()} />
        </div>

        <span class={`${styles.classStats} ${styles.leftAlignText}`}>
              <Show when={props.currentClass().hitDie !== ""}>
                <div>
                  <h3>
                    Hit die: 
                  </h3>
                  <span class={`${styles.smallerFont}`}>
                    {props.currentClass().hitDie}
                  </span>
                </div>
              </Show>
              <Show when={props.currentClass().primaryAbility !== ""}>
                <div>
                  <h3>
                    Primary Ability: 
                  </h3>
                  <span class={`${styles.smallerFont}`}>
                    {props.currentClass().primaryAbility}
                  </span>
                </div>
              </Show>
              <div>
                <h3>
                  Armor: 
                </h3> 
                <span class={styles.smallerFont}>
                  {props.currentClass().proficiencies.armor.join(", ") || 
                    "None"}
                </span>
              </div>

              <div>
                <h3>
                  Weapons: 
                </h3>
                <span class={styles.smallerFont}>
                  {props.currentClass().proficiencies.weapons.join(", ") ||
                    "None"}
                </span>
              </div>

              <div>
                <h3>
                  Tools: 
                </h3>
                <span class={styles.smallerFont}>
                  {props.currentClass().proficiencies.tools.join(", ") || 
                    "None"}
                </span>
              </div>
              <Show when={props.currentClass().savingThrows?.length > 0}>
                <div>
                  <h3>
                    Saving Throws: 
                  </h3>
                  <span class={styles.smallerFont}>
                    {props.currentClass().savingThrows?.join(", ")}
                  </span>
                </div>
              </Show>
            </span>

          <div class={`${styles.tabBar}`}>
            <TabBar 
            tabs={["Choices","Features", ...currentSubclasses().map(s=>s.name)]} 
            activeTab={activeTab()} 
            onTabChange={(label,index)=>setActiveTab(index)}
            colors={{
              indicator: "#7c2718",
              text: "#7c2718"
            }}
            class={`${styles.tabBar}`}
            />

           {/* <Show when={activeTab() === ClassModalTabs.Core}>
              
            </Show>  */}

            <Show when={activeTab() === ClassModalTabs.Items}>
              <span>
                <For each={startItems()}>
                    { (item,i) => <span>
                      {startingItemsOptionKeys()[i()]}: {item}
                    </span>}
                </For>
              </span>

              <Show when={choices()[armorChoiceKey()]}>
                <h3>
                  {armorChoiceKey()}
                </h3>

                <h4>Choose:
                  <span>
                    { choices()[armorChoiceKey()]?.amount }
                  </span>
                </h4>

                <div>
                  { choices()[armorChoiceKey()]?.options?.join(", ") }
                </div>
              </Show>

              <Show when={choices()[equipChoiceKey()]}>
                <h3>
                  {equipChoiceKey()}
                </h3>

                <h4>Choose:
                  <span>
                    <For each={getItemOptionKey()}>
                      { (key, i) => <>
                        <span>{key}</span>

                        <Show when={i() !== getItemOptionKey().length - 1}>
                          <span> or </span>
                        </Show>
                      </>}
                    </For>
                  </span>
                </h4>

                <div>
                    <For each={choices()?.[equipChoiceKey()]?.options ?? []}>
                      { (itemOption, i) => <ChoiceCard ChoiceKey={getItemOptionKey()?.[i()]} text={itemOption} /> }
                    </For>
                  {/* <ul class={`${styles.itemList}`}>

                  </ul> */}
                </div>
              </Show>

              <Show when={choices()[skillChoiceKey()]}>
                  <h3>
                    {skillChoiceKey()}
                  </h3>

                  <h4>Choose:
                    <span>
                      { choices()[skillChoiceKey()]?.amount }
                    </span>
                  </h4>

                  <div>
                    { choices()[skillChoiceKey()]?.options?.join(", ") }
                  </div>
                {/*  */}
              </Show>

              <Show when={choices()[toolChoiceKey()]}>
                <h3>
                  {toolChoiceKey()}
                </h3>

                <h4>Choose:
                  <span>
                    { choices()[toolChoiceKey()]?.amount }
                  </span>
                </h4>

                <div>
                  { choices()[toolChoiceKey()]?.options?.join(", ") }
                </div>
              </Show>

              <Show when={choices()[weaponChoiceKey()]}>
                <h3>
                  {weaponChoiceKey()}
                </h3>

                <h4>Choose:
                  <span>
                    { choices()[weaponChoiceKey()]?.amount }
                  </span>
                </h4>

                <div>
                  { choices()[weaponChoiceKey()]?.options?.join(", ") }
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
                  { (level) => <Show when={features()?.[+level]?.length}>
                    <span>
                    <h2 class={`${styles.leftAlignText}`}>Level {level} features</h2>
                    <For each={features()?.[+level]}>
                      { (feature) => <span>
                        <h3 class={`${styles.header2}`}> {feature.name} </h3>

                        <span class={`${styles.leftAlignText}`}> { `     ${feature.description}`} </span>
                      </span>}
                    </For>

                    </span>
                  </Show>}
                </For>
              </span>   
            </Show>

            <For each={currentSubclasses()}>{(subclass)=>{
              return <Show when={activeTab() === currentSubclasses().indexOf(subclass) + 2}>
                <span class={`${styles.flexBoxColumn}`}>
                  <h2 class={`${styles.header2}`}>{subclass.name}</h2>
                  <span class={`${styles.infobox}`}>{subclass.description}</span>

                  <Show when={subclass.features && Object.keys(subclass.features).length > 0}>
                    <For each={Object.keys(subclass.features || {})}>
                      { (level) => <span>
                        <h3 class={`${styles.leftAlignText}`}>Level {level} Features:</h3>
                        <For each={subclass.features?.[+level]}>
                          { (feature) => <span>
                            <h4>{feature.name}</h4>
                            <span class={`${styles.leftAlignText}`}>{feature.description}</span>
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
