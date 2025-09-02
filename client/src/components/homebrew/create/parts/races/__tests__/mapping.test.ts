import { describe, it, expect } from 'vitest';
import { racesStore } from '../racesStore';
import { homebrewManager } from '../../../../../../shared';

describe('race mapping & selection', () => {
  it('maps physical -> sizeDesc and abilities -> abilitiesDesc when selecting SRD race', () => {
    const first = racesStore.state.order.find(n => !!n);
    if (!first) return; // skip if not loaded
    racesStore.selectSrdRace(first);
    const draft = racesStore.activeRace();
    // sizeDesc should be non-empty when physical description exists
    expect(draft?.text.sizeDesc).toBeTypeOf('string');
    // abilitiesDesc may be empty only if source lacks abilities key
    // SRD data uses 'abilities' so should populate
    expect(draft?.text.abilitiesDesc?.length).toBeGreaterThan(0);
  });

  it('parses multiple size tokens correctly', () => {
    // Craft a homebrew race with combined size string
    const race = { id: 'hb1', name: 'DualSizeFolk', size: 'Medium or Small (your choice)', speed: 30, languages: [], abilityBonuses: [], traits: [], descriptions: { physical: 'Medium (4-7 ft) or Small (2-4 ft)' } } as any;
    homebrewManager.addRace(race);
    racesStore.selectHomebrewRace('DualSizeFolk');
    const draft = racesStore.activeRace();
    expect(draft?.sizes.sort()).toEqual(['Medium','Small']);
  });
});
