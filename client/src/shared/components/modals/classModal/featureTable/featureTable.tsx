import { Accessor, Component, createMemo, createSignal, For, Show } from "solid-js";
import { CasterType, Class5E, Spellslots } from "../../../../../models/data";
import {
  formatKeysForDisplay,
} from "../../../../customHooks/utility/tools/stringsHelper";
import styles from "./featureTable.module.scss";
import { Table, Cell, Column, Header, } from "coles-solid-library";
import { getAddNumberAccent } from "../../../../customHooks";

type Props = {
  DndClass: Accessor<Class5E>;
};

const FeatureTable: Component<Props> = (props) => {

  let classSpecificKeys = createMemo<string[]>(() => Object.keys(props.DndClass().classSpecific || {}));
  let classLevels = createMemo<string[]>(() => Object.keys(props.DndClass().features || {}))

  let getHighestSpellslots = createMemo(() => {
    
    switch (props.DndClass().spellcasting?.metadata.casterType) {
      case CasterType.Full:
        return [1,2,3,4,5,6,7,8,9];

      case CasterType.Half:
        return [1,2,3,4,5];

      case CasterType.Third:
        return [1,2,3,4];

      case CasterType.Pact:
        return [1,2,3,4,5];

      default:
        return [];
      
    }
  })

  const getPactMagicSlots = (level: number) => {
    const keys = [1,2,3,4,5];

    for (let index = 0; index < keys.length; index++) {
      let spellSlot = props.DndClass().spellcasting?.metadata.slots?.[level]?.[`spellSlotsLevel${keys[index]}` as keyof Spellslots];
      if (spellSlot) {
          return [keys[index], spellSlot];
      }
    }

    return [0,0];
  }

  const sortTableColumns = () => {
    let columns = ["level", "profBonus", "features", "Cantrips", ...classSpecificKeys(), "spells"];

    const spellcasting = props.DndClass().spellcasting;
    if (!spellcasting) {
      columns = columns.filter((x) => x !== "spells");
    }


    const hasCantrips = !!Object.values(spellcasting?.metadata.slots || {}).some((slot: any) => slot?.cantripsKnown !== undefined);
    if (!hasCantrips) {
      columns = columns.filter((x) => x !== "Cantrips");
    }

    if (classSpecificKeys().length === 0) {
      columns = columns.filter((x) => !classSpecificKeys().includes(x));
    }

    return columns;
  };

  console.log("x",props.DndClass());
  
  

  return (
    <Table
      data={classLevels}
      columns={sortTableColumns()}
      class={styles.table}
    >
      <Column name="level">
        <Header>
          Level
        </Header>
        <Cell<string>>{(level) => <span>{level}</span>}</Cell>
      </Column>

      <Column name="profBonus">
        <Header>
          Prof. Bonus
        </Header>
        <Cell<string>>{(level) => <span>+{Math.ceil(+level / 4) + 1}</span>}</Cell>
      </Column>

      <Column name="features">
        <Header>
          Features
        </Header>
        <Cell<string>>
          {(level) => (
            <span>
              <For each={props.DndClass().features ? props.DndClass().features?.[+level] : []}>
                {(feature) => (
                  <div>
                    <strong>{feature.name}</strong>
                  </div>
                )}
              </For>
            </span>
          )}
        </Cell>
      </Column>

      <For each={classSpecificKeys()}>
        {(key) => <Column name={key}>
            <Header>
              {formatKeysForDisplay(key)}
            </Header>
            <Cell<string>>
              {(level) => (
                <span>
                  {props.DndClass().classSpecific
                    ? props.DndClass().classSpecific?.[key]?.[+level] || "-"
                    : "-"}
                </span>
              )}
            </Cell>
          </Column> }
      </For>

      <Column name="Cantrips">
        <Header>
          Cantrips
        </Header>
        <Cell<String>>
          { (level) =>
            <span>
              {props.DndClass().spellcasting?.metadata.slots?.[+level]?.cantripsKnown ?? "-"}
            </span>
          }
        </Cell>
      </Column>

      <Column name="spells">
        <Header>
          Spells Slots
        </Header>
        <Cell<string>>
          {(level) => (
            <span class={`${styles.spellSlotsRow}`}>
              <For each={getHighestSpellslots()}>
                {(spellLevel) => <span>
                  <Show when={props.DndClass().spellcasting?.metadata.casterType !== CasterType.Pact}>
                    {props.DndClass().spellcasting?.metadata.slots?.[+level]?.[`spellSlotsLevel${spellLevel}` as keyof Spellslots] || "-"}
                  </Show>
                </span> }
              </For>
              <Show when={props.DndClass().spellcasting?.metadata.casterType === CasterType.Pact}>
                {getPactMagicSlots(+level)[1]} {getAddNumberAccent(getPactMagicSlots(+level)[0]) } level
              </Show> 
            </span>
          )}
        </Cell>
      </Column>
    </Table>
  );
};

export default FeatureTable;
