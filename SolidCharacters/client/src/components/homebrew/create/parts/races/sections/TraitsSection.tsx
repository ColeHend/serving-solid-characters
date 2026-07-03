import { Component, For, createSignal, Show } from 'solid-js';
import { Button, Chip, FormField, Input, TextArea } from 'coles-solid-library';
import { RaceLikeFormApi, makeTraitRow } from '../../shared/raceLikeForm.shared';

interface Props { api: RaceLikeFormApi }

const TraitsSection: Component<Props> = (p) => {
  const { traits } = p.api;
  const [tName,setTName] = createSignal('');
  const [tDesc,setTDesc] = createSignal('');
  const [editing,setEditing] = createSignal<number | null>(null); // row index when editing
  const add = () => {
    if (!tName().trim()) return;
    traits.add(makeTraitRow(tName().trim(), tDesc()));
    setTName(''); setTDesc('');
  };
  const update = () => {
    const idx = editing();
    if (idx === null || !tName().trim()) return;
    const row = traits.getGroup(idx);
    if (!row) return;
    row.set('name', tName().trim());
    row.set('body', tDesc());
    setEditing(null); setTName(''); setTDesc('');
  };
  const beginEdit = (index: number) => {
    const row = traits.getAt(index);
    if (!row) return;
    setTName(row.name);
    setTDesc(row.body);
    setEditing(index);
  };
  const cancelEdit = () => { setEditing(null); setTName(''); setTDesc(''); };
  const remove = (index: number) => {
    traits.remove(index);
    const e = editing();
    if (e === null) return;
    if (e === index) cancelEdit();
    else if (index < e) setEditing(e - 1); // keep the edit pointed at the same row
  };
  return (
    <div>
      <h3 class="visuallyHidden">Traits</h3>
      <div class="traitEditor">
        <FormField name={editing() !== null ? 'Edit Trait Name' : 'Trait Name'}>
          <Input transparent value={tName()} onInput={e=>setTName(e.currentTarget.value)} placeholder="Trait name" />
        </FormField>
        <FormField name="Description">
          <TextArea transparent text={tDesc} setText={setTDesc} placeholder="Description (multi-line)" rows={3} />
        </FormField>
        <div class="buttonRow">
          <Show when={editing() === null} fallback={<Button onClick={update} disabled={!tName().trim()}>Update Trait</Button>}>
            <Button onClick={add} disabled={!tName().trim()}>Add Trait</Button>
          </Show>
          <Show when={editing() !== null}>
            <Button onClick={cancelEdit}>Cancel</Button>
          </Show>
        </div>
      </div>
      <div class="chipsRowSingle" style={{ 'margin-top': '.35rem' }} aria-label="Traits">
        <Show when={traits.get().length} fallback={<Chip value="None" />}> <For each={traits.get()}>{(t, i) => (
          <Chip data-editing={editing()===i()} onClick={() => beginEdit(i())} value={t.name} remove={() => remove(i())} />
        )}</For></Show>
      </div>
    </div>
  );
};
export default TraitsSection;
