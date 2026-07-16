import { Component, For, Show } from 'solid-js';
import { Icon, Input } from 'coles-solid-library';
import { Delete } from 'coles-solid-library/icons';
import { CURRENCIES, CURRENCY_NAMES, Currency, EquipmentGroup } from './wizard.shared';
import { CustomEntryInput } from '../../classes/wizard/customEntryInput';
import eq from '../../classes/wizard/stepEquipment.module.scss';
import bg from './backgroundsWizard.module.scss';

const CURRENCY_COLORS: Record<Currency, string> = {
  PP: '#E5E4E2',
  GP: '#FFD700',
  EP: '#CDBA6C',
  SP: '#C0C0C0',
  CP: '#B87333',
};

interface EquipmentGroupRowProps {
  group: EquipmentGroup;
  index: number;
  /** True while this group is the compendium's add-target. */
  active: boolean;
  onActivate: () => void;
  onKeyChange: (key: string) => void;
  onAddItem: (item: string) => void;
  /** By index — a group may legitimately hold duplicate items. */
  onRemoveItem: (itemIndex: number) => void;
  onCurrencyChange: (currency: Currency, value: number) => void;
  onDelete: () => void;
}

/**
 * One starting-equipment option group: an editable option key, the item chips
 * (compendium picks + free-form entries) and the starting-coin fields. Clicking
 * anywhere on the row makes it the compendium's add-target.
 */
export const EquipmentGroupRow: Component<EquipmentGroupRowProps> = (props) => {
  return (
    <div
      class={`${eq.choiceRow} ${props.active ? eq.optionActive : ''}`}
      onClick={() => props.onActivate()}
    >
      <div class={eq.choiceHeader}>
        <span class={eq.choiceBadge}>{props.index + 1}</span>
        <span class={eq.choiceTitle}>Option</span>
        <span class={bg.keyInput} onClick={(e) => e.stopPropagation()}>
          <Input
            value={props.group.key}
            placeholder="Key (e.g. A)"
            onInput={(e) => props.onKeyChange(e.currentTarget.value)}
          />
        </span>
        <button
          type="button"
          class={eq.iconBtn}
          aria-label={`Delete option group ${props.group.key || props.index + 1}`}
          onClick={(e) => {
            e.stopPropagation();
            props.onDelete();
          }}
        >
          <Icon icon={Delete} size={'small'} />
        </button>
      </div>

      <div class={eq.optionChips}>
        <For each={props.group.items}>{(item, i) => (
          <span class={eq.itemChip}>
            {item}
            <button
              type="button"
              class={eq.chipRemove}
              aria-label={`Remove ${item}`}
              onClick={(e) => {
                e.stopPropagation();
                props.onRemoveItem(i());
              }}
            >
              ×
            </button>
          </span>
        )}</For>
        <Show when={!props.group.items.length}>
          <span class={eq.optionEmpty}>Click items in the compendium to add them here.</span>
        </Show>
        <CustomEntryInput onCommit={(text) => props.onAddItem(text)} />
      </div>

      <div class={bg.currencyRow}>
        <span class={bg.currencyLabel}>Coin:</span>
        <For each={CURRENCIES}>{(currency) => (
          <label class={bg.currencyField} onClick={(e) => e.stopPropagation()}>
            <span class={bg.currencyDot} style={{ 'background-color': CURRENCY_COLORS[currency] }} />
            <span class={bg.currencyTag} title={CURRENCY_NAMES[currency]}>{currency}</span>
            <Input
              type="number"
              min={0}
              value={props.group.currency[currency] ?? 0}
              onInput={(e) => props.onCurrencyChange(currency, Math.max(0, +e.currentTarget.value || 0))}
            />
          </label>
        )}</For>
      </div>
    </div>
  );
};
