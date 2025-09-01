import { describe, it, expect } from 'vitest';
import { racesStore } from '../racesStore';
import { homebrewManager } from '../../../../../../shared';

describe('racesStore actions', () => {
  it('adds ability bonus', () => {
    racesStore.selectNew();
    racesStore.addAbilityBonus('STR', 2);
    expect(racesStore.activeRace()?.abilityBonuses.find(b=>b.name==='STR')?.value).toBe(2);
  });
  it('adds language and trait then saves', () => {
    racesStore.selectNew();
    racesStore.updateBlankDraft('name','TestRace');
    racesStore.addSize('Medium');
    racesStore.addLanguage('Common');
    racesStore.addTrait('Darkvision', ['You can see in darkness.']);
    const saved = racesStore.saveNew();
    expect(saved).toBe(true);
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
  it('persists modifications made after starting from existing before cloning', () => {
    const first = racesStore.state.order[0];
    if (!first) return;
    racesStore.selectRace(first);
    const started = racesStore.startFromExisting();
    expect(started).toBe(true);
    // modify speed & add trait
    racesStore.updateBlankDraft('speed', 55 as any);
    racesStore.addTrait('Custom Vision', ['See in magical darkness']);
    const cloned = racesStore.cloneSelectedToHomebrew();
    expect(cloned).toBe(true);
    // Homebrew should now include updated speed
    const hb = homebrewManager.races().find((r: any) => r.name === racesStore.state.selection.activeName);
    // selection activeName switches to saved name after saveNew called inside cloneSelectedToHomebrew
    expect(hb?.speed).toBe(55);
  });
});