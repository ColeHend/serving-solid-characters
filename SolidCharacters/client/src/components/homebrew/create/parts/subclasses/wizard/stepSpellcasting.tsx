import { Component, For, Show, createMemo, createSignal, runWithOwner } from 'solid-js';
import { Checkbox, Chip, Input, Option, Select } from 'coles-solid-library';
import { getAddNumberAccent, getNumberArray } from '../../../../../../shared';
import { Spell } from '../../../../../../models/data';
import { SpellsKnown } from '../SpellsKnown';
import {
  CASTING_ABILITIES,
  SPELLS_KNOWN_OPTIONS,
  SUBCLASS_CASTER_BANNERS,
  SUBCLASS_CASTER_CARDS,
  StepProps,
  collectForm,
} from './wizard.shared';
import { mergedCastingLevels } from './subclassSpellcasting.shared';
import { OptionCard } from '../../classes/wizard/optionCard';
import { ToggleChip } from '../../classes/wizard/toggleChip';
import sharedStyles from '../../classes/wizard/classesWizard.module.scss';
import featureStyles from '../../classes/wizard/stepFeatures.module.scss';
import styles from './stepSpellcasting.module.scss';

/**
 * Spellcasting step — caster type cards (None / Third / Half), casting ability chips,
 * spells-known mode (with custom per-level counts), granted spells, info blocks and a
 * live slot-progression preview. All persistence goes through the existing
 * subclassAdapter via wizard.shared's assembly helpers.
 */
