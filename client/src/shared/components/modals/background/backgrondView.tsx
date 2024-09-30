import { Accessor, Component, For, Setter } from "solid-js";
import { Background } from "../../../../models";
import Modal from "../../popup/popup.component";
import styles from "./backgroundView.module.scss"
import { Chip } from "../../..";

interface props {
  background: Accessor<Background>;
  backClick?: [Accessor<boolean>,Setter<boolean>];
}

const BackgroundView: Component<props> = (props) => {
  const currentBackground = props.background;

  return (
    <Modal title={currentBackground().name} backgroundClick={props.backClick}>
      <div class={`${styles.wrapper}`}>
       
        {currentBackground().name}
      </div>
      <div class={`${styles.body}`}>
        <h2>
          {currentBackground().name}
        </h2>

        <div>
          <For each={currentBackground().feature}>
            {(feature) =>
              <>
                <span>
                  <h3>
                    {feature.name}
                  </h3>
                  <br />
                  <span class={`${styles.feature}`}>
                    {feature.value}
                  </span>
                </span>
                <br />
              </>
            }
          </For>
        </div>

        <h3>{currentBackground().languageChoice.type}</h3>

        <h3>choose: {currentBackground().languageChoice.choose}</h3>

        <div>
          <For each={currentBackground().languageChoice.choices}>
            {(choice) =>
              <>
                <span>{choice}</span>
                <br />
              </>
            }
          </For>
        </div>

        <br />

        <h3>Starting Equipment</h3>
        <div>
          <For each={currentBackground().startingEquipment}>
            {(item) =>
              <>
                <span>{item.item}</span>
                <br />
              </>
            }
          </For>
        </div>

        <br />

        <div>
          <For each={currentBackground().startingEquipmentChoices}>
            {(choice) =>
              <>
                <h3>Choose: {choice.choose}</h3>
                <For each={choice.choices}>
                  {(item) =>
                    <>
                      <span>{(item as any)?.quantity ?? ''}  {item.item}</span>
                      <br />
                    </>
                  }
                </For>
              </>
            }
          </For>
        </div>

        <h3>Skill Proficiencies</h3>
        <div>
          <For each={currentBackground().startingProficiencies}>
            {(prof) =>
              <>
                <span>{prof.value}</span>
                <br />
              </>
            }
          </For>
        </div>


      </div>
    </Modal>
  );
};
export default BackgroundView;