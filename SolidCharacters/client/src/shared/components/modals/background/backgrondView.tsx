import { Accessor, Component, createMemo, For, Setter, Show } from "solid-js";
// import { Background } from "../../../../models";
import { Background } from "../../../../models/data";
import { Modal } from "coles-solid-library";
import styles from "./backgroundView.module.scss"
import Markdown from "../../MarkDown/MarkDown";

interface props {
  background: Accessor<Background>;
  backClick: [Accessor<boolean>,Setter<boolean>];
}

const BackgroundView: Component<props> = (props) => {
  const currentBackground = props.background;

  const languages = createMemo(() => currentBackground().languages?.options || []);
  const features = createMemo(() => currentBackground().features || []);
  const abilityOptions = createMemo(() => currentBackground().abilityOptions || []);
  const proficiencies = createMemo(() => currentBackground().proficiencies || []);
  const feat = createMemo(() => currentBackground().feat || "");
  const itemOptionKeys = createMemo(() => currentBackground().startEquipment.flatMap(item => item.optionKeys || []));

  return (
    <Modal title={currentBackground().name} show={props.backClick}>
      <div class={`${styles.wrapper}`}>

        <span> 
          <Markdown 
            text={currentBackground().desc}
          />  
        </span>

        <div class={`${styles.flexBoxRow}`}>
          <div class={`${styles.flexBoxColumn}`}>
            <Show when={abilityOptions().length > 0}>
              <h3 class={`${styles.header}`}> 
                <div>Ability Score Increase</div> 
              </h3>
                <span>Increase by 1:</span>
              <ul class={`${styles.skillProfsBar}`}>
                <For each={abilityOptions()}>
                  {(score) => <li>{score}</li>}
                </For>
              </ul>
            </Show>

            <Show when={feat() !== ""}>
              <h3 class={`${styles.header}`}> Suggested Feat </h3>
              <div class={`${styles.info}`}>
                {feat()}
              </div>
            </Show>
          </div>
          <div class={`${styles.flexBoxColumn}`}>
            <Show when={features().length > 0}>
              <div>
                <For each={features()}>
                  {(feature) =>
                    <div class={`${styles.backgroundFeature}`}>
                      <h3>
                        {feature.name}
                      </h3>
                      <span>
                        <Markdown text={feature.description} />
                      </span>
                    </div>
                  }
                </For>
              </div>
            </Show>

            <Show when={languages().length > 0}>
              <h3 class={`${styles.header}`}> Languages </h3>

              <h3>Choose: { currentBackground().languages?.amount} </h3>

              <div>
                <For each={currentBackground().languages?.options }>
                  {(choice) =>
                    <div>
                      <span>{choice}</span>
                    </div>
                  }
                </For>
              </div>
            </Show>

            <h3>Starting Equipment</h3>
            <div>
              <For each={currentBackground().startEquipment}>
                {(item,i) =>
                  <div>
                    <span>{itemOptionKeys()[i()]}:</span>
                    <span>{item.items?.join(", ")}</span>
                  </div>
                }
              </For>
           </div>
          </div>
        </div>




        <h3>Proficiencies</h3>
        
        <div class={`${styles.info}`}>
          Armor : {proficiencies().armor.join(", ") || "None"}
        </div>

        <div class={`${styles.info}`}>
          Weapons : {proficiencies().weapons.join(", ") || "None"}
        </div>

        <div class={`${styles.info}`}>
          Tools : {proficiencies().tools.join(", ") || "None"}
        </div>

        <div class={`${styles.info}`}>
          Skills : {proficiencies().skills.join(", ") || "None"}
        </div>

      </div>
    </Modal>
  );
};
export default BackgroundView;