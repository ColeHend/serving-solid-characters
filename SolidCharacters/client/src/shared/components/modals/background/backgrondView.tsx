import { Accessor, Component, createEffect, createMemo, createSignal, For, Setter, Show } from "solid-js";
// import { Background } from "../../../../models";
import { Background } from "../../../../models/generated";
import { Modal } from "coles-solid-library";
import styles from "./backgroundView.module.scss"
import Markdown from "../../MarkDown/MarkDown";
import { DndDialogHeader } from "../../dndDialogHeader/dndDialogHeader";
import { ChoiceCard } from "../../choiceCard/choiceCard";

interface props {
  background: Accessor<Background>;
  backClick: [Accessor<boolean>,Setter<boolean>];
}

const BackgroundView: Component<props> = (props) => {
  const currentBackground = props.background;

  const [, setShowMenu] = props.backClick;

  const [menuref, setMenuRef] = createSignal<HTMLElement|null>(null);

  const srdLanguages = createMemo<string[]>(()=>[
      "Common",
      "Undercommon",
      "Abyssal",
      "Infernal",
      "Celestial",
      "Primordial",
      "Draconic",
      "Dwarvish",
      "Elvish",
      "Giant",
      "Gnomish",
      "Goblin",
      "Halfling",
      "Orc",
      "Sylvan",
      "Deep Speech",
  ])
  
  const languages = createMemo(() => currentBackground()?.languages?.options || srdLanguages());
  const features = createMemo(() => currentBackground()?.features || []);
  const abilityOptions = createMemo(() => currentBackground()?.abilityOptions || []);
  const proficiencies = createMemo(() => currentBackground()?.proficiencies || []);
  const feat = createMemo(() => currentBackground()?.feat || "");
  const startEquipmentKeys = createMemo(() => currentBackground()?.startEquipment?.flatMap(x => x?.optionKeys?.join(", ") ?? ""))
  const startEquipment = createMemo(() => currentBackground()?.startEquipment ?? [])

  createEffect(() => {
    const ref = menuref();

    const first = ref?.parentElement ?? null;

    const second = first?.parentElement ?? null;

    if (second) {
      second.style.paddingBottom = "0";
    }
  })

  return (
    <Modal title={currentBackground().name} noHeader show={props.backClick}>
      <div class={`${styles.wrapper}`} ref={setMenuRef}>
        <DndDialogHeader onClose={()=>setShowMenu(false)}>
          <div class={`${styles.styledHeader}`}>
            Background 

            <h1>{currentBackground()?.name}</h1>
          </div>
        </DndDialogHeader>

        <span class={`${styles.desc}`}> 
          <Markdown 
            text={currentBackground().desc}
          />  
        </span>

        <div class={`${styles.Proficiencies}`}>
          <h3>Armor</h3>
          <span>{proficiencies().armor.join(", ") || "None"}</span>
          <h3>Weapons</h3>
          <span>{proficiencies().weapons.join(", ") || "None"}</span>
          <h3>Tools</h3>
          <span>{proficiencies().tools.join(", ") || "None"}</span>
          <h3>Skills</h3>
          <span>{proficiencies().skills.join(", ") || "None"}</span>
        </div>

        <h4 class={`${styles.styledLabel}`}>Starting Equipment</h4>

        
        <div class={`${styles.flavor}`}>
          Choose 
          
          <For each={startEquipmentKeys()}>
            {(key, i) => <>
              <span>{key}</span>

              <Show when={i() !== startEquipmentKeys().length - 1}>
                <span> or </span>
              </Show>
            
            </>}
          </For>
        </div>

        <div class={`${styles.itemChoices}`}>
          <For each={startEquipment()}>
            {(startingChoice) => <ChoiceCard ChoiceKey={startingChoice.optionKeys?.join(", ") ?? ''} text={startingChoice?.items?.join(", ") ?? ""} />}
          </For>
        </div>


        <h4 class={`${styles.styledLabel}`}>Languages</h4>
        
        <div class={`${styles.languages}`}>
          <ChoiceCard ChoiceKey="2" text={languages()?.join(", ")} />
        </div>

        <h4 class={`${styles.styledLabel}`}>Suggested Feat</h4>

        <div class={`${styles.suggestedFeat}`}>
          <ChoiceCard ChoiceKey="S" text={feat()} />
        </div>

        <h4 class={`${styles.styledLabel}`}>Ability Choices</h4>

        <div class={`${styles.abilityChoices}`}>
          <For each={abilityOptions()}>
            {(choice, i) => <ChoiceCard ChoiceKey={`${i() + 1}`} text={choice} />}
          </For>
        </div>
        
        <Show when={features().length >= 1}>
          <h4 class={`${styles.styledLabel}`}>Feature</h4>

          <div>
            <For each={features()}>
              {(feature, i) => <ChoiceCard ChoiceKey={`${i() + 1}`} text={feature?.name ?? ""} />}
            </For>
          </div>
        </Show>
      </div>
    </Modal>
  );
};
export default BackgroundView;