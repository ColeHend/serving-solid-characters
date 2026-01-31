import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@solidjs/testing-library';
import { createSignal } from 'solid-js';

// Mock router search params
vi.mock('@solidjs/router', () => ({ useSearchParams: () => [{}, ()=>{}] }));

// Mock homebrewManager
vi.mock('../../../../../../shared', () => ({
  homebrewManager: {
    subclasses: () => mockSubclasses,
    addSubclass: vi.fn((s: any) => { mockSubclasses.push(s); }),
    updateSubclass: vi.fn(),
  },
  getAddNumberAccent: (n: number) => `#${n}`,
  getNumberArray: (n: number) => Array.from({ length: n }, (_, i) => i + 1),
  getSpellcastingDictionary: () => ({ cantrips_known: 2 })
}));

// Minimal data hooks
vi.mock('../../../../../../shared/customHooks/dndInfo/info/all/classes', () => ({
  useDnDClasses: () => () => ([{ name: 'Wizard' }, { name: 'Fighter' }])
}));
vi.mock('../../../../../../shared/customHooks/dndInfo/info/all/spells', () => ({
  useDnDSpells: () => () => ([{ name: 'Fire Bolt', level: 0 }, { name: 'Magic Missile', level: 1 }])
}));

// coles-solid-library stubs
vi.mock('coles-solid-library', () => ({
  Body: (p: any) => <div>{p.children}</div>,
  FormGroup: class {
    signals: Record<string, [any, any]> = {};
    version: [() => number, (n: number | ((x:number)=>number)) => void];
    constructor(def: any) {
      Object.entries(def).forEach(([k,v]: any) => { const [g,s] = createSignal(v[0]); this.signals[k] = [g,s]; });
      this.version = createSignal(0);
    }
    get(k: string) { this.version[0](); return this.signals[k][0](); }
    set(k: string, v: any) { this.signals[k][1](v); this.version[1](x=>x+1); }
  },
  Validators: { Required: () => true },
  Select: (p: any) => <select value={p.value} onChange={e => p.onChange?.((e.currentTarget as HTMLSelectElement).value)}>{p.children}</select>,
  Option: (p: any) => <option value={p.value}>{p.children}</option>,
  Input: (p: any) => <input value={p.value} onInput={e => p.onInput?.(e)} onChange={e=>p.onChange?.(e)} />,
  TextArea: (p: any) => <textarea value={p.value} onInput={e => p.setText?.((e.currentTarget as HTMLTextAreaElement).value)} onChange={e=>p.onChange?.(e)} />,
  Checkbox: (p: any) => <label><input type="checkbox" checked={p.checked} onChange={()=>p.onChange?.(!p.checked)} />{p.label}</label>,
  Button: (p: any) => <button disabled={p.disabled} onClick={()=>p.onClick?.()}>{p.children || 'Button'}</button>,
  Chip: (p: any) => <span>{p.value}<button onClick={()=>p.remove?.()}>x</button></span>,
  FormField: (p: any) => <label>{p.name}{p.children}</label>
}));

// Section stubs
vi.mock('../FeaturesSection', () => ({ FeaturesSection: () => <div data-sec="features" /> }));
vi.mock('../SpellcastingSection', () => ({ SpellcastingSection: () => <div data-sec="spellcasting" /> }));

// Import after mocks
// eslint-disable-next-line import/first
import Subclasses from '../subclasses';

let mockSubclasses: any[] = [];

