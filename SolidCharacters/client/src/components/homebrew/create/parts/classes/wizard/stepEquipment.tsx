import { Component, For, Show } from 'solid-js';
import { StepProps, EquipmentChoice } from './wizard.shared';
import { EquipmentChoiceRow } from './equipmentChoiceRow';
import { CompendiumPanel } from './compendiumPanel';
import wiz from './classesWizard.module.scss';
import styles from './stepEquipment.module.scss';

// Step 3 of the class wizard: level-1 starting equipment.
// LEFT — an A-or-B choice builder plus a fixed kit of always-granted items.
// RIGHT — the compendium picker that feeds the fixed kit.
// All array writes replace the array (never mutate) so the FormGroup stays reactive.
export const StepEquipment: Component<StepProps> = (props) => {
  const choices = (): EquipmentChoice[] => props.formGroup.get('equipmentChoices') ?? [];
  const kit = (): string[] => props.formGroup.get('itemStart') ?? [];

  const updateChoice = (index: number, next: EquipmentChoice) => {
    const arr = [...choices()];
    arr[index] = next;
    props.formGroup.set('equipmentChoices', arr);
  };

  const deleteChoice = (index: number) => {
    props.formGroup.set('equipmentChoices', choices().filter((_, i) => i !== index));
  };

  const addChoice = () => {
    props.formGroup.set('equipmentChoices', [...choices(), { a: '', b: '' }]);
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
                onChange={updateChoice}
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
          <span>Click + on a compendium item to add it to the fixed kit.</span>
        </div>
      </div>

      {/* RIGHT — compendium picker */}
      <CompendiumPanel onAdd={addToKit} />
    </div>
  );
};
