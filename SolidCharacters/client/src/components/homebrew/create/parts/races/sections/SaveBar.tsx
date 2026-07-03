import { Component, Show } from 'solid-js';
import { Button } from 'coles-solid-library';
import { racesStore } from '../racesStore';
import { homebrewManager } from '../../../../../../shared';
import { RaceLikeFormApi } from '../../shared/raceLikeForm.shared';

interface Props {
  api: RaceLikeFormApi;
  errors: string[];
  onNotify: (msg: string, type?: 'success'|'error') => void;
}

const SaveBar: Component<Props> = (p) => {
  const store = racesStore;
  const isNew = () => store.state.selection.activeName === '__new__';
  const activeName = () => store.state.selection.activeName || '';
  const isHomebrew = () => !!activeName() && homebrewManager.races().some((r: any) => (r.name || '').toLowerCase() === activeName().toLowerCase());
  const isSRDSelected = () => !!activeName() && !isNew() && !isHomebrew();
  const isValid = () => p.errors.length === 0;
  // The form is the source of truth for both create and edit, so Save is a
  // single upsert keyed by name: update the homebrew entry if one exists,
  // otherwise add a new one.
  const existingHomebrew = () => {
    const name = (p.api.form.getR('name') as string).trim();
    return homebrewManager.races().find((r: any) => r.name === name) as any;
  };
  const save = () => {
    if (!isValid()) { p.onNotify('Fix validation errors','error'); return; }
    const formOk = p.api.form.validate() && p.api.abilityBonuses.validate() && p.api.traits.validate();
    if (!formOk) { p.onNotify('Fix validation errors','error'); return; }
    const existing = existingHomebrew();
    if (existing) {
      // Spread over the stored entity so fields the editor doesn't manage
      // (embedded subRaces, abilityBonusChoice, traitChoice) survive.
      const updated = { ...existing, ...p.api.buildRace(existing.id) };
      homebrewManager.updateRace(updated);
      store.noteSaved(updated);
      p.onNotify('Race updated');
    } else {
      const race = p.api.buildRace();
      homebrewManager.addRace(race);
      store.noteSaved(race);
      p.onNotify('Race saved');
    }
  };
  return (
    <div style={{ display:'flex', gap:'.75rem', 'align-items':'center', 'margin-top':'1.25rem', 'flex-wrap':'wrap' }}>
      <Show when={isSRDSelected()}>
        <Button onClick={() => { if (store.cloneSelectedToHomebrew()) p.onNotify('Race cloned from SRD'); else p.onNotify('Failed to clone race','error'); }}>Clone From SRD</Button>
      </Show>
      <Button disabled={!isValid()} onClick={save}>{existingHomebrew() ? 'Update' : 'Save'}</Button>
      <Show when={p.errors.length}><span style={{ color:'#d33', 'font-size':'.85rem' }}>{p.errors.length} error(s)</span></Show>
    </div>
  );
};
export default SaveBar;
