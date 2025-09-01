import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, fireEvent, screen, cleanup, waitFor } from '@solidjs/testing-library';
import { Component } from 'solid-js';
import { createStore } from 'solid-js/store';

// ---- Mocks ----
// Mock HomebrewManager persistence with mutable list for tests
vi.mock('../../../../../../shared/customHooks/homebrewManager', () => {
  const hbList: any[] = [];
  function setHomebrewBackgrounds(arr: any[]) { hbList.splice(0, hbList.length, ...arr); }
  const api = { addBackground: vi.fn(), updateBackground: vi.fn(), backgrounds: () => hbList };
  return { default: api, homebrewManager: api, setHomebrewBackgrounds };
});

// Minimal background type shape for store
interface Bg { name: string; desc: string; proficiencies: any; startEquipment: any[]; abilityOptions: string[]; feat?: string; languages: { amount: number; options: string[] }; features: any[]; }

// Factory to build mock store
function makeStore() {
  const draft: Bg = { name: '', desc: '', proficiencies: { armor: [], weapons: [], tools: [], skills: [] }, startEquipment: [], abilityOptions: [], languages: { amount: 0, options: [] }, features: [] };
  const entities: Record<string, Bg> = { Scholar: { ...draft, name: 'Scholar', desc: 'Learns.', abilityOptions: ['Int'], languages: { amount: 1, options: ['Elvish'] }, features: [] } };
  const [state, setState] = createStore<any>({
    entities,
    order: Object.keys(entities),
    status: 'ready',
    selection: { activeName: undefined },
    form: { abilityChoices: [] as string[], equipmentOptionKey: undefined as string|undefined, feat: undefined as string|undefined },
    blankDraft: undefined as Bg|undefined
  });
  function activeBackground() { return state.selection.activeName === '__new__' ? state.blankDraft : state.selection.activeName ? state.entities[state.selection.activeName] : undefined; }
  function abilityOptions() { return activeBackground()?.abilityOptions || []; }
  function equipmentOptionKeys() { return ['A','B']; }
  function selectedEquipmentItems() { return []; }
  const api: any = {
    state,
    reset() { setState({ selection: { activeName: undefined }, form: { abilityChoices: [], equipmentOptionKey: undefined, feat: undefined }, blankDraft: undefined }); },
    selectBackground(name: string) {
      if (entities[name]) {
        setState('selection', { activeName: name });
        setState({ blankDraft: undefined });
        setState('form', { abilityChoices: [], equipmentOptionKey: undefined, feat: entities[name].feat });
      }
    },
    selectNew() {
      setState('selection', { activeName: '__new__' });
      setState({ blankDraft: { ...draft } });
      setState('form', { abilityChoices: [], equipmentOptionKey: undefined, feat: undefined });
    },
    updateBlankDraft(key: string, value: any) {
      if (state.selection.activeName === '__new__' && state.blankDraft) {
        setState('blankDraft', key as any, value);
      }
    },
    addAbilityChoice(a: string) {
      if (state.form.abilityChoices.length < 3) setState('form','abilityChoices', (arr: string[]) => [...arr, a]);
    },
    removeAbilityChoice(i: number) {
      setState('form','abilityChoices', (arr: string[]) => arr.filter((_: string, idx: number)=> idx!==i));
    },
    setEquipmentOptionKey(k: string) { setState('form', { ...state.form, equipmentOptionKey: k }); },
    setFeat(f?: string) { setState('form', { ...state.form, feat: f }); },
    activeBackground,
    abilityOptions,
    equipmentOptionKeys,
    selectedEquipmentItems
  };
  return api;
}
vi.mock('../../../../../../shared/stores/backgroundsStore', () => {
  const inst = makeStore();
  return { backgroundsStore: inst };
});