describe('Subclasses behavior (unified save/update)', () => {
  beforeEach(()=> { mockSubclasses = []; vi.clearAllMocks(); });
  afterEach(()=> { cleanup(); });

  const setup = () => render(() => <Subclasses />);

  it('shows Save Subclass only after class & name then hides when name cleared', async () => {
    setup();
    expect(screen.queryByText('Save Subclass')).toBeNull();
    const selects = document.querySelectorAll('select');
    const classSelect = selects[1] as HTMLSelectElement;
    fireEvent.change(classSelect, { target: { value: 'Wizard' }, currentTarget: { value: 'Wizard' } });
    expect(screen.queryByText('Save Subclass')).toBeNull();
    const nameInput = screen.getAllByRole('textbox')[0] as HTMLInputElement;
    fireEvent.change(nameInput, { target: { value: 'Chronomancer' }, currentTarget: { value: 'Chronomancer' } });
    const saveBtn = await screen.findByText('Save Subclass');
    expect(saveBtn).toBeDefined();
    expect((saveBtn as HTMLButtonElement).disabled).toBe(false);
    // Clear name -> Save removed
    fireEvent.change(nameInput, { target: { value: '' }, currentTarget: { value: '' } });
    await waitFor(()=> expect(screen.queryByText('Save Subclass')).toBeNull());
  });

  it('adds new subclass through Save Subclass when enabled', async () => {
    setup();
    const selects = document.querySelectorAll('select');
    const classSelect = selects[1] as HTMLSelectElement;
    fireEvent.change(classSelect, { target: { value: 'Wizard' }, currentTarget: { value: 'Wizard' } });
    const nameInput = screen.getAllByRole('textbox')[0] as HTMLInputElement;
    fireEvent.change(nameInput, { target: { value: 'Time Mage' }, currentTarget: { value: 'Time Mage' } });
    const descArea = screen.getAllByRole('textbox')[1] as HTMLTextAreaElement;
    fireEvent.change(descArea, { target: { value: 'desc' }, currentTarget: { value: 'desc' } });
    const saveBtn = await screen.findByText('Save Subclass');
    fireEvent.click(saveBtn);
    const { homebrewManager }: any = await import('../../../../../../shared');
    expect(homebrewManager.addSubclass).toHaveBeenCalledTimes(1);
    expect(mockSubclasses.some(s => s.name === 'Time Mage')).toBe(true);
    // After save becomes Update Subclass disabled
    await waitFor(()=> {
      const btn = screen.getByText('Update Subclass') as HTMLButtonElement;
      expect(btn.disabled).toBe(true);
    });
  });

  it('update path called when editing existing subclass after modification', async () => {
    setup();
    const selects = document.querySelectorAll('select');
    const classSelect = selects[1] as HTMLSelectElement;
    fireEvent.change(classSelect, { target: { value: 'Wizard' }, currentTarget: { value: 'Wizard' } });
    const nameInput = screen.getAllByRole('textbox')[0] as HTMLInputElement;
    fireEvent.change(nameInput, { target: { value: 'Shadow' }, currentTarget: { value: 'Shadow' } });
    const descArea = screen.getAllByRole('textbox')[1] as HTMLTextAreaElement;
    fireEvent.change(descArea, { target: { value: 'old desc' }, currentTarget: { value: 'old desc' } });
    const saveBtn = await screen.findByText('Save Subclass');
    fireEvent.click(saveBtn);
    const { homebrewManager }: any = await import('../../../../../../shared');
    expect(homebrewManager.addSubclass).toHaveBeenCalledTimes(1);
    await waitFor(()=> {
      const btn = screen.getByText('Update Subclass') as HTMLButtonElement;
      expect(btn.disabled).toBe(true);
    });
    // modify
    fireEvent.change(descArea, { target: { value: 'new desc' }, currentTarget: { value: 'new desc' } });
    await waitFor(()=> {
      const btn = screen.getByText('Update Subclass') as HTMLButtonElement;
      expect(btn.disabled).toBe(false);
    });
    fireEvent.click(screen.getByText('Update Subclass'));
    await waitFor(()=> expect(homebrewManager.updateSubclass).toHaveBeenCalledTimes(1));
  });

  it('prefills fields when existing subclass selected', async () => {
    mockSubclasses = [];
    mockSubclasses.push({ name: 'Echo', parent_class: 'Wizard', description: 'echo desc', features: { 3:[{ name:'Echo Step', description:'Teleport a short distance'}]}, storage_key: 'wizard__echo', spellcasting: null });
    setup();
    const chooser = document.querySelectorAll('select')[0] as HTMLSelectElement;
    fireEvent.change(chooser, { target: { value: 'wizard__echo' }, currentTarget: { value: 'wizard__echo' } });
    await waitFor(()=> {
      const nameInput = screen.getAllByRole('textbox')[0] as HTMLInputElement;
      expect(nameInput.value).toBe('Echo');
      const descArea = screen.getAllByRole('textbox')[1] as HTMLTextAreaElement;
      expect(descArea.value).toBe('echo desc');
    });
    {
      const btn = screen.getByText('Update Subclass') as HTMLButtonElement;
      expect(btn.disabled).toBe(true);
    }
  });

  it('prefills after adding new subclass then selecting + New Subclass and reselecting', async () => {
    setup();
    const selects = document.querySelectorAll('select');
    const classSelect = selects[1] as HTMLSelectElement;
    fireEvent.change(classSelect, { target: { value: 'Wizard' }, currentTarget: { value: 'Wizard' } });
    const nameInput = screen.getAllByRole('textbox')[0] as HTMLInputElement;
    fireEvent.change(nameInput, { target: { value: 'TempSub' }, currentTarget: { value: 'TempSub' } });
    const descArea = screen.getAllByRole('textbox')[1] as HTMLTextAreaElement;
    fireEvent.change(descArea, { target: { value: 'temp desc' }, currentTarget: { value: 'temp desc' } });
    const saveBtn = await screen.findByText('Save Subclass');
    fireEvent.click(saveBtn);
    await waitFor(()=> {
      const btn = screen.getByText('Update Subclass') as HTMLButtonElement;
      expect(btn.disabled).toBe(true);
    });
    const chooser = document.querySelectorAll('select')[0] as HTMLSelectElement;
    // Start new draft
    fireEvent.change(chooser, { target: { value: '__new__' }, currentTarget: { value: '__new__' } });
    await waitFor(()=> expect((screen.getAllByRole('textbox')[0] as HTMLInputElement).value).toBe(''));
    // Reselect existing
    fireEvent.change(chooser, { target: { value: 'wizard__tempsub' }, currentTarget: { value: 'wizard__tempsub' } });
    await waitFor(()=> {
      expect((screen.getAllByRole('textbox')[0] as HTMLInputElement).value).toBe('TempSub');
      expect((screen.getAllByRole('textbox')[1] as HTMLTextAreaElement).value).toBe('temp desc');
    });
  });

  it('prefills subclass lacking explicit storage_key (fallback derived)', async () => {
    mockSubclasses = [];
    mockSubclasses.push({ name: 'NoKey', parent_class: 'Wizard', description: 'nokey desc', features: {}, spellcasting: null });
    setup();
    const chooser = document.querySelectorAll('select')[0] as HTMLSelectElement;
    fireEvent.change(chooser, { target: { value: 'wizard__nokey' }, currentTarget: { value: 'wizard__nokey' } });
    await waitFor(()=> {
      const nameInput = screen.getAllByRole('textbox')[0] as HTMLInputElement;
      expect(nameInput.value).toBe('NoKey');
      const descArea = screen.getAllByRole('textbox')[1] as HTMLTextAreaElement;
      expect(descArea.value).toBe('nokey desc');
    });
  });

  it('reset changes restores original values and disables update', async () => {
    mockSubclasses = [];
    mockSubclasses.push({ name: 'ResetMe', parent_class: 'Wizard', description: 'orig desc', features: {}, storage_key: 'wizard__resetme', spellcasting: null });
    setup();
    const chooser = document.querySelectorAll('select')[0] as HTMLSelectElement;
    fireEvent.change(chooser, { target: { value: 'wizard__resetme' }, currentTarget: { value: 'wizard__resetme' } });
    await waitFor(()=> expect((screen.getAllByRole('textbox')[1] as HTMLTextAreaElement).value).toBe('orig desc'));
    const descArea = screen.getAllByRole('textbox')[1] as HTMLTextAreaElement;
    fireEvent.change(descArea, { target: { value: 'changed desc' }, currentTarget: { value: 'changed desc' } });
    await waitFor(()=> {
      const btn = screen.getByText('Update Subclass') as HTMLButtonElement;
      expect(btn.disabled).toBe(false);
    });
    const resetBtn = await screen.findByText('Reset Changes');
    fireEvent.click(resetBtn);
    await waitFor(()=> expect((screen.getAllByRole('textbox')[1] as HTMLTextAreaElement).value).toBe('orig desc'));
    {
      const btn = screen.getByText('Update Subclass') as HTMLButtonElement;
      expect(btn.disabled).toBe(true);
    }
  });
});
