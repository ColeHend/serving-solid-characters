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
        <h2 class={`${styles.header}`}>{currentBackground().name}</h2>

        <div class={`${styles.skillProfsBar}`}>
          <strong>Skill Proficiencies :</strong> <For each={currentBackground().startingProficiencies}>
            {(prof) =><Chip key="skill" value={prof.value.slice(6, prof.value.length)} />}
          </For>
        </div>

        <h3>Languages: choose {currentBackground().languageChoice.choose} of your choice</h3>

        <h3>Starting Equipment : {currentBackground().startingEquipment.map(x=>x.item).join(" & ")}, choose {currentBackground().startingEquipmentChoices.map(x=>x.choose)}: {currentBackground().startingEquipmentChoices.map(x=>x.choices.map(y=>y.item).join(", "))}</h3>

        <div class={`${styles.backgroundFeature}`}>
          <For each={currentBackground().feature}>
            {(feature) => <span>
                  <h3>Feature: {feature.name}</h3>

                  <span>{feature.value}</span>
                </span>}
          </For>
        </div>

      </div>
    </Modal>
  );
};
export default BackgroundView;