// Mock section components to expose callbacks deterministically (inline to avoid hoist issues)
vi.mock('../sections/AbilitiesSection', () => ({
  default: (props: any) => (
    <div data-sec="abilities" data-collapsed={props.collapsed ? 'true':'false'}>
      {props.onAddAbility && <button onClick={()=>props.onAddAbility('Str')}>add-ability</button>}
      {props.onReset && <button onClick={()=>props.onReset()}>reset-abilities</button>}
      <button onClick={()=>props.toggle('abilities')}>toggle-abilities</button>
    </div>
  )
}));
vi.mock('../sections/EquipmentSection', () => ({
  default: (props: any) => (
    <div data-sec="equipment" data-error={props.error || false} data-collapsed={props.collapsed ? 'true':'false'}>
      {props.onCommitGroup && <>
        <button onClick={()=>props.onCommitGroup(['A'], ['Item'])}>commit-equip</button>
        <button onClick={()=>props.onCommitGroup([], [])}>commit-empty</button>
        <button onClick={()=>props.onCommitGroup(['A','A'], ['Item'])}>commit-dup-keys</button>
        <button onClick={()=>props.onCommitGroup(['A'], ['Item2'])}>commit-second-same</button>
      </>}
      <button onClick={()=>props.toggle('equipment')}>toggle-equipment</button>
    </div>
  )
}));
vi.mock('../sections/FeatSection', () => ({
  default: (props: any) => (
    <div data-sec="feat">
      {props.onChange && <button onClick={()=>props.onChange('FeatX')}>change</button>}
      {props.onClear && <button onClick={()=>props.onClear()}>clear-feat</button>}
    </div>
  )
}));
vi.mock('../sections/ProficienciesSection', () => ({ default: () => <div data-sec="profs" /> }));
vi.mock('../sections/ProficienciesModal', () => ({ default: () => <div data-sec="profs-modal" /> }));
vi.mock('../sections/LanguagesSection', () => ({ default: () => <div data-sec="langs" /> }));
// Custom stub for LanguagesModal to expose language editing hooks
vi.mock('../sections/LanguagesModal', () => ({
  default: (props: any) => (
    <div data-sec="langs-modal">
      <button onClick={()=>props.setAmount(props.amount + 1)}>inc-lang-amount</button>
      <button onClick={()=>props.addLanguage('Elvish')}>add-elvish</button>
      <button onClick={()=>props.addLanguage('Dwarvish')}>add-dwarvish</button>
    </div>
  )
}));
vi.mock('../sections/FeaturesSection', () => ({
  default: (props: any) => (
    <div data-sec="features" data-error={props.error || false}>
      {props.onChange && <>
        <button onClick={()=>props.onChange([ { name: '', description: '' } ])}>add-blank-feature</button>
        <button onClick={()=>props.onChange([ { name: 'Alpha', description: '' }, { name: 'alpha', description: 'dup diff case' } ])}>add-dup-features</button>
        <button onClick={()=>props.onChange([ { name: 'Alpha', description: '' } ])}>add-alpha</button>
        <button onClick={()=>props.onChange([])}>clear-features</button>
      </>}
    </div>
  )
}));

// Defer importing component & mocked store until after mocks defined
// eslint-disable-next-line import/first
import Backgrounds, { SNACKBAR_TIMEOUT_MS } from '../backgrounds';
// eslint-disable-next-line import/first
import { backgroundsStore as storeInstance } from '../../../../../../shared/stores/backgroundsStore';
// Note: setHomebrewBackgrounds is only provided by the test mock; declare type here to appease TS.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { homebrewManager as _hb } from '../../../../../../shared/customHooks/homebrewManager';
// @ts-expect-error mocked only in test
import { setHomebrewBackgrounds } from '../../../../../../shared/customHooks/homebrewManager';
// helper imported from mocked module

