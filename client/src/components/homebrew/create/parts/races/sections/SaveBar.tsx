import { Component, Show } from 'solid-js';
import { Button } from 'coles-solid-library';
import { racesStore } from '../racesStore';
import { homebrewManager } from '../../../../../../shared';
import { validateRace } from '../validation';

const SaveBar: Component<{ onNotify: (msg: string, type?: 'success'|'error') => void }> = (p) => {
  const store = racesStore;
  const isNew = () => store.state.selection.activeName === '__new__';
  const activeName = () => store.state.selection.activeName || '';
  const isHomebrew = () => !!activeName() && homebrewManager.races().some((r: any) => (r.name || '').toLowerCase() === activeName().toLowerCase());
  const isSRDSelected = () => !!activeName() && !isNew() && !isHomebrew();
  const errors = () => validateRace({ isNew: isNew(), draft: store.activeRace() });
  const isValid = () => errors().length === 0;
  return (
    <div style={{ display:'flex', gap:'.75rem', 'align-items':'center', 'margin-top':'1.25rem', 'flex-wrap':'wrap' }}>
      <Show when={isSRDSelected()}>
        <Button onClick={() => { if (store.cloneSelectedToHomebrew()) p.onNotify('Race cloned from SRD'); else p.onNotify('Failed to clone race','error'); }}>Clone From SRD</Button>
      </Show>
      <Show when={isNew()}>
        <Button disabled={!isValid()} onClick={() => { if (!isValid()) { p.onNotify('Fix validation errors','error'); return; } if (store.saveNew()) p.onNotify('Race saved'); }}>Save</Button>
      </Show>
      <Show when={!isNew() && isHomebrew()}>
        <Button disabled={!isValid()} onClick={() => { if (!isValid()) { p.onNotify('Fix validation errors','error'); return; } if (store.updateExisting()) p.onNotify('Race updated'); }}>Update</Button>
      </Show>
      <Show when={errors().length}><span style={{ color:'#d33', 'font-size':'.85rem' }}>{errors().length} error(s)</span></Show>
    </div>
  );
};
export default SaveBar;
