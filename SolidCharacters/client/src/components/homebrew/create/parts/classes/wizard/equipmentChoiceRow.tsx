import { Component, For, Show } from 'solid-js';
import { Icon } from 'coles-solid-library';
import { Delete } from 'coles-solid-library/icons';
import type { EquipmentChoice } from './equipment.shared';
import { EquipmentOptionRow } from './equipmentOptionRow';
import styles from './stepEquipment.module.scss';

interface EquipmentChoiceRowProps {
  choice: EquipmentChoice;
  /** Row index (rows are numbered; their options are lettered A/B/C…). */
  index: number;
  /** Which option in THIS row is the compendium's add-target, or null. */
  activeOption: number | null;
  onSelectOption: (row: number, option: number) => void;
  onAddCustom: (row: number, option: number, text: string) => void;
  onRemoveEntry: (row: number, option: number, entryIndex: number) => void;
  onSetQty: (row: number, option: number, entryIndex: number, qty: number) => void;
  onAddOption: (row: number) => void;
  onRemoveOption: (row: number, option: number) => void;
  onDelete: (row: number) => void;
}

// One starting-equipment choice: a numbered header, its lettered options stacked with
// "or" separators, and a "+ add option" affordance. Purely presentational — every edit
// is raised to the parent, which rebuilds the FormGroup array immutably.
export const EquipmentChoiceRow: Component<EquipmentChoiceRowProps> = (props) => {
  const letter = (option: number) => String.fromCharCode(65 + option);

  return (
    <div class={styles.choiceRow}>
      <div class={styles.choiceHeader}>
        <span class={styles.choiceBadge}>{props.index + 1}</span>
        <span class={styles.choiceTitle}>Choice {props.index + 1}</span>
        <button
          type="button"
          class={styles.iconBtn}
          aria-label={`Delete choice ${props.index + 1}`}
          onClick={() => props.onDelete(props.index)}
        >
          <Icon icon={Delete} size="small" />
        </button>
      </div>

      <For each={props.choice.options}>{(option, i) => (
        <>
          <Show when={i() > 0}>
            <span class={styles.orSep}>or</span>
          </Show>
          <EquipmentOptionRow
            option={option}
            letter={letter(i())}
            active={props.activeOption === i()}
            removable={props.choice.options.length > 2}
            onSelect={() => props.onSelectOption(props.index, i())}
            onAddCustom={(text) => props.onAddCustom(props.index, i(), text)}
            onRemoveEntry={(entryIndex) => props.onRemoveEntry(props.index, i(), entryIndex)}
            onSetQty={(entryIndex, qty) => props.onSetQty(props.index, i(), entryIndex, qty)}
            onRemoveOption={() => props.onRemoveOption(props.index, i())}
          />
        </>
      )}</For>

      <button
        type="button"
        class={styles.addOptionBtn}
        onClick={() => props.onAddOption(props.index)}
      >
        + add option
      </button>
    </div>
  );
};