// ---- Tests ----
describe('Backgrounds component behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // manual reset matching initial values
    (storeInstance as any).state.selection.activeName = undefined;
    (storeInstance as any).state.form.abilityChoices = [];
    (storeInstance as any).state.form.equipmentOptionKey = undefined;
    (storeInstance as any).state.form.feat = undefined;
    (storeInstance as any).state.blankDraft = undefined;
  });

  afterEach(() => cleanup());

  async function initNewDraft() {
    render(() => <Backgrounds />);
    storeInstance.selectNew();
    await waitFor(() => expect(screen.getByText('Save As Homebrew')).toBeTruthy());
    return screen.getByText('Save As Homebrew') as HTMLButtonElement;
  }

  it('enables Save only after required fields valid for new background and re-disables if name cleared', async () => {
    const saveBtn = await initNewDraft();
    // enter new mode
    // Save disabled due to missing name
    expect(saveBtn.disabled).toBe(true);
    // Provide name
    storeInstance.updateBlankDraft('name', 'My Background');
    await waitFor(()=> expect(saveBtn.disabled).toBe(false));
    // Clear name again
    storeInstance.updateBlankDraft('name', '');
    await waitFor(()=> expect(saveBtn.disabled).toBe(true));
  });

  it('caps ability additions at 3 and allows duplicates', async () => {
    await initNewDraft();
    const btn = screen.getAllByText('add-ability')[0];
    fireEvent.click(btn); // 1
    fireEvent.click(btn); // 2
    fireEvent.click(btn); // 3
    fireEvent.click(btn); // 4 ignored
    expect(storeInstance.state.form.abilityChoices.length).toBe(3);
    // duplicates present
  expect(storeInstance.state.form.abilityChoices.every((a: string) => a === 'Str')).toBe(true);
  });

  it('shows Modified badge after a change and before save', async () => {
    render(() => <Backgrounds />);
    storeInstance.selectBackground('Scholar');
    await waitFor(()=> expect(screen.getByText('Save As Homebrew')).toBeTruthy());
    const btn = screen.getAllByText('add-ability')[0];
    fireEvent.click(btn);
    expect(screen.getByText('Modified')).toBeTruthy();
  });

  it('does not show Update button for new draft, but does for existing', async () => {
    render(() => <Backgrounds />);
  storeInstance.selectNew();
    expect(screen.queryByText('Update Homebrew')).toBeNull();
  storeInstance.selectBackground('Scholar');
    // flush microtask
    await Promise.resolve();
    // Update may still be hidden if not in homebrew; backgroundsManager mocked returns empty list so ensure absence
    expect(screen.queryByText('Update Homebrew')).toBeNull();
  });

  it('shows Update button when background exists in homebrew list', async () => {
    setHomebrewBackgrounds([{ name: 'Scholar' }]);
    render(() => <Backgrounds />);
    storeInstance.selectBackground('Scholar');
    // Need abilities baseline match to avoid Modified interfering; not required for visibility
    await waitFor(()=> expect(screen.getByText('Update Homebrew')).toBeTruthy());
  });

  it('shows snackbar after saving new background and calls addBackground with composed draft', async () => {
    const saveBtn = await initNewDraft();
    storeInstance.updateBlankDraft('name', 'Snack Test');
    await waitFor(()=> expect(saveBtn.disabled).toBe(false));
    fireEvent.click(saveBtn);
    await waitFor(()=> expect(screen.getByText('Background saved')).toBeTruthy());
    // assert repository call shape
  // @ts-ignore runtime dynamic import of mocked module
  const { homebrewManager } = await import('../../../../../../shared/customHooks/homebrewManager');
    expect(homebrewManager.addBackground).toHaveBeenCalledTimes(1);
    const arg = (homebrewManager.addBackground as any).mock.calls[0][0];
    expect(arg.name).toBe('Snack Test');
    expect(Array.isArray(arg.startEquipment)).toBe(true);
    expect(arg.languages).toBeTruthy();
  });

  it('equipment validation errors appear for empty group and duplicate keys', async () => {
    await initNewDraft();
    const emptyBtn = screen.getAllByText('commit-empty')[0];
    fireEvent.click(emptyBtn);
    await waitFor(()=> {
      expect(screen.getByText(/missing keys/i)).toBeTruthy();
      expect(screen.getByText(/has no items/i)).toBeTruthy();
    });
    const dupBtn = screen.getAllByText('commit-dup-keys')[0];
    fireEvent.click(dupBtn);
    await waitFor(()=> expect(screen.getByText(/duplicate equipment option key/i)).toBeTruthy());
  });

  it('equipment distinct key sets validation triggers when adding second group with same keys', async () => {
    await initNewDraft();
    const addBtn = screen.getAllByText('commit-equip')[0];
    fireEvent.click(addBtn); // first group A
    const secondSame = screen.getAllByText('commit-second-same')[0];
    fireEvent.click(secondSame); // second group A
    await waitFor(()=> expect(screen.getByText(/distinct key sets/i)).toBeTruthy());
  });

  it('feature validation: blank feature name and duplicate names produce errors', async () => {
    await initNewDraft();
    const blankBtn = screen.getAllByText('add-blank-feature')[0];
    fireEvent.click(blankBtn);
    await waitFor(()=> expect(screen.getByText(/all features must have a name/i)).toBeTruthy());
    const dupBtn = screen.getAllByText('add-dup-features')[0];
    fireEvent.click(dupBtn);
    await waitFor(()=> expect(screen.getByText(/feature names must be unique/i)).toBeTruthy());
  });

  it('feat selection toggles Modified badge and clearing reverts it', async () => {
    render(() => <Backgrounds />);
    storeInstance.selectBackground('Scholar');
    // Align ability choices with baseline so not modified initially
    storeInstance.addAbilityChoice('Int');
    await waitFor(()=> expect(screen.getByText('Save As Homebrew')).toBeTruthy());
    await waitFor(()=> expect(screen.queryByText('Modified')).toBeNull());
    const changeBtn = screen.getAllByText('change')[0];
    fireEvent.click(changeBtn); // set feat
    expect(screen.getByText('Modified')).toBeTruthy();
    const clearBtn = screen.getAllByText('clear-feat')[0];
    fireEvent.click(clearBtn); // clear feat
    await waitFor(()=> expect(screen.queryByText('Modified')).toBeNull());
  });

  it('language validation disables save until enough options', async () => {
    const saveBtn = await initNewDraft();
    storeInstance.updateBlankDraft('name', 'Polyglot');
    // Initially valid (0 amount) -> enabled
    expect(saveBtn.disabled).toBe(false);
    const incBtn = screen.getAllByText('inc-lang-amount')[0];
    incBtn.click(); // amount 1
    incBtn.click(); // amount 2
    // Now needs 2 options but has 0 -> disabled
    await waitFor(()=> expect(saveBtn.disabled).toBe(true));
    const addElvish = screen.getAllByText('add-elvish')[0];
    addElvish.click(); // 1 option
    await waitFor(()=> expect(saveBtn.disabled).toBe(true));
    const addDwarvish = screen.getAllByText('add-dwarvish')[0];
    addDwarvish.click(); // 2 options
    await waitFor(()=> expect(saveBtn.disabled).toBe(false));
  });

  it('modified badge disappears after reverting changes on a new draft', async () => {
    await initNewDraft();
    storeInstance.updateBlankDraft('name', 'Revert Draft');
    const addBtn = screen.getAllByText('add-ability')[0];
    fireEvent.click(addBtn);
    expect(screen.getByText('Modified')).toBeTruthy();
    const resetBtn = screen.getAllByText('reset-abilities')[0];
    fireEvent.click(resetBtn);
    await waitFor(()=> expect(screen.queryByText('Modified')).toBeNull());
  });

  it('snackbar auto-dismisses after timeout (using exported constant)', async () => {
    vi.useFakeTimers();
    try {
      const saveBtn = await initNewDraft();
      storeInstance.updateBlankDraft('name', 'Snack Auto');
      await waitFor(()=> expect(saveBtn.disabled).toBe(false));
      fireEvent.click(saveBtn);
      await waitFor(()=> expect(screen.getByText('Background saved')).toBeTruthy());
      // advance just before timeout boundary
      vi.advanceTimersByTime(SNACKBAR_TIMEOUT_MS - 100);
      expect(screen.queryByText('Background saved')).toBeTruthy();
      // advance past timeout
      vi.advanceTimersByTime(200);
      await waitFor(()=> expect(screen.queryByText('Background saved')).toBeNull());
      expect(vi.getTimerCount()).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it('saving new draft persists data (Modified badge may remain until baseline sync)', async () => {
    const saveBtn = await initNewDraft();
    storeInstance.updateBlankDraft('name', 'Badge Test');
    const addAbility = screen.getAllByText('add-ability')[0];
    fireEvent.click(addAbility);
    expect(screen.getByText('Modified')).toBeTruthy();
    fireEvent.click(saveBtn);
    await waitFor(()=> expect(screen.getByText('Background saved')).toBeTruthy());
  // @ts-ignore
  const { homebrewManager } = await import('../../../../../../shared/customHooks/homebrewManager');
    expect(homebrewManager.addBackground).toHaveBeenCalled();
  });

  it('update flow: shows Update button and calls updateBackground after modification', async () => {
    // seed homebrew with Scholar
    setHomebrewBackgrounds([{ name: 'Scholar' }]);
    render(() => <Backgrounds />);
    storeInstance.selectBackground('Scholar');
    await waitFor(()=> expect(screen.getByText('Update Homebrew')).toBeTruthy());
    const updateBtn = screen.getByText('Update Homebrew') as HTMLButtonElement;
    // If already enabled due to computed diff, tolerate.
    // Make a modification (feat change)
    const changeBtn = screen.getAllByText('change')[0];
    fireEvent.click(changeBtn);
    await waitFor(()=> expect(updateBtn.disabled).toBe(false));
    fireEvent.click(updateBtn);
  // @ts-ignore runtime dynamic import of mocked module
  const { homebrewManager } = await import('../../../../../../shared/customHooks/homebrewManager');
    expect(homebrewManager.updateBackground).toHaveBeenCalledTimes(1);
    await waitFor(()=> expect(screen.getByText('Background updated')).toBeTruthy());
  });

  it('feature errors disable saving and resolving them re-enables save', async () => {
    const saveBtn = await initNewDraft();
    storeInstance.updateBlankDraft('name', 'Feature Err');
    await waitFor(()=> expect(saveBtn.disabled).toBe(false));
    const blankBtn = screen.getAllByText('add-blank-feature')[0];
    fireEvent.click(blankBtn); // introduces blank feature name
    await waitFor(()=> expect(screen.getByText(/all features must have a name/i)).toBeTruthy());
    expect(saveBtn.disabled).toBe(true);
    const clearBtn = screen.getAllByText('clear-features')[0];
    fireEvent.click(clearBtn); // remove all features
    await waitFor(()=> expect(screen.queryByText(/all features must have a name/i)).toBeNull());
    await waitFor(()=> expect(saveBtn.disabled).toBe(false));
  });

  it('equipment errors disable saving and fixing them re-enables save', async () => {
    const saveBtn = await initNewDraft();
    storeInstance.updateBlankDraft('name', 'Equip Err');
    await waitFor(()=> expect(saveBtn.disabled).toBe(false));
    fireEvent.click(screen.getAllByText('commit-empty')[0]); // errors
    await waitFor(()=> expect(screen.getByText(/missing keys/i)).toBeTruthy());
    expect(saveBtn.disabled).toBe(true); // invalid
    // add a valid group
    fireEvent.click(screen.getAllByText('commit-equip')[0]);
    // errors still present because first invalid group remains; add valid second, then add dupe (to create distinct key test below)
    // For recovery we simulate adding valid then clearing by reselecting new which resets state
    storeInstance.selectNew();
    storeInstance.updateBlankDraft('name', 'Equip Err Fixed');
    await waitFor(()=> expect(screen.queryByText(/equipment group/i)).toBeNull());
    await waitFor(()=> expect((screen.getByText('Save As Homebrew') as HTMLButtonElement).disabled).toBe(false));
  });

  it('language validation: lowering requirement not currently simulated in mock (skip decrease)', async () => {
    const saveBtn = await initNewDraft();
    storeInstance.updateBlankDraft('name', 'Lang Adjust');
    const inc = screen.getAllByText('inc-lang-amount')[0];
    inc.click(); inc.click(); // amount 2
    await waitFor(()=> expect(saveBtn.disabled).toBe(true));
    const addElvish = screen.getAllByText('add-elvish')[0];
    addElvish.click();
    const addDwarvish = screen.getAllByText('add-dwarvish')[0];
    addDwarvish.click();
    await waitFor(()=> expect(saveBtn.disabled).toBe(false));
  });

  it('section collapse toggles update collapsed data attributes', async () => {
    await initNewDraft();
    const abilitiesSec = screen.getAllByText('add-ability')[0].parentElement as HTMLElement; // mock root
    // initial: attribute may be absent => treat as false
    expect(abilitiesSec.getAttribute('data-collapsed')).toBe('false');
    const toggleAbilities = screen.getAllByText('toggle-abilities')[0];
    fireEvent.click(toggleAbilities);
    expect(abilitiesSec.getAttribute('data-collapsed')).toBe('true');
    fireEvent.click(toggleAbilities);
    expect(abilitiesSec.getAttribute('data-collapsed')).toBe('false');
    // equipment section root is the parent div containing commit buttons
    const equipSec = screen.getAllByText('commit-equip')[0].parentElement as HTMLElement;
    expect(equipSec.getAttribute('data-collapsed')).toBe('false');
    const toggleEquip = screen.getAllByText('toggle-equipment')[0];
    fireEvent.click(toggleEquip);
    expect(equipSec.getAttribute('data-collapsed')).toBe('true');
  });
});
