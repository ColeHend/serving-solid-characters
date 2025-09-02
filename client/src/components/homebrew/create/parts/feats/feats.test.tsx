import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { render, fireEvent, cleanup } from "@solidjs/testing-library";
import { Route, Router } from "@solidjs/router";
import Feats from "./feats";
import homebrewManager from "../../../../../shared/customHooks/homebrewManager";

const tick = () => new Promise(res => setTimeout(res, 0));

describe("Feats UI", () => {
  beforeEach(async () => {
    await homebrewManager.resetSystem();
  });
  afterEach(() => cleanup());

  it("renders", async () => {
    render(() => <Router>
      <Route path='/homebrew/feats' component={Feats} />
    </Router>);
  });

  it("adds a feat", async () => {
    render(() => <Router><Route path="/" component={Feats} /></Router>);
    const nameInput = document.getElementById('featName') as HTMLInputElement;
    nameInput.value = 'Test Feat';
  nameInput.dispatchEvent(new Event('input', { bubbles: true }));
  nameInput.dispatchEvent(new Event('change', { bubbles: true }));
    const descEl = document.getElementById('featDescription') as HTMLTextAreaElement;
    if (descEl) {
      descEl.value = 'A powerful boon';
  descEl.dispatchEvent(new Event('input', { bubbles: true }));
  descEl.dispatchEvent(new Event('change', { bubbles: true }));
    }
  // Should show Save Feat when it does not yet exist
  const addBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Save Feat')) as HTMLButtonElement;
    addBtn?.click();
  // Poll a few times because addFeat resolves after Dexie observable completes
  for (let i = 0; i < 15 && !homebrewManager.feats().some(f => (f as any).details?.name === 'Test Feat'); i++) {
    await tick();
  }
  expect(homebrewManager.feats().some(f => (f as any).details?.name === 'Test Feat')).toBe(true);
  });

  it("updates an existing feat", async () => {
    await homebrewManager.addFeat({ details: { name: 'Update Me', description: 'Old' }, prerequisites: [] } as any);
    render(() => <Router><Route path="/" component={Feats} /></Router>);
    const nameInput = document.getElementById('featName') as HTMLInputElement;
    nameInput.value = 'Update Me';
  nameInput.dispatchEvent(new Event('input', { bubbles: true }));
  nameInput.dispatchEvent(new Event('change', { bubbles: true }));
    const descEl = document.getElementById('featDescription') as HTMLTextAreaElement;
    if (descEl) {
      descEl.value = 'New Description';
  descEl.dispatchEvent(new Event('input', { bubbles: true }));
  descEl.dispatchEvent(new Event('change', { bubbles: true }));
    }
    const updateBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent?.includes('Update Feat')) as HTMLButtonElement;
    updateBtn?.click();
  for (let i = 0; i < 5 && !homebrewManager.feats().find(f => (f as any).details?.name === 'Update Me')?.details?.description.includes('New'); i++) {
    await tick();
  }
  expect(homebrewManager.feats().find(f => (f as any).details?.name === 'Update Me')?.details?.description).toContain('New');
  });

  it("fills existing feat data when Fill clicked", async () => {
    await homebrewManager.addFeat({ details: { name: 'FillMe', description: 'Legacy Desc' }, prerequisites: [{ type: 0, value: 'STR 10'}] } as any);
    render(() => <Router><Route path="/" component={Feats} /></Router>);
    const nameInput = document.getElementById('featName') as HTMLInputElement;
    nameInput.value = 'FillMe';
    nameInput.dispatchEvent(new Event('input', { bubbles: true }));
    nameInput.dispatchEvent(new Event('change', { bubbles: true }));
    // Wait a microtask for reactive featExists to flip
    await tick();
    const fillBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent === 'Fill') as HTMLButtonElement;
    fillBtn?.click();
    await tick();
    const descEl = document.getElementById('featDescription') as HTMLTextAreaElement;
    expect(descEl?.value || descEl?.textContent).toContain('Legacy Desc');
    // Expect chip rendered for STR 10
    const chipTexts = Array.from(document.querySelectorAll('[data-mock="Chip"]')).map(c => c.textContent);
    expect(chipTexts.some(t => /STR 10/i.test(t || ''))).toBe(true);
  });

  it("prefills from query param", async () => {
  await homebrewManager.resetSystem();
  await homebrewManager.addFeat({ details: { name: 'QueryFeat', description: 'From Query' }, prerequisites: [{ type: 7, value: 'STR 15'}] } as any);
  // Push query param into history before mount so useSearchParams sees it
  window.history.pushState({}, '', '/homebrew/feats?name=QueryFeat');
  render(() => <Router><Route path="/homebrew/feats" component={Feats} /></Router>);
  // Poll until prefill applies
  let nameInputs = Array.from(document.querySelectorAll('#featName')) as HTMLInputElement[];
  let target = nameInputs[nameInputs.length - 1];
  for (let i=0;i<10 && target.value !== 'QueryFeat'; i++) { await tick(); nameInputs = Array.from(document.querySelectorAll('#featName')) as HTMLInputElement[]; target = nameInputs[nameInputs.length - 1]; }
  expect(target.value).toBe('QueryFeat');
    const descEl = document.getElementById('featDescription') as HTMLTextAreaElement;
    expect(descEl?.value || descEl?.textContent).toContain('From Query');
    const chipTexts = Array.from(document.querySelectorAll('[data-mock="Chip"]')).map(c => c.textContent || '');
    expect(chipTexts.some(t => /STR 15/i.test(t))).toBe(true);
  });

  it("fills legacy preReqs correctly", async () => {
    // Manually inject a legacy feat (simulate older storage)
    (homebrewManager as any)._setFeats([ { name: 'OldFeat', desc: ['Old Desc'], preReqs: [{ name: 'STR 12', value: 'STR 12' }, { name: 'Wizard', value: 'Wizard' }] } ]);
  window.history.pushState({}, '', '/');
    render(() => <Router><Route path="/" component={Feats} /></Router>);
  let nameInput: HTMLInputElement | null = null;
  for (let i=0;i<10 && !nameInput; i++) { await tick(); nameInput = document.getElementById('featName') as HTMLInputElement; }
  if (!nameInput) throw new Error('featName input not found');
  nameInput.value = 'OldFeat';
  nameInput.dispatchEvent(new Event('input', { bubbles: true }));
  nameInput.dispatchEvent(new Event('change', { bubbles: true }));
    await tick();
    const fillBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent === 'Fill') as HTMLButtonElement;
    fillBtn?.click();
    await tick();
    const chipTexts = Array.from(document.querySelectorAll('[data-mock="Chip"]')).map(c => c.textContent);
    expect(chipTexts.some(t => /STR 12/i.test(t || ''))).toBe(true);
    expect(chipTexts.some(t => /Wizard/i.test(t || ''))).toBe(true);
  });

  it("adds a level prerequisite", async () => {
  window.history.pushState({}, '', '/');
    render(() => <Router><Route path="/" component={Feats} /></Router>);
    // Set feat name & description
  let nameInput: HTMLInputElement | null = null;
  for (let i=0;i<10 && !nameInput; i++) { await tick(); nameInput = document.getElementById('featName') as HTMLInputElement; }
  if (!nameInput) throw new Error('featName input not found');
  nameInput.value = 'LevelFeat';
  nameInput.dispatchEvent(new Event('input', { bubbles: true }));
  nameInput.dispatchEvent(new Event('change', { bubbles: true }));
    const descEl = document.getElementById('featDescription') as HTMLTextAreaElement;
    if (descEl) {
      descEl.value = 'Has a level prereq';
      descEl.dispatchEvent(new Event('input', { bubbles: true }));
      descEl.dispatchEvent(new Event('change', { bubbles: true }));
    }
    // Change select to CharacterLevel
    const selects = Array.from(document.querySelectorAll('select')) as HTMLSelectElement[];
    const typeSelect = selects[0];
    // Option order (from FeatureTypes enum mapping in component) -> AbilityScore is later; CharacterLevel option text is 'Class Level'
    // We locate the option with text 'Class Level'
    const classLevelOption = Array.from(typeSelect.options).find(o => /Class Level/i.test(o.textContent || ''));
    if (classLevelOption) {
      typeSelect.value = classLevelOption.value;
      typeSelect.dispatchEvent(new Event('change', { bubbles: true }));
    }
    await tick();
    // Level input is now the numeric input with current keyValue (default 1) we can change it
    const levelInput = Array.from(document.querySelectorAll('input[type="number"]'))
      .find(i => (i as HTMLInputElement).value === '1') as HTMLInputElement;
    if (levelInput) {
      levelInput.value = '5';
      levelInput.dispatchEvent(new Event('input', { bubbles: true }));
      levelInput.dispatchEvent(new Event('change', { bubbles: true }));
    }
    // Click Add prerequisite
    const addPrereqBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent === 'Add') as HTMLButtonElement;
    addPrereqBtn.click();
    await tick();
    // Save feat
    const saveBtn = Array.from(document.querySelectorAll('button')).find(b => /Save Feat/.test(b.textContent || '')) as HTMLButtonElement;
    saveBtn.click();
    for (let i=0;i<5 && !homebrewManager.feats().some(f => (f as any).details?.name === 'LevelFeat'); i++) await tick();
    const stored = homebrewManager.feats().find(f => (f as any).details?.name === 'LevelFeat') as any;
    expect(stored?.prerequisites?.some((p:any) => p.type === 1 && p.value === '5')).toBe(true); // PrerequisiteType.Level == 1
  });

  it("adds a class + level prerequisite", async () => {
    window.history.pushState({}, '', '/');
    render(() => <Router><Route path="/" component={Feats} /></Router>);
    // Wait for input
    let nameInput: HTMLInputElement | null = null;
    for (let i=0;i<10 && !nameInput; i++) { await tick(); nameInput = document.getElementById('featName') as HTMLInputElement; }
    if (!nameInput) throw new Error('featName input not found');
    nameInput.value = 'ClassLevelFeat';
    nameInput.dispatchEvent(new Event('input', { bubbles: true }));
    nameInput.dispatchEvent(new Event('change', { bubbles: true }));
    const descEl = document.getElementById('featDescription') as HTMLTextAreaElement;
    if (descEl) {
      descEl.value = 'Requires Wizard 3';
      descEl.dispatchEvent(new Event('input', { bubbles: true }));
      descEl.dispatchEvent(new Event('change', { bubbles: true }));
    }
    // Select Class type (value equals FeatureTypes.Class numeric) -> option order: Ability Score, Class, Class Level
    const typeSelect = document.querySelector('select[data-mock="Select"]') as HTMLSelectElement;
    const classOption = Array.from(typeSelect.options).find(o => /Class$/.test(o.textContent || ''));
    if (classOption) { typeSelect.value = classOption.value; typeSelect.dispatchEvent(new Event('change', { bubbles: true })); }
    await tick();
    // Find optional class level input
    const classLevelInput = document.getElementById('classLevelInput') as HTMLInputElement;
    if (classLevelInput) {
      classLevelInput.value = '3';
      classLevelInput.dispatchEvent(new Event('input', { bubbles: true }));
      classLevelInput.dispatchEvent(new Event('change', { bubbles: true }));
    }
    // Add prereq
    const addBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent === 'Add') as HTMLButtonElement;
    addBtn.click();
    await tick();
    // Save feat
    const saveBtn = Array.from(document.querySelectorAll('button')).find(b => /Save Feat/.test(b.textContent || '')) as HTMLButtonElement;
    saveBtn.click();
    for (let i=0;i<10 && !homebrewManager.feats().some(f => (f as any).details?.name === 'ClassLevelFeat'); i++) await tick();
    const stored = homebrewManager.feats().find(f => (f as any).details?.name === 'ClassLevelFeat') as any;
    expect(stored?.prerequisites?.some((p:any) => p.type === 2 && /\b3\b/.test(p.value))).toBe(true); // PrerequisiteType.Class == 2
  });

  it("adds subclass, feat, race, item and text prerequisites", async () => {
    window.history.pushState({}, '', '/');
    // Seed data directly
    (homebrewManager as any)._setFeats([]);
    // Add one existing feat used as prerequisite target
    await homebrewManager.addFeat({ details: { name: 'FeatTarget', description: 'x' }, prerequisites: [] } as any);
    // Seed subclass & race & item via private setters (simpler than full manager flows)
    (homebrewManager as any)._setSubclasses([ { name: 'Evoker', parent_class: 'Wizard', description: '', features: {} } ]);
    (homebrewManager as any)._setRaces([ { id:'r1', name: 'Elf', size:'Medium', speed:30, languages:[], abilityBonuses:[], traits:[] } ]);
    (homebrewManager as any)._setItems([ { id:1, name:'Magic Sword', desc:'', type:0, weight:1, cost:'', properties:{} } ]);
    render(() => <Router><Route path="/" component={Feats} /></Router>);
    // Wait for input
    let nameInput: HTMLInputElement | null = null; for (let i=0;i<10 && !nameInput; i++) { await tick(); nameInput = document.getElementById('featName') as HTMLInputElement; }
    if (!nameInput) throw new Error('featName input not found');
    nameInput.value = 'MultiPrereqFeat';
    nameInput.dispatchEvent(new Event('input', { bubbles: true }));
    nameInput.dispatchEvent(new Event('change', { bubbles: true }));
    const descEl = document.getElementById('featDescription') as HTMLTextAreaElement;
    if (descEl) { descEl.value = 'Multiple prereqs'; descEl.dispatchEvent(new Event('input', { bubbles: true })); descEl.dispatchEvent(new Event('change', { bubbles: true })); }
    const typeSelect = document.querySelector('select[data-mock="Select"]') as HTMLSelectElement;
    const clickAdd = async () => { const addBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent === 'Add') as HTMLButtonElement; addBtn.click(); await tick(); };
    // Subclass
    let opt = Array.from(typeSelect.options).find(o => /Subclass/i.test(o.textContent || '')); typeSelect.value = opt!.value; typeSelect.dispatchEvent(new Event('change', { bubbles: true })); await tick(); await clickAdd();
    // Feat
    opt = Array.from(typeSelect.options).find(o => /^Feat$/i.test(o.textContent || '')); typeSelect.value = opt!.value; typeSelect.dispatchEvent(new Event('change', { bubbles: true })); await tick(); await clickAdd();
    // Race
    opt = Array.from(typeSelect.options).find(o => /^Race$/i.test(o.textContent || '')); typeSelect.value = opt!.value; typeSelect.dispatchEvent(new Event('change', { bubbles: true })); await tick(); await clickAdd();
    // Item
    opt = Array.from(typeSelect.options).find(o => /^Item$/i.test(o.textContent || '')); typeSelect.value = opt!.value; typeSelect.dispatchEvent(new Event('change', { bubbles: true })); await tick(); await clickAdd();
    // Text
    opt = Array.from(typeSelect.options).find(o => /Other\s*\/\s*Text/i.test(o.textContent || '')); typeSelect.value = opt!.value; typeSelect.dispatchEvent(new Event('change', { bubbles: true })); await tick();
    const textInput = Array.from(document.querySelectorAll('input[type="text"]')).find(i => (i as HTMLInputElement).placeholder?.includes('Enter prerequisite')); if (textInput) { (textInput as HTMLInputElement).value = 'Custom Condition'; textInput.dispatchEvent(new Event('input', { bubbles: true })); textInput.dispatchEvent(new Event('change', { bubbles: true })); }
    await clickAdd();
    // Save
    const saveBtn = Array.from(document.querySelectorAll('button')).find(b => /Save Feat/.test(b.textContent || '')) as HTMLButtonElement; saveBtn.click();
    for (let i=0;i<15 && !homebrewManager.feats().some(f => (f as any).details?.name === 'MultiPrereqFeat'); i++) await tick();
    const stored = homebrewManager.feats().find(f => (f as any).details?.name === 'MultiPrereqFeat') as any;
    expect(stored?.prerequisites?.some((p:any) => p.type === 3)).toBe(true); // Subclass
    expect(stored?.prerequisites?.some((p:any) => p.type === 4)).toBe(true); // Feat
    expect(stored?.prerequisites?.some((p:any) => p.type === 5)).toBe(true); // Race
    expect(stored?.prerequisites?.some((p:any) => p.type === 6)).toBe(true); // Item
    expect(stored?.prerequisites?.some((p:any) => p.type === 0 && /Custom Condition/i.test(p.value))).toBe(true); // String
  });
});