import { describe, it, expect } from 'vitest';
import { racesStore } from '../racesStore';
import { createRaceLikeForm, makeTraitRow } from '../../shared/raceLikeForm.shared';
import { homebrewManager } from '../../../../../../shared';

describe('racesStore + race form actions', () => {
  it('selectNew seeds a blank draft', () => {
    racesStore.selectNew();
    expect(racesStore.state.selection.activeName).toBe('__new__');
    expect(racesStore.activeRace()).toBeTruthy();
  });

  it('builds and saves a new race through the form', () => {
    racesStore.selectNew();
    const api = createRaceLikeForm({ kind: 'race' });
    api.fill(racesStore.activeRace()!);
    api.form.set('name', 'TestRace');
    api.form.set('sizes', ['Medium']);
    api.form.set('langFixed', ['Common']);
    api.traits.add(makeTraitRow('Darkvision', 'You can see in darkness.'));
    const race = api.buildRace();
    homebrewManager.addRace(race);
    racesStore.noteSaved(race);
    expect(racesStore.state.selection.activeName).toBe('TestRace');
    expect(racesStore.state.entities['TestRace']).toBeTruthy();
    expect(homebrewManager.races().some((r: any) => r.name === 'TestRace')).toBe(true);
  });

  it('can clone existing SRD race into homebrew', () => {
    // pick first loaded race if available
    const first = racesStore.state.order[0];
    if (!first) return; // nothing loaded
    racesStore.selectRace(first);
    const cloned = racesStore.cloneSelectedToHomebrew();
    expect(cloned).toBe(true);
    // verify homebrew now contains race name
    expect(homebrewManager.races().some((r: any) => r.name === first)).toBe(true);
  });

  it('persists modifications made to an existing race via the form upsert', () => {
    const first = racesStore.state.order[0];
    if (!first) return;
    racesStore.selectRace(first);
    const api = createRaceLikeForm({ kind: 'race' });
    api.fill(racesStore.activeRace()!);
    // modify speed & add trait
    api.form.set('speed', 55);
    api.traits.add(makeTraitRow('Custom Vision', 'See in magical darkness'));
    const existing = homebrewManager.races().find((r: any) => r.name === first) as any;
    const race = api.buildRace(existing?.id);
    if (existing) homebrewManager.updateRace(race);
    else homebrewManager.addRace(race);
    racesStore.noteSaved(race);
    const hb = racesStore.state.entities[racesStore.state.selection.activeName!];
    expect(hb?.speed).toBe(55);
    expect(hb?.traits.some(t => t.details.name === 'Custom Vision')).toBe(true);
  });
});
