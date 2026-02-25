import { Component, For, createSignal, Show } from 'solid-js';
import { Button, Chip, FormField, Input, TextArea } from 'coles-solid-library';
import { racesStore } from '../racesStore';

const TraitsSection: Component = () => {
  const store = racesStore;
  const traits = () => store.activeRace()?.traits || [];
  const isNew = () => store.state.selection.activeName === '__new__';
  const [tName,setTName] = createSignal('');
  const [tDesc,setTDesc] = createSignal('');
  const [editing,setEditing] = createSignal<string | null>(null); // original name when editing
  const add = () => { if (!tName().trim()) return; store.addTrait(tName().trim(), tDesc().trim()? tDesc().split(/\n+/): []); setTName(''); setTDesc(''); };
  const update = () => { if (!editing()) return; if (!tName().trim()) return; store.updateTrait(editing()!, tName().trim(), tDesc().trim()? tDesc().split(/\n+/): []); setEditing(null); setTName(''); setTDesc(''); };
  const beginEdit = (name: string) => {
    const tr = traits().find(t => t.name === name);
    if (!tr) return;
    setTName(tr.name);
    setTDesc(tr.value.join('\n'));
    setEditing(tr.name);
  };
  const cancelEdit = () => { setEditing(null); setTName(''); setTDesc(''); };
  const remove = (n:string) => store.removeTrait(n);
  return (
    <div>
      <h3 class="visuallyHidden">Traits</h3>
      <div class="traitEditor">
        <FormField name={editing() ? 'Edit Trait Name' : 'Trait Name'}>
          <Input transparent value={tName()} onInput={e=>setTName(e.currentTarget.value)} placeholder="Trait name" />
        </FormField>
        <FormField name="Description">
          <TextArea transparent text={tDesc} setText={setTDesc} placeholder="Description (multi-line)" rows={3} />
        </FormField>
        <div class="buttonRow">
          <Show when={!editing()} fallback={<Button onClick={update} disabled={!isNew() || !tName().trim()}>Update Trait</Button>}>
            <Button onClick={add} disabled={!isNew() || !tName().trim()}>Add Trait</Button>
          </Show>
          <Show when={editing()}>
            <Button onClick={cancelEdit}>Cancel</Button>
          </Show>
        </div>
      </div>
      <div class="chipsRowSingle" style={{ 'margin-top': '.35rem' }} aria-label="Traits">
        <Show when={traits().length} fallback={<Chip value="None" />}> <For each={traits()}>{t => (
          <Chip data-editing={editing()===t.name} onClick={() => beginEdit(t.name)} value={t.name} remove={() => isNew() && remove(t.name)} />
        )}</For></Show>
      </div>
    </div>
  );
};
export default TraitsSection;
