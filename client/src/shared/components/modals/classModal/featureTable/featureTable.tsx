import { Accessor, Component, createSignal, For, Show } from "solid-js";
import { DnDClass, LevelEntity } from "../../../../../models/class.model";
import {
  formatKeysForDisplay,
  toDisplayFormat,
} from "../../../../customHooks/utility/stringsHelper";
import styles from "./featureTable.module.scss";
import { Clone } from "../../../../customHooks";
import { Feature } from "../../../../../models/core.model";
import Table from "../../../Table/table";
import { Cell, Column, Header } from "../../../Table/innerTable";
type Props = {
  DndClass: Accessor<DnDClass>;
};

const FeatureTable: Component<Props> = (props) => {
  const Class = props.DndClass;
  const fixedSelectValues = (key: string) => {
    switch (props.DndClass().name.toLowerCase()) {
      case "rogue":
      case "monk":
        if (!Number.isNaN(+key)) return key;
        const fixedValues = JSON.parse(key);
        return `${JSON.parse(fixedValues).DiceCount}d${
          JSON.parse(fixedValues).DiceValue
        }`;
    }
    return key;
  };
  const fixedSorerer = (keyArr: string[]) => {
    if (props.DndClass().name.toLowerCase() === "sorcerer") {
      return keyArr.slice(1);
    }
    return keyArr;
  };
  const highestClassSpecificKeyAmountFirstArr = () => {
    const classSpecific = props.DndClass()?.classLevels;
    const sorted = classSpecific?.sort(
      (b, a) =>
        Object.keys(a.classSpecific).length -
        Object.keys(b.classSpecific).length
    );
    return sorted;
  };
  const [showFeature, setShowFeature] = createSignal<boolean>(false);
  const [classLevel, setClassLevel] = createSignal<LevelEntity[]>(
    Class().classLevels.sort((a, b) => a.info.level - b.info.level)
  );

  return (
    <Table
      data={classLevel}
      columns={["level", "profBonus", "features", "speific0","speific1","speific2","speific3","speific4","speific5","speific6"]}
      class={styles.table}
    >
      <Column name="level">
        <Header>level</Header>
        <Cell<LevelEntity>>{(x, i) => x.info.level}</Cell>
      </Column>

      <Column name="profBonus">
        <Header>PB</Header>
        <Cell<LevelEntity>>{(x, i) => x.profBonus}</Cell>
      </Column>

      <Column name="features">
        <Header>features</Header>
        <Cell<LevelEntity> class={`${styles.feature}`}>
          {(x, i) => x.features.map((x) => x.name).join(", ")}
        </Cell>
      </Column>

      <For
        each={fixedSorerer(
          Object.keys(highestClassSpecificKeyAmountFirstArr()[0].classSpecific)
        )}
      >
        {(Specifickey, i) => (
          <Column name={`speific${i()}`}>
            <Header class={`${styles.specificHeader} ${styles.small}`}>{toDisplayFormat(Specifickey)}</Header>
            <Cell<LevelEntity>>
              {(x, i) => (
                <span>{fixedSelectValues(x.classSpecific[Specifickey])}</span>
              )}
            </Cell>
          </Column>
        )}
      </For>
    </Table>
  );
};

export default FeatureTable;
