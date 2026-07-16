import { Component, For, Show, createSignal } from 'solid-js';
import { StepProps } from './wizard.shared';
import {
  EquipmentChoice,
  EquipmentOption,
  addCustomEntry,
  addItemEntry,
  emptyEquipmentChoice,
  setEntryQty,
  removeEntry,
} from './equipment.shared';
import { EquipmentChoiceRow } from './equipmentChoiceRow';
import { CompendiumPanel } from './compendiumPanel';
import wiz from './classesWizard.module.scss';
import styles from './stepEquipment.module.scss';

// Step 3 of the class wizard: level-1 starting equipment.
// LEFT — choice rows (each an "or" set of item/custom-chip options) plus a fixed kit of
// always-granted items. RIGHT — the compendium picker. Clicking an option makes it the
// picker's add-target; with none selected the picker feeds the fixed kit.
// All array writes replace the array (never mutate) so the FormGroup stays reactive.
export const StepEquipment: Component<StepProps> = (props) => {
  const choices = (): EquipmentChoice[] => props.formGroup.get('equipmentChoices') ?? [];
  const kit = (): string[] => props.formGroup.get('itemStart') ?? [];

  const [activeTarget, setActiveTarget] = createSignal<{ row: number; option: number } | null>(null);

  const setChoices = (next: EquipmentChoice[]) => props.formGroup.set('equipmentChoices', next);

  // Rebuilds choices → options → entries immutably at every level; a single set() call.
  const mutateOption = (row: number, option: number, fn: (o: EquipmentOption) => EquipmentOption) => {
    setChoices(choices().map((c, i) =>
      i !== row ? c : { options: c.options.map((o, j) => (j !== option ? o : fn(o))) },
    ));
  };

  const addChoice = () => setChoices([...choices(), emptyEquipmentChoice()]);

  const deleteChoice = (row: number) => {
    setChoices(choices().filter((_, i) => i !== row));
    setActiveTarget((t) => {
      if (!t || t.row === row) return null;
      return t.row > row ? { ...t, row: t.row - 1 } : t;
    });
  };

  const addOption = (row: number) => {
    setChoices(choices().map((c, i) => (i !== row ? c : { options: [...c.options, { entries: [] }] })));
  };

  const removeOption = (row: number, option: number) => {
    setChoices(choices().map((c, i) => (i !== row ? c : { options: c.options.filter((_, j) => j !== option) })));
    setActiveTarget((t) => {
      if (!t || t.row !== row) return t;
      if (t.option === option) return null;
      return t.option > option ? { ...t, option: t.option - 1 } : t;
    });
  };

  const selectOption = (row: number, option: number) => {
    setActiveTarget((t) => (t && t.row === row && t.option === option ? null : { row, option }));
  };

  const targetLabel = (): string => {
    const t = activeTarget();
    return t ? `Choice ${t.row + 1} · Option ${String.fromCharCode(65 + t.option)}` : 'Fixed kit';
  };

  const handleCompendiumAdd = (name: string) => {
    const t = activeTarget();
    if (!t) return addToKit(name);
    mutateOption(t.row, t.option, (o) => addItemEntry(o, name));
  };

  const addToKit = (name: string) => {
    const current = kit();
    if (current.includes(name)) return;
    props.formGroup.set('itemStart', [...current, name]);
  };

  const removeFromKit = (name: string) => {
    props.formGroup.set('itemStart', kit().filter((n) => n !== name));
  };

  return (
    <div class={styles.layout}>
      {/* LEFT — choices + fixed kit */}
      <div class={wiz.card}>
        <div class={styles.section}>
          <span class={wiz.cardLabel}>Equipment choices</span>
          <div class={styles.choiceList}>
            <For each={choices()}>{(choice, index) => (
              <EquipmentChoiceRow
                choice={choice}
                index={index()}
                activeOption={activeTarget()?.row === index() ? activeTarget()!.option : null}
                onSelectOption={selectOption}
                onAddCustom={(row, option, text) => mutateOption(row, option, (o) => addCustomEntry(o, text))}
                onRemoveEntry={(row, option, entryIndex) => mutateOption(row, option, (o) => removeEntry(o, entryIndex))}
                onSetQty={(row, option, entryIndex, qty) => mutateOption(row, option, (o) => setEntryQty(o, entryIndex, qty))}
                onAddOption={addOption}
                onRemoveOption={removeOption}
                onDelete={deleteChoice}
              />
            )}</For>
          </div>
          <button type="button" class={styles.addChoiceBtn} onClick={addChoice}>
            + Add equipment choice
          </button>
        </div>

        <div class={styles.section}>
          <span class={wiz.cardLabel}>Fixed kit — always granted</span>
          <div class={styles.kitRow}>
            <Show
              when={kit().length}
              fallback={<span class={styles.kitEmpty}>No fixed items yet — add from the compendium.</span>}
            >
              <For each={kit()}>{(name) => (
                <span class={styles.kitChip}>
                  {name}
                  <button
                    type="button"
                    class={styles.kitChipRemove}
                    aria-label={`Remove ${name} from fixed kit`}
                    onClick={() => removeFromKit(name)}
                  >
                    ×
                  </button>
                </span>
              )}</For>
            </Show>
          </div>
        </div>

        <div class={wiz.banner}>
          <span aria-hidden="true">ⓘ</span>
          <span>Click a choice option to target it, then + on a compendium item adds it there. With nothing targeted, + fills the fixed kit.</span>
        </div>
      </div>

      {/* RIGHT — compendium picker */}
      <CompendiumPanel
        onAdd={handleCompendiumAdd}
        addingToLabel={targetLabel}
        targetingChoice={() => activeTarget() !== null}
      />
    </div>
  );
};
