import { Component, For, Show } from 'solid-js';
import { Icon } from 'coles-solid-library';
import { Delete } from 'coles-solid-library/icons';
import type { EquipmentOption } from './equipment.shared';
import { CustomEntryInput } from './customEntryInput';
import styles from './stepEquipment.module.scss';

interface EquipmentOptionRowProps {
  option: EquipmentOption;
  /** Option label within its row: A, B, C… */
  letter: string;
  /** True when this option is the compendium's active add-target. */
  active: boolean;
  /** Options can be removed only while their row keeps the minimum two. */
  removable: boolean;
  onSelect: () => void;
  onAddCustom: (text: string) => void;
  onRemoveEntry: (entryIndex: number) => void;
  onSetQty: (entryIndex: number, qty: number) => void;
  onRemoveOption: () => void;
}

// One option inside a choice row: a letter badge plus the entry chips. Clicking anywhere
// on the row toggles it as the compendium's add-target (inner controls stop propagation).
// Item chips carry a ×N quantity with -/+ steppers; custom chips are plain text.
export const EquipmentOptionRow: Component<EquipmentOptionRowProps> = (props) => {
  const qtyOf = (index: number) => props.option.entries[index]?.qty ?? 1;

  return (
    <div
      class={`${styles.optionRow} ${props.active ? styles.optionActive : ''}`}
      role="button"
      tabIndex={0}
      aria-pressed={props.active}
      aria-label={`Option ${props.letter}${props.active ? ' — receiving compendium items' : ''}`}
      onClick={props.onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          props.onSelect();
        }
      }}
    >
      <span class={styles.optionBadge}>{props.letter}</span>

      <div class={styles.optionChips}>
        <For each={props.option.entries}>{(entry, i) => (
          <span class={entry.kind === 'item' ? styles.itemChip : styles.customChip}>
            {entry.name}
            <Show when={entry.kind === 'item' && (entry.qty ?? 1) > 1}>
              <span class={styles.chipQty}>×{entry.qty}</span>
            </Show>
            <Show when={entry.kind === 'item'}>
              <Show when={(entry.qty ?? 1) > 1}>
                <button
                  type="button"
                  class={styles.chipBtn}
                  aria-label={`Decrease ${entry.name} quantity`}
                  onClick={(e) => {
                    e.stopPropagation();
                    props.onSetQty(i(), qtyOf(i()) - 1);
                  }}
                >
                  −
                </button>
              </Show>
              <button
                type="button"
                class={styles.chipBtn}
                aria-label={`Increase ${entry.name} quantity`}
                onClick={(e) => {
                  e.stopPropagation();
                  props.onSetQty(i(), qtyOf(i()) + 1);
                }}
              >
                +
              </button>
            </Show>
            <button
              type="button"
              class={styles.chipRemove}
              aria-label={`Remove ${entry.name}`}
              onClick={(e) => {
                e.stopPropagation();
                props.onRemoveEntry(i());
              }}
            >
              ×
            </button>
          </span>
        )}</For>

        <Show when={!props.option.entries.length}>
          <span class={styles.optionEmpty}>
            {props.active ? 'Add items with + in the compendium' : 'Click to target, then + items'}
          </span>
        </Show>

        <CustomEntryInput onCommit={props.onAddCustom} />
      </div>

      <Show when={props.removable}>
        <button
          type="button"
          class={styles.iconBtn}
          aria-label={`Remove option ${props.letter}`}
          onClick={(e) => {
            e.stopPropagation();
            props.onRemoveOption();
          }}
        >
          <Icon icon={Delete} size="small" />
        </button>
      </Show>
    </div>
  );
};
