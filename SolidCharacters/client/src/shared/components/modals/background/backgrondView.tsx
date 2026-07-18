import { Accessor, Component, createEffect, createMemo, createSignal, For, Setter, Show } from "solid-js";
import { Background } from "../../../../models/generated";
import { FlatCard, Modal } from "coles-solid-library";
import styles from "./backgroundView.module.scss"
import Markdown from "../../MarkDown/MarkDown";
import { DndDialogHeader } from "../../dndDialogHeader/dndDialogHeader";
import { sourceLabel } from "../modals.shared";
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
  const startEquipment = createMemo(() => currentBackground()?.startEquipment ?? []);

  const legacy = createMemo(() => currentBackground().legacy !== false);

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
            <div>
              <div class={`${styles.eyebrow}`}>Background <Show when={legacy()}><span class={`${styles.dot}`}>·</span> legacy</Show><span class={`${styles.dot}`}>·</span> {sourceLabel(currentBackground(), 'background')}</div>

            </div>

            <h1 class={`${styles.title}`}>{currentBackground()?.name}</h1>
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

        <Show when={startEquipment().length >=1}>
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
        </Show>

        <Show when={languages().length >= 1}>
          <h4 class={`${styles.styledLabel}`}>Languages</h4>
          
          <div class={`${styles.languages}`}>
            <ChoiceCard ChoiceKey="2" text={languages()?.join(", ")} />
          </div>
        </Show>

        <Show when={feat() !== ""}>
          <h4 class={`${styles.styledLabel}`}>Suggested Feat</h4>

          <div class={`${styles.suggestedFeat}`}>
            <ChoiceCard ChoiceKey="S" text={feat()} />
          </div>
        </Show>

        <Show when={abilityOptions().length >= 1}>
          <h4 class={`${styles.styledLabel}`}>Ability Choices</h4>

          <div class={`${styles.abilityChoices}`}>
            <For each={abilityOptions()}>
              {(choice, i) => <ChoiceCard ChoiceKey={`${i() + 1}`} text={choice} />}
            </For>
          </div>
        </Show>

        <Show when={features().length >= 1}>
          <h4 class={`${styles.styledLabel}`}>Feature</h4>

          <div class={`${styles.features}`}>
            <For each={features()}>
              {(feature) => <FlatCard header={<h2>{feature.name}</h2>} transparent class={`${styles.dndFlatcard}`}>
                <div>
                  <span><Markdown text={feature.description}/></span>
                </div> 
              </FlatCard>}
            </For>
          </div>
        </Show>

      </div>
    </Modal>
  );
};
export default BackgroundView;