import { Component, For, Show, runWithOwner } from 'solid-js';
import { Input, Option, Select, TextArea } from 'coles-solid-library';
import { itemsStore } from '../itemsStore';
import { KIND_CARDS, StepProps } from './wizard.shared';
import { OptionCard } from '../../classes/wizard/optionCard';
import sharedStyles from '../../classes/wizard/classesWizard.module.scss';
import styles from './itemsWizard.module.scss';

// Step 1 of the items wizard: the SRD/homebrew loader, then name, kind, description
// and cost/weight. The loader lives here (not in a toolbar) — it's a "start from"
// affordance that belongs at the beginning of the flow.
export const StepIdentity: Component<StepProps> = (props) => {
  const store = itemsStore;
  const srdNames = () => Object.keys(store.state.srd).sort();
  const homebrewNames = () => Object.keys(store.state.homebrew).sort();

  return (
    <div class={styles.step}>
      <div class={sharedStyles.card}>
        <div class={sharedStyles.boxedField}>
          <span class={sharedStyles.cardLabel}>Load an existing item — optional</span>
          <Select
            transparent
            value={store.state.selection.activeName || ''}
            // coles Select fires onChange from a tracked effect; detach so the store write
            // can't be captured by that scope, and bail on the current-value echo.
            onChange={(val) => runWithOwner(null, () => {
              if (val === (store.state.selection.activeName || '')) return;
              props.selectExisting(val);
            })}
          >
            <Option value="">-- choose --</Option>
            <Option value="__new__">+ New Item</Option>
            <For each={srdNames()}>{n => <Option value={n}>{n}</Option>}</For>
            <Show when={homebrewNames().length}>
              <Option value="__divider_homebrew__">-- Homebrew --</Option>
              <For each={homebrewNames()}>{n => <Option value={n}>{n} [HB]</Option>}</For>
            </Show>
          </Select>
        </div>
      </div>

      <Show when={store.state.form}>
        <div class={sharedStyles.card}>
          <div class={sharedStyles.boxedField}>
            <span class={sharedStyles.cardLabel}>Item name</span>
            <Input
              transparent
              value={store.state.form!.name}
              onInput={e => store.updateField('name', e.currentTarget.value)}
              placeholder="Enter item name..."
            />
          </div>

          <span class={sharedStyles.cardLabel}>What kind of thing is it?</span>
          <div class={sharedStyles.optionRow}>
            <For each={KIND_CARDS}>
              {(card) => (
                <OptionCard
                  title={card.title}
                  subtitle={card.sub}
                  alignStart
                  badge
                  selected={store.state.form!.kind === card.kind}
                  onSelect={() => store.setKind(card.kind)}
                />
              )}
            </For>
          </div>

          <div class={sharedStyles.boxedField}>
            <span class={sharedStyles.cardLabel}>Description</span>
            <TextArea
              transparent
              rows={4}
              text={() => store.state.form!.desc}
              setText={((v: string) => store.updateField('desc', v)) as never}
            />
          </div>

          <div class={styles.costGrid}>
            <div class={sharedStyles.boxedField}>
              <span class={sharedStyles.cardLabel}>Cost</span>
              {/* coles Input type="number" delegates to NumberInput, which only emits
                  onChange (blur/stepper) — onInput never fires on it. */}
              <Input
                type="number"
                transparent
                value={store.state.form!.cost.quantity}
                onChange={e => store.mutate(d => d.cost.quantity = parseInt(e.currentTarget.value || '0'))}
              />
            </div>
            <div class={sharedStyles.boxedField}>
              <span class={sharedStyles.cardLabel}>Unit</span>
              <Input
                transparent
                value={store.state.form!.cost.unit}
                onInput={e => store.mutate(d => d.cost.unit = e.currentTarget.value)}
                placeholder="GP"
              />
            </div>
            <div class={sharedStyles.boxedField}>
              <span class={sharedStyles.cardLabel}>Weight (lb)</span>
              <Input
                type="number"
                transparent
                value={store.state.form!.weight || 0}
                onChange={e => store.updateField('weight', parseInt(e.currentTarget.value || '0'))}
              />
            </div>
          </div>
        </div>
      </Show>
    </div>
  );
};
