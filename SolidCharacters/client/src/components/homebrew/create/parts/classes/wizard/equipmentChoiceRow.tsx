import { Component } from 'solid-js';
import { Input, Icon } from 'coles-solid-library';
import { Delete } from 'coles-solid-library/icons';
import type { EquipmentChoice } from './wizard.shared';
import styles from './stepEquipment.module.scss';

interface EquipmentChoiceRowProps {
  choice: EquipmentChoice;
  index: number;
  onChange: (index: number, next: EquipmentChoice) => void;
  onDelete: (index: number) => void;
}

// One A-or-B starting-equipment choice: a letter badge, two option inputs joined by
// "or", and a trash button. Values are committed straight back through onChange so the
// parent can replace the whole equipmentChoices array (never mutate in place).
export const EquipmentChoiceRow: Component<EquipmentChoiceRowProps> = (props) => {
  const letter = () => String.fromCharCode(65 + props.index);

  return (
    <div class={styles.choiceRow}>
      <span class={styles.choiceBadge}>{letter()}</span>

      <span class={styles.choiceInput}>
        <Input
          value={props.choice.a}
          placeholder="a martial weapon and a shield"
          onChange={(e) => props.onChange(props.index, { a: e.currentTarget.value, b: props.choice.b })}
        />
      </span>

      <span class={styles.orSep}>or</span>

      <span class={styles.choiceInput}>
        <Input
          value={props.choice.b}
          placeholder="two martial weapons"
          onChange={(e) => props.onChange(props.index, { a: props.choice.a, b: e.currentTarget.value })}
        />
      </span>

      <button
        type="button"
        class={styles.iconBtn}
        aria-label={`Delete choice ${letter()}`}
        onClick={() => props.onDelete(props.index)}
      >
        <Icon icon={Delete} size="small" />
      </button>
    </div>
  );
};