export const StepSpellcasting: Component<StepProps> = (props) => {
  const [toAddKnownLevel, setToAddKnownLevel] = createSignal(1);
  const [toAddKnownAmount, setToAddKnownAmount] = createSignal(0);

  const isCaster = () => !!props.formGroup.get('hasCasting');
  const casterType = () => (props.formGroup.get('casterType') as string) || '';

  const selectCaster = (key: '' | 'third' | 'half') => {
    props.formGroup.set('casterType', key);
    props.formGroup.set('hasCasting', key !== '');
  };

  const slotRows = createMemo(() => mergedCastingLevels(collectForm(props.formGroup)));

  const knownPerLevel = () => props.formGroup.get('spellsKnownPerLevel') ?? [];
  const setKnownPerLevel = (next: { level: number; amount: number }[]) =>
    props.formGroup.set('spellsKnownPerLevel', next);

  const addCustomKnown = () => {
    if (knownPerLevel().some(x => x.level === toAddKnownLevel())) return;
    setKnownPerLevel(
      [...knownPerLevel(), { level: toAddKnownLevel(), amount: toAddKnownAmount() }]
        .sort((a, b) => a.level - b.level),
    );
  };

  const subclassSpells = () => props.formGroup.get('subclassSpells') ?? [];
  const addSpell = () => {
    const pick = props.formGroup.get('selectedSpellName');
    const spell = props.allSpells().find(s => s.name === pick);
    if (!spell || subclassSpells().some(s => s.name === spell.name)) return;
    props.formGroup.set('subclassSpells', [...subclassSpells(), spell as Spell]);
  };
  const removeSpell = (name: string) =>
    props.formGroup.set('subclassSpells', subclassSpells().filter(s => s.name !== name));

  const info = () => props.formGroup.get('spellcastingInfo') ?? [];
  const setInfoAt = (index: number, patch: Partial<{ name: string; desc: string[] }>) =>
    props.formGroup.set('spellcastingInfo', info().map((entry, i) => i === index ? { ...entry, ...patch } : entry));

  return (
    <div class={styles.step}>
      {/* Caster type */}
      <div class={sharedStyles.card}>
        <div class={sharedStyles.optionRow}>
          <For each={SUBCLASS_CASTER_CARDS}>
            {(card) => (
              <OptionCard
                title={card.title}
                subtitle={card.sub}
                alignStart
                badge
                selected={isCaster() ? casterType() === card.key : card.key === ''}
                onSelect={() => selectCaster(card.key)}
              />
            )}
          </For>
        </div>

        <Show when={isCaster()}>
          <div class={sharedStyles.cardLabel}>Spellcasting ability</div>
          <div class={sharedStyles.chipRow}>
            <For each={CASTING_ABILITIES}>
              {(ability) => (
                <ToggleChip
                  label={ability}
                  selected={props.formGroup.get('castingModifier') === ability}
                  onToggle={() => props.formGroup.set('castingModifier', ability)}
                />
              )}
            </For>
          </div>

          <div class={sharedStyles.cardLabel}>Spells known</div>
          <div class={sharedStyles.chipRow} style={{ 'align-items': 'center' }}>
            <Select
              transparent
              value={String(props.formGroup.get('spellsKnownCalc') ?? SpellsKnown.None)}
              onChange={(v) => runWithOwner(null, () => props.formGroup.set('spellsKnownCalc', +v))}
            >
              <For each={SPELLS_KNOWN_OPTIONS}>
                {(opt) => <Option value={opt.value.toString()}>{opt.label}</Option>}
              </For>
            </Select>
            <Checkbox
              label="Half caster round up"
              checked={!!props.formGroup.get('halfCasterRoundUp')}
              onChange={(v: boolean) => props.formGroup.set('halfCasterRoundUp', v)}
            />
            <Checkbox
              label="Has cantrips"
              checked={!!props.formGroup.get('hasCantrips')}
              onChange={(v: boolean) => props.formGroup.set('hasCantrips', v)}
            />
            <Checkbox
              label="Ritual casting"
              checked={!!props.formGroup.get('hasRitualCasting')}
              onChange={(v: boolean) => props.formGroup.set('hasRitualCasting', v)}
            />
          </div>

          <Show when={props.formGroup.get('spellsKnownCalc') === SpellsKnown.Other}>
            <div class={sharedStyles.cardLabel}>Custom spells known per level</div>
            <div class={styles.knownRow}>
              <div class={styles.knownField}>
                <span class={sharedStyles.counterMuted}>Class level</span>
                <Select
                  transparent
                  value={toAddKnownLevel()}
                  onChange={(v) => runWithOwner(null, () => setToAddKnownLevel(+v))}
                >
                  <For each={getNumberArray(20)}>{(lvl) => <Option value={lvl}>{`Level ${lvl}`}</Option>}</For>
                </Select>
              </div>
              <div class={styles.knownField}>
                <span class={sharedStyles.counterMuted}>Spells known</span>
                <Input
                  type="number"
                  min={0}
                  value={toAddKnownAmount()}
                  onChange={(e) => setToAddKnownAmount(+e.currentTarget.value)}
                />
              </div>
              <button type="button" class={featureStyles.ghostBtn} onClick={addCustomKnown}>
                + Add
              </button>
            </div>
            <div class={styles.chips}>
              <For each={knownPerLevel()}>
                {(entry) => (
                  <Chip
                    key={`Level ${entry.level}`}
                    value={`${entry.level}: ${entry.amount}`}
                    remove={() => setKnownPerLevel(knownPerLevel().filter(x => x.level !== entry.level))}
                  />
                )}
              </For>
            </div>
          </Show>
        </Show>

        <div class={sharedStyles.banner}>
          ✦ {SUBCLASS_CASTER_BANNERS[isCaster() ? casterType() : ''] ?? SUBCLASS_CASTER_BANNERS['']}
        </div>
      </div>

      <Show when={isCaster()}>
        {/* Granted spells + info blocks */}
        <div class={sharedStyles.card}>
          <div class={sharedStyles.cardLabel}>Granted spells — always prepared / known for this subclass</div>
          <div class={styles.spellPickerRow}>
            <Select
              transparent
              value={props.formGroup.get('selectedSpellName') ?? ''}
              onChange={(v) => runWithOwner(null, () => props.formGroup.set('selectedSpellName', v))}
            >
              <For each={props.allSpells()}>{(spell) => <Option value={spell.name}>{spell.name}</Option>}</For>
            </Select>
            <button type="button" class={featureStyles.ghostBtn} onClick={addSpell}>
              + Add spell
            </button>
          </div>
          <div class={styles.chips}>
            <For each={subclassSpells()}>
              {(spell) => (
                <Chip
                  key={getAddNumberAccent(+spell.level)}
                  value={spell.name}
                  remove={() => removeSpell(spell.name)}
                />
              )}
            </For>
          </div>

          <div class={sharedStyles.cardLabel}>Spellcasting info — rules text shown with the subclass</div>
          <For each={info()}>
            {(entry, i) => (
              <div class={styles.infoBlock}>
                <Input
                  value={entry.name}
                  placeholder="Title..."
                  onChange={(e) => setInfoAt(i(), { name: e.currentTarget.value })}
                />
                <textarea
                  class={styles.infoTextarea}
                  rows={3}
                  value={entry.desc.join('\n')}
                  placeholder="Description..."
                  onChange={(e) => setInfoAt(i(), { desc: e.currentTarget.value.split('\n') })}
                />
                <div class={styles.infoActions}>
                  <button
                    type="button"
                    class={featureStyles.ghostBtn}
                    onClick={() => props.formGroup.set('spellcastingInfo', info().filter((_, idx) => idx !== i()))}
                  >
                    Remove
                  </button>
                </div>
              </div>
            )}
          </For>
          <div>
            <button
              type="button"
              class={featureStyles.ghostBtn}
              onClick={() => props.formGroup.set('spellcastingInfo', [...info(), { name: '', desc: [] }])}
            >
              + Add info block
            </button>
          </div>
        </div>

        {/* Slot progression preview */}
        <Show when={casterType()}>
          <div class={sharedStyles.card}>
            <div class={sharedStyles.cardLabel}>Slot progression preview</div>
            <div class={styles.tableWrap}>
              <table class={styles.slotTable}>
                <thead>
                  <tr>
                    <th>Lvl</th>
                    <th>Cantrips</th>
                    <th>1st</th><th>2nd</th><th>3rd</th><th>4th</th><th>5th</th>
                    <th>6th</th><th>7th</th><th>8th</th><th>9th</th>
                  </tr>
                </thead>
                <tbody>
                  <For each={slotRows()}>
                    {(row) => (
                      <tr>
                        <td>{row.level}</td>
                        <td>{row.spellcasting.cantrips_known ?? '-'}</td>
                        <td>{row.spellcasting.spell_slots_level_1 ?? '-'}</td>
                        <td>{row.spellcasting.spell_slots_level_2 ?? '-'}</td>
                        <td>{row.spellcasting.spell_slots_level_3 ?? '-'}</td>
                        <td>{row.spellcasting.spell_slots_level_4 ?? '-'}</td>
                        <td>{row.spellcasting.spell_slots_level_5 ?? '-'}</td>
                        <td>{row.spellcasting.spell_slots_level_6 ?? '-'}</td>
                        <td>{row.spellcasting.spell_slots_level_7 ?? '-'}</td>
                        <td>{row.spellcasting.spell_slots_level_8 ?? '-'}</td>
                        <td>{row.spellcasting.spell_slots_level_9 ?? '-'}</td>
                      </tr>
                    )}
                  </For>
                </tbody>
              </table>
            </div>
          </div>
        </Show>
      </Show>
    </div>
  );
};
