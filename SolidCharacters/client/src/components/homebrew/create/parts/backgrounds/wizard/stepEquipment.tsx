import { Component, For, createSignal } from 'solid-js';
import { Currency, StepProps, emptyCurrency } from './wizard.shared';
import { EquipmentGroupRow } from './equipmentGroupRow';
import { CompendiumPanel } from '../../classes/wizard/compendiumPanel';
import wiz from '../../classes/wizard/classesWizard.module.scss';
import eq from '../../classes/wizard/stepEquipment.module.scss';

/**
 * Equipment step — starting-equipment option groups ("take A or B") on the left,
 * the shared compendium picker on the right. Simpler than the class wizard's
 * equipment model: backgrounds persist flat optionKeys+items groups, with coin
 * encoded as "5gp"-style item strings at publish time.
 */
export const StepEquipment: Component<StepProps> = (props) => {
  const [activeGroup, setActiveGroup] = createSignal(0);

  const groups = () => props.extras.equipment;

  // Next unused single-letter key: A, B, C... (fall back to the group count past Z).
  const nextKey = () => {
    const used = new Set(groups().map(g => g.key));
    for (let i = 0; i < 26; i++) {
      const key = String.fromCharCode(65 + i);
      if (!used.has(key)) return key;
    }
    return `${groups().length + 1}`;
  };

  const addGroup = () => {
    const index = groups().length;
    props.setExtras('equipment', arr => [...arr, { key: nextKey(), items: [], currency: emptyCurrency() }]);
    setActiveGroup(index);
  };

  const deleteGroup = (index: number) => {
    props.setExtras('equipment', arr => arr.filter((_, i) => i !== index));
    setActiveGroup(current => Math.max(0, current >= index ? current - 1 : current));
  };

  const addItem = (name: string) => {
    if (!groups().length) {
      addGroup();
      props.setExtras('equipment', 0, 'items', [name]);
      return;
    }
    const index = Math.min(activeGroup(), groups().length - 1);
    props.setExtras('equipment', index, 'items', arr => [...arr, name]);
  };

  const removeItem = (groupIndex: number, itemIndex: number) =>
    props.setExtras('equipment', groupIndex, 'items', arr => arr.filter((_, i) => i !== itemIndex));

  const setCurrency = (groupIndex: number, currency: Currency, value: number) =>
    props.setExtras('equipment', groupIndex, 'currency', currency, value);

  const activeLabel = () => {
    const group = groups()[Math.min(activeGroup(), groups().length - 1)];
    return group ? `Option ${group.key || activeGroup() + 1}` : 'a new option group';
  };

  return (
    <div class={eq.layout}>
      <div class={eq.section}>
        <div class={wiz.card}>
          <span class={wiz.cardLabel}>Starting equipment — players take one option group</span>
          <div class={eq.choiceList}>
            <For each={groups()}>{(group, i) => (
              <EquipmentGroupRow
                group={group}
                index={i()}
                active={i() === Math.min(activeGroup(), groups().length - 1)}
                onActivate={() => setActiveGroup(i())}
                onKeyChange={(key) => props.setExtras('equipment', i(), 'key', key)}
                onAddItem={(item) => props.setExtras('equipment', i(), 'items', arr => [...arr, item])}
                onRemoveItem={(itemIndex) => removeItem(i(), itemIndex)}
                onCurrencyChange={(currency, value) => setCurrency(i(), currency, value)}
                onDelete={() => deleteGroup(i())}
              />
            )}</For>
          </div>
          <button type="button" class={eq.addChoiceBtn} onClick={addGroup}>
            + Add option group
          </button>
        </div>
      </div>

      <CompendiumPanel
        onAdd={addItem}
        addingToLabel={activeLabel}
        targetingChoice={() => groups().length > 0}
      />
    </div>
  );
};
