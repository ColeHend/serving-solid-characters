import {
  Accessor,
  Component,
  createEffect,
  createMemo,
  createSignal,
  For,
  Match,
  Setter,
  Show,
  Switch,
} from "solid-js";
import FeatureTable from "./featureTable/featureTable";
import { Class5E, Subclass } from "../../../../models/generated";
import getUserSettings from "../../../customHooks/userSettings";
import useStyles from "../../../../shared/customHooks/utility/style/styleHook";
import styles from "./classModal.module.scss";
import { FlatCard, Modal,TabBar } from "coles-solid-library";
import { incrementString } from "../../../customHooks/utility/tools/incrementChar";
import { ChoiceCard } from "../../choiceCard/choiceCard";
import Markdown from "../../MarkDown/MarkDown";
import { DndDialogHeader } from "../../dndDialogHeader/dndDialogHeader";
import { Clone } from "../../..";

type props = {
  currentClass: Accessor<Class5E>;
  boolean: Accessor<boolean>;
  booleanSetter: Setter<boolean>;
  subclasses: Accessor<Subclass[]>
};

enum ClassModalTabs {
  Items = 0,
  Features = 1,
  Subclasses = 2
}

const ClassModal: Component<props> = (props) => {
  const [userSettings,] = getUserSettings();
  const stylin = createMemo(() => useStyles(userSettings().theme));
  const [activeTab,setActiveTab] = createSignal<number>(0);
  const allSubclasses = props.subclasses;

  const legacy = createMemo(() => (props?.currentClass()?.legacy ?? false) !== false);

  const starting_equipment = createMemo(() => props?.currentClass()?.startingEquipment || []);
  const startingItemsOptionKeys = createMemo(()=>starting_equipment()?.flatMap(x=>x?.optionKeys || []));
  const classLevels = createMemo(() => Object.keys(props?.currentClass()?.features || {}));
  const features = createMemo(() => props?.currentClass()?.features || []);
  const choices = createMemo(() => props?.currentClass()?.choices || {});
  const currentSubclasses = createMemo<Subclass[]>(() => {
    return allSubclasses()?.filter(s => (s?.parentClass ?? "") === (props?.currentClass()?.name ?? "")).filter(s => s.legacy === legacy());
  });

  const armorChoiceKey = createMemo(()=>props?.currentClass()?.startChoices?.armor ?? "");
  const equipChoiceKey = createMemo(()=>props?.currentClass()?.startChoices?.equipment ?? "");
  const toolChoiceKey = createMemo(()=>props?.currentClass()?.startChoices?.tools ?? "");
  const weaponChoiceKey = createMemo(()=>props?.currentClass()?.startChoices?.weapon ?? "");
  const itemOptions = createMemo(() => choices()?.[equipChoiceKey()]?.options ?? []);

  const allStartChoiceKeys = createMemo(() => [armorChoiceKey(), equipChoiceKey(), "skills", toolChoiceKey(), weaponChoiceKey(), ...startingItemsOptionKeys()].filter(key => key !== ""));


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

  const [menuRef, setMenuRef] = createSignal<HTMLElement|null>(null);

  createEffect(() => {
    const ref = menuRef();

    if (!ref) {

      return;
    }
    

    const firstParent = ref?.parentElement;

    const second = firstParent?.parentElement;

    if (second) {
      second.style.paddingBottom = "0"
    }
  })


  return (
    <Modal
      title={props.currentClass().name}
      show={[props.boolean, props.booleanSetter]}
      noHeader
    >
      <div class={`${stylin()?.primary} ${styles.CenterPage}`} ref={setMenuRef}>
        <DndDialogHeader onClose={()=>props.booleanSetter(false)}>
          <div class={`${styles.styledHeader}`}>
            Class <span>·</span> <Show when={legacy()}>d</Show>{props?.currentClass().hitDie ?? ""} hit die <Show when={legacy()}><span>·</span> legacy</Show>

            <h1>{props?.currentClass().name ?? ""}</h1>
          </div>
        </DndDialogHeader>
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
            tabs={["Choices","Features", "Subclasses"]} 
            activeTab={activeTab()} 
            onTabChange={(label,index)=>setActiveTab(index)}
            colors={{
              indicator: "#7c2718",
              text: "#7c2718"
            }}
            class={`${styles.tabBar}`}
            />

            <Show when={activeTab() === ClassModalTabs.Items}>
              {/* <span>
                <For each={startItems()}>
                    { (item,i) => <ChoiceCard ChoiceKey="" text={item} />}
                </For>
              </span> */}

              <Show when={allStartChoiceKeys().length > 0}>
                <For each={allStartChoiceKeys()}>
                  {(key) => <div>
                    <h3 class={`${styles.flankedLable }`}>
                      {key.replaceAll("_", " ")}
                    </h3> 

                     <Switch fallback={
                      <>
                        <h4>Choose: 
                          <span>
                            { choices()[key]?.amount }
                          </span>
                        </h4>

                        <div class={`${styles.ChoiceCards}`}>
                          <ChoiceCard ChoiceKey={`${choices()[key]?.amount}`} text={choices()[key]?.options?.join(", ")} />  
                        </div>
                      </>
                    }>
                      <Match when={key === "Equipment"}>
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

                        <div class={`${styles.ChoiceCards}`}>
                            <For each={choices()?.[key]?.options ?? []}>
                              { (itemOption, i) => <ChoiceCard ChoiceKey={getItemOptionKey()?.[i()]} text={itemOption} /> }
                            </For>
                        </div>
                      </Match>
                      
                    </Switch>
                  </div>}
                </For>
              </Show>
            </Show>

            <Show when={activeTab() === ClassModalTabs.Features}>
              <span>
                <For each={classLevels()}>
                  { (level) => <Show when={features()?.[+level]?.length}>
                    <span>
                      <h2 class={`${styles.flankedLable}`}>level {level} features</h2>
                      <For each={features()?.[+level]}>
                        { (feature) => <span class={`${styles.feature}`}>
                          <strong>{feature.name} (level {level}). </strong>
                          <Markdown text={feature.description} />
                        </span>}
                      </For>

                    </span>
                  </Show>}
                </For>
              </span>   
            </Show>

            <Show when={activeTab() === ClassModalTabs.Subclasses}>
              <For each={currentSubclasses()}>{(subclass)=><FlatCard header={<h2>{subclass.name}</h2>} transparent class={`${styles.subclassCard}`}>
                <div class={`${styles.subclassDesc}`}>
                  <Markdown text={subclass.description} />
                </div>
                  
                <For each={classLevels()}>
                  { (level) => <Show when={features()?.[+level]?.length}>
                    <span>
                      
                      <For each={subclass?.features?.[+level]}>
                        { (feature) => <span class={`${styles.feature}`}>
                          <strong>{feature.name} (level {level}). </strong>
                          <Markdown text={feature.description} />
                        </span>}
                      </For>

                    </span>
                  </Show>}
                </For>

              </FlatCard>}</For>
              
            </Show>
           
          </div>
        </div>
      </div>
    </Modal>
  );
};
export default ClassModal;
