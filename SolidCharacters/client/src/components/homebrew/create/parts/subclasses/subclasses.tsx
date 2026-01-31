import { Component, createMemo, createSignal, onMount, batch, Show, createEffect, For } from "solid-js";
import { homebrewManager, getAddNumberAccent, getNumberArray, getSpellcastingDictionary } from "../../../../../shared";
import { Subclass as OldSubclass } from "../../../../../models/old/class.model";
import { A, useSearchParams } from "@solidjs/router";
// Removed old Feature generic import; now using new data FeatureDetail shape directly
import { Body, FormGroup, Validators } from "coles-solid-library";
import { useDnDSpells } from "../../../../../shared/customHooks/dndInfo/info/all/spells";
import { Spell } from "../../../../../models";
import { buildDataSpellcasting, parseDataSpellcasting } from './subclassAdapter';
import { SpellsKnown } from './SpellsKnown';
import { ClassSelection } from './ClassSelection';
import { CoreFields } from './CoreFields';
import { FeaturesSection } from './FeaturesSection';
import { SpellcastingSection } from './SpellcastingSection';
import { FeatureDetail } from "../../../../../models/data";
import { useDnDClasses } from "../../../../../shared/customHooks/dndInfo/info/all/classes";
import { FlatCard } from "../../../../../shared/components/flatCard/flatCard";

export interface FeatureDetailLevel extends FeatureDetail {
  info: {
    level: number;
    [key: string]: any;
  }
}

const Subclasses: Component = () => {
  // URL params
  const [searchParam, setSearchParam] = useSearchParams<{name: string, subclass: string}>();

  // Source data hooks
  const allClasses = useDnDClasses();
  const allClassNames = () => allClasses().map(c => c.name);
  const allSpells = useDnDSpells();

  // FormGroup model definition
  interface SubclassForm {
    parent_class: string;
    name: string;
    description: string; // newline separated
    features: FeatureDetailLevel[];
    subclassSpells: Spell[];
    hasCasting: boolean;
    casterType: string; // half | third
    castingModifier: string; // stat
    spellsKnownCalc: SpellsKnown;
    halfCasterRoundUp: boolean;
    hasCantrips: boolean;
    hasRitualCasting: boolean;
    spellsKnownPerLevel: {level:number,amount:number}[];
    spellcastingInfo: {name:string,desc:string[]}[];
    selectedSpellName: string;
  }

  const SubclassFormGroup = new FormGroup<SubclassForm>({
    parent_class: ["", [Validators.Required]],
    name: ["", [Validators.Required]],
    description: ["", [Validators.Required]],
    features: [[], []],
    subclassSpells: [[], []],
    hasCasting: [false, []],
    casterType: ["", []],
    castingModifier: ["", []],
    spellsKnownCalc: [SpellsKnown.None, []],
    halfCasterRoundUp: [false, []],
    hasCantrips: [false, []],
    hasRitualCasting: [false, []],
    spellsKnownPerLevel: [[], []],
    spellcastingInfo: [[], []],
    selectedSpellName: ["", []]
  });

  // Convenience accessors
  const subclassClass = () => (SubclassFormGroup.get('parent_class') as any) || '';
  const subclassName = () => (SubclassFormGroup.get('name') as any) || '';
  const subclassDescArr = () => ((SubclassFormGroup.get('description') as any) || '').split('\n').filter(Boolean);

  // Feature editing (ephemeral UI state not yet in form)
  const [toAddFeatureLevel, setToAddFeatureLevel] = createSignal(0);
  const getLevelUpFeatures = (level:number) => ((SubclassFormGroup.get('features') as FeatureDetailLevel[])||[]).filter(f => f.info.level === level);
  const [editIndex, setEditIndex] = createSignal(-1);

  // Custom spells known temp inputs (not persisted directly in form group)
  const [toAddKnownLevel, setToAddKnownLevel] = createSignal(1);
  const [toAddKnownAmount, setToAddKnownAmount] = createSignal(0);

  // Selected spell derived
  const selectedSpell = createMemo(() => allSpells().find(s => s.name === (SubclassFormGroup.get('selectedSpellName') as any)));

  // Derived: subclass levels for feature options
  const getSubclassLevels = createMemo(() => {
    return Array.from({length:20}, (_,i)=>`${i+1}`);
  });

  // Derived spellcasting levels
  const baseCastingLevels = createMemo(() => {
  if (!SubclassFormGroup.get('hasCasting')) return [] as {level:number, spellcasting: Record<string,number>}[];
  return Array.from({length:20}, (_,i)=>({ level: i+1, spellcasting: getSpellcastingDictionary(i+1, (SubclassFormGroup.get('casterType') as any)||'', !!SubclassFormGroup.get('hasCantrips')) }));
  });

  // Apply custom spells known if "Other"
  const mergedCastingLevels = createMemo(() => {
  if (!SubclassFormGroup.get('hasCasting')) return [];
  const useCustom = (SubclassFormGroup.get('spellsKnownCalc') as any) === SpellsKnown.Other;
  const map = (SubclassFormGroup.get('spellsKnownPerLevel') as any[]) || [];
    if (!useCustom) return baseCastingLevels();
    return baseCastingLevels().map(l => {
      const custom = map.find(x => x.level === l.level);
      return custom ? { ...l, spellcasting: { ...l.spellcasting, spells_known: custom.amount } } : l;
    });
  });

  const spellcasting = createMemo(() => !SubclassFormGroup.get('hasCasting') ? undefined : ({
    info: (SubclassFormGroup.get('spellcastingInfo') as any[]) || [],
    castingLevels: mergedCastingLevels(),
    name: subclassName(),
    spellcastingAbility: (SubclassFormGroup.get('castingModifier') as any)||'',
    casterType: (SubclassFormGroup.get('casterType') as any)||'',
    spellsKnownCalc: (SubclassFormGroup.get('spellsKnownCalc') as any),
    spellsKnownRoundup: !!SubclassFormGroup.get('halfCasterRoundUp'),
    ritualCasting: !!SubclassFormGroup.get('hasRitualCasting')
  }) as OldSubclass['spellcasting'] | undefined);

  // Assembled subclass (pure)
  const currentSubclass = createMemo<OldSubclass>(() => ({
    id: 0,
    name: subclassName(),
    desc: subclassDescArr(),
    features: (SubclassFormGroup.get('features') as any[]) || [],
    class: subclassClass(),
    spells: (SubclassFormGroup.get('subclassSpells') as any[]) || [],
    spellcasting: spellcasting()
  } as OldSubclass));

  // Adapter to new data model Subclass (models/data) for persistence
  const toDataSubclass = () => {
    const featuresArr = (SubclassFormGroup.get('features') as FeatureDetailLevel[] ) || [];
    const features = featuresArr.reduce<Record<number, any[]>>((acc, f) => {
      const lvl = f.info?.level || 0;
      if (!acc[lvl]) acc[lvl] = [];
      acc[lvl].push({ name: f.name, description: f.description });
      return acc;
    }, {});
    const uiSpellcasting = spellcasting();
    const dataSpellcasting = buildDataSpellcasting(uiSpellcasting as any, (SubclassFormGroup.get('spellsKnownPerLevel') as any[]) || []);
    return {
      name: subclassName(),
      parent_class: subclassClass(),
      description: (SubclassFormGroup.get('description') as any) || '',
      features,
      spellcasting: dataSpellcasting,
      choices: undefined,
      storage_key: `${subclassClass().toLowerCase()}__${subclassName().toLowerCase()}`
    };
  };

  // Save enabled only when required fields populated
  const canAddSubclass = createMemo(() => !!SubclassFormGroup.get('parent_class') && !!SubclassFormGroup.get('name'));

  // Editing state ----------------------------------------------------------
  const [activeKey, setActiveKey] = createSignal<string>("__new__"); // storage_key or __new__
  // Maintain a reactive local copy so UI updates when items are added/updated (test env lacks reactive manager)
  const [homebrewList, setHomebrewList] = createSignal<any[]>([...homebrewManager.subclasses()]);
  const refreshHomebrewList = () => setHomebrewList([...homebrewManager.subclasses()]);
  const storageKeyFor = (s: any) => (s?.storage_key) ? s.storage_key : `${(s?.parentClass||'').toLowerCase()}__${(s?.name||'').toLowerCase()}`;
  const existsInHomebrew = createMemo(()=> !!homebrewList().some(s => (s as any).storage_key === `${(SubclassFormGroup.get('parent_class')||'').toLowerCase()}__${(SubclassFormGroup.get('name')||'').toLowerCase()}`));

  // Track original snapshot for change detection when editing
  const [originalSnapshot, setOriginalSnapshot] = createSignal<any | null>(null);
  // Force recomputation of draft when any relevant field changes (ensures reactivity across nested structures)
  const [formVersion, setFormVersion] = createSignal(0);
  createEffect(() => {
    // Track primitive & array refs
    SubclassFormGroup.get('parent_class');
    SubclassFormGroup.get('name');
    SubclassFormGroup.get('description');
    SubclassFormGroup.get('features');
    SubclassFormGroup.get('subclassSpells');
    SubclassFormGroup.get('spellcastingInfo');
    SubclassFormGroup.get('spellsKnownPerLevel');
    SubclassFormGroup.get('hasCasting');
    SubclassFormGroup.get('casterType');
    SubclassFormGroup.get('castingModifier');
    SubclassFormGroup.get('spellsKnownCalc');
    SubclassFormGroup.get('halfCasterRoundUp');
    SubclassFormGroup.get('hasCantrips');
    // Increment version when any dependency above changes
    setFormVersion(v => v + 1);
  });
  const currentDataDraft = createMemo(()=> { formVersion(); return toDataSubclass(); });
  // Explicit effect-based modified tracking
  const [isModifiedFlag, setIsModifiedFlag] = createSignal(false);
  const [userDirty, setUserDirty] = createSignal(false);
  const [loadingEdit, setLoadingEdit] = createSignal(false);
  const nameDescChanged = createMemo(() => {
    const orig = originalSnapshot();
    if (!orig) return false;
    const nameChanged = (subclassName() || '').toLowerCase() !== (orig.name || '').toLowerCase();
    const descCurrent = (SubclassFormGroup.get('description') as any) || '';
    const descOrig = (orig.description || '');
    return nameChanged || descCurrent !== descOrig;
  });
  createEffect(() => {
    // depend on draft recomputation & snapshot
    const draft = currentDataDraft();
    const orig = originalSnapshot();
    if (!orig) { setIsModifiedFlag(false); return; }
    setIsModifiedFlag(JSON.stringify(orig) !== JSON.stringify(draft));
  });

  function beginNewDraft() {
    // Assumes activeKey already '__new__' (do NOT setActiveKey here to avoid effect recursion)
    clearValues();
    setOriginalSnapshot(null);
    setUserDirty(false);
  }

  function loadSubclassForEdit(storage_key: string) {
  const found = homebrewList().find(s => storageKeyFor(s) === storage_key);
    if (!found) return;
    setLoadingEdit(true);
    batch(()=> {
      SubclassFormGroup.set('parent_class', found.parentClass as any);
      SubclassFormGroup.set('name', found.name as any);
      SubclassFormGroup.set('description', (found.description||'') as any);
      // features record -> flat list
      const feats: FeatureDetailLevel[] = [];
      if ((found as any).features) {
        Object.entries((found as any).features).forEach(([lvl, arr]: any) => {
          (arr as any[]).forEach(f => feats.push({ name: f.name, description: f.description, info: { level: +lvl } }));
        });
      }
      SubclassFormGroup.set('features', feats as any);
      if ((found as any).spellcasting) {
        const parsed = parseDataSpellcasting((found as any).spellcasting);
        SubclassFormGroup.set('hasCasting', !!parsed as any);
        SubclassFormGroup.set('casterType', (parsed?.casterTypeString||'') as any);
        SubclassFormGroup.set('spellsKnownCalc', (parsed?.spellsKnownCalc ?? SpellsKnown.None) as any);
        if (parsed?.customKnown?.length) SubclassFormGroup.set('spellsKnownPerLevel', parsed.customKnown as any);
        if (parsed?.castingModifier) SubclassFormGroup.set('castingModifier', parsed.castingModifier as any);
        if (parsed?.roundUp !== undefined) SubclassFormGroup.set('halfCasterRoundUp', parsed.roundUp as any);
        if (parsed?.hasCantrips !== undefined) SubclassFormGroup.set('hasCantrips', parsed.hasCantrips as any);
      }
      if ((found as any).spells) SubclassFormGroup.set('subclassSpells', ((found as any).spells||[]) as any);
      if ((found as any).spellcasting?.info) SubclassFormGroup.set('spellcastingInfo', ((found as any).spellcasting.info)||[] as any);
    });
    setOriginalSnapshot(toDataSubclass());
  setUserDirty(false);
  setLoadingEdit(false);
  }

  // When activeKey changes (dropdown selection) load or reset
  const [prevActiveKey, setPrevActiveKey] = createSignal<string>('__new__');
  createEffect(()=> {
    const key = activeKey();
    const prev = prevActiveKey();
    if (key === '__new__') {
      if (prev !== '__new__') {
        beginNewDraft();
      }
    } else if (key && key !== prev) {
      loadSubclassForEdit(key);
    }
    setPrevActiveKey(key);
  });

  const clearValues = () => {
    batch(() => {
  SubclassFormGroup.set('parent_class', '' as any);
  SubclassFormGroup.set('name', '' as any);
  SubclassFormGroup.set('description', '' as any);
  SubclassFormGroup.set('features', [] as any);
  SubclassFormGroup.set('subclassSpells', [] as any);
  SubclassFormGroup.set('hasCasting', false as any);
  SubclassFormGroup.set('casterType', '' as any);
  SubclassFormGroup.set('castingModifier', '' as any);
  SubclassFormGroup.set('spellsKnownCalc', SpellsKnown.None as any);
  SubclassFormGroup.set('halfCasterRoundUp', false as any);
  SubclassFormGroup.set('hasCantrips', false as any);
  SubclassFormGroup.set('hasRitualCasting', false as any);
  SubclassFormGroup.set('spellsKnownPerLevel', [] as any);
  SubclassFormGroup.set('spellcastingInfo', [] as any);
  SubclassFormGroup.set('selectedSpellName', '' as any);
      setToAddFeatureLevel(0);
      setToAddKnownLevel(1);
      setToAddKnownAmount(0);
    });
  };

  // URL param hydration (one-time)
  onMount(() => {
    if (searchParam.name && searchParam.subclass) {
      // Try new-model stored subclass first
      const stored = homebrewManager.subclasses().find(s => s.parentClass?.toLowerCase() === searchParam.name!.toLowerCase() && s.name.toLowerCase() === searchParam.subclass!.toLowerCase());
      if (stored) {
        batch(() => {
          SubclassFormGroup.set('parent_class', stored.parentClass as any);
          SubclassFormGroup.set('name', stored.name as any);
          SubclassFormGroup.set('description', (stored.description || '') as any);
          // features record -> flat feature array not reconstructed (left minimal)
          if (stored.features) {
            const feats: FeatureDetailLevel[] = [];
            Object.entries(stored.features).forEach(([lvl, arr]) => {
              (arr as any[]).forEach(f => feats.push({ name: f.name, description: f.description, info: { level: +lvl } }));
            });
            SubclassFormGroup.set('features', feats as any);
          }
          if (stored.spellcasting) {
            const parsed = parseDataSpellcasting(stored.spellcasting as any);
            SubclassFormGroup.set('hasCasting', true as any);
            SubclassFormGroup.set('casterType', (parsed?.casterTypeString || '') as any);
            SubclassFormGroup.set('spellsKnownCalc', (parsed?.spellsKnownCalc ?? SpellsKnown.None) as any);
            if (parsed?.customKnown?.length) SubclassFormGroup.set('spellsKnownPerLevel', parsed.customKnown as any);
          }
        });
        return;
      }
    }
  });

  // Helpers to mutate features
  const updateParamsIfReady = () => {
    if (SubclassFormGroup.get('parent_class') && SubclassFormGroup.get('name')) {
      setSearchParam({ name: subclassClass(), subclass: subclassName() as string });
    }
  };

  // Main persist handler
  const persistSubclass = () => {
    const dataSubclass = toDataSubclass();
    if (activeKey() === '__new__') {
      homebrewManager.addSubclass(dataSubclass as any);
      refreshHomebrewList();
      setOriginalSnapshot(toDataSubclass());
      setActiveKey((dataSubclass as any).storage_key);
      setUserDirty(false);
    } else {
      homebrewManager.updateSubclass(dataSubclass as any);
      refreshHomebrewList();
      setOriginalSnapshot(toDataSubclass());
      setUserDirty(false);
    }
  };

  // Track user edits for dirty state via explicit listeners (avoid monkey-patching FormGroup)
  const markDirty = () => { if (!loadingEdit() && activeKey() !== '__new__') setUserDirty(true); };

  return (
    <Body>
      <h1>Subclass Homebrew</h1>
      <div style={{ 'margin-bottom': '1rem', display: 'flex', 'flex-direction': 'column', gap: '0.5rem', 'max-width': '620px' }}>
        <label style={{ display: 'flex', 'flex-direction': 'column', gap: '0.25rem' }}>
          <span style={{ 'font-weight': 600 }}>Select Existing or Create New</span>
          <select
            value={activeKey()}
            onChange={e => setActiveKey(e.currentTarget.value)}
            style={{ padding: '0.45rem 0.65rem', 'background-color': 'var(--panel-bg,#1b1d22)', color: 'var(--text,#e6e6e6)', 'border-radius': '6px', border: '1px solid var(--border,#333)' }}
          >
            <option value="__new__">+ New Subclass</option>
            <For each={homebrewList()}>{(s: any) => <option value={storageKeyFor(s)}>{s.parentClass} / {s.name}</option>}</For>
          </select>
        </label>
        <Show when={activeKey() !== '__new__'}>
          <div style={{ 'font-size': '0.75rem', color: 'var(--text-subtle,#999)' }}>
            Editing existing subclass. {(isModifiedFlag() || userDirty()) ? 'Unsaved changes' : 'No changes yet.'}
          </div>
        </Show>
      </div>
      <FlatCard icon="identity_platform" headerName="Identity" startOpen={true}>
        <ClassSelection form={SubclassFormGroup as any} allClassNames={allClassNames} getSubclassLevels={getSubclassLevels} setToAddFeatureLevel={setToAddFeatureLevel} updateParamsIfReady={updateParamsIfReady} />
        <CoreFields form={SubclassFormGroup as any} updateParamsIfReady={updateParamsIfReady} onNameInput={markDirty} onDescriptionInput={markDirty} />
      </FlatCard>
      <Show when={SubclassFormGroup.get('parent_class') && SubclassFormGroup.get('name')}>
        <FlatCard icon="star" headerName="Features">
          <FeaturesSection 
            form={SubclassFormGroup as any} 
            getSubclassLevels={getSubclassLevels} 
            toAddFeatureLevel={toAddFeatureLevel} 
            setToAddFeatureLevel={setToAddFeatureLevel} 
            getLevelUpFeatures={getLevelUpFeatures} 
            setEditIndex={setEditIndex}
            getEditIndex={editIndex} />
        </FlatCard>
        <FlatCard icon="equalizer" headerName="Spellcasting">
          <SpellcastingSection
            form={SubclassFormGroup as any}
            toAddKnownLevel={toAddKnownLevel}
            setToAddKnownLevel={setToAddKnownLevel}
            toAddKnownAmount={toAddKnownAmount}
            setToAddKnownAmount={setToAddKnownAmount}
            mergedCastingLevels={mergedCastingLevels as any}
            allSpells={allSpells}
            getAddNumberAccent={getAddNumberAccent}
            getNumberArray={getNumberArray}
            onSave={persistSubclass}
            canSave={createMemo(()=> canAddSubclass() && (activeKey()==='__new__' ? true : (isModifiedFlag() || userDirty())))}
            setSubclassSpells={(fn)=>{
              const next = fn(((SubclassFormGroup.get('subclassSpells') as Spell[])||[]));
              SubclassFormGroup.set('subclassSpells', next as any);
            }}
            setSpellcastingInfo={(fn)=>{
              const next = fn(((SubclassFormGroup.get('spellcastingInfo') as any[])||[]));
              SubclassFormGroup.set('spellcastingInfo', next as any);
            }}
            setSpellsKnownPerLevel={(fn)=>{
              const next = fn(((SubclassFormGroup.get('spellsKnownPerLevel') as any[])||[]));
              SubclassFormGroup.set('spellsKnownPerLevel', next as any);
            }}
          />
        </FlatCard>
        <FlatCard icon="save" headerName="save" alwaysOpen>
          <div style={{ display: 'flex', 'gap': '0.75rem', 'margin-top': '0.75rem', 'flex-wrap':'wrap' }}>
            <button
              disabled={!canAddSubclass() || (activeKey() !== '__new__' && !(isModifiedFlag() || userDirty()))}
              onClick={persistSubclass}
              style={{ padding: '0.55rem 0.9rem', 'background-color':'var(--accent,#3a6ff7)', color:'#fff', border:'none', 'border-radius':'6px', cursor:'pointer', 'font-weight':600 }}
            >{activeKey()==='__new__' ? 'Save Subclass' : 'Update Subclass'}</button>
            <Show when={activeKey() !== '__new__' && (isModifiedFlag() || userDirty())}>
              <button
                onClick={()=> loadSubclassForEdit(activeKey())}
                style={{ padding: '0.55rem 0.9rem', 'background-color':'#333', color:'#fff', border:'1px solid #444', 'border-radius':'6px', cursor:'pointer' }}
              >Reset Changes</button>
            </Show>
            <Show when={isModifiedFlag() || userDirty()}><span style={{ 'align-self': 'center', 'font-size':'0.7rem', 'letter-spacing': '0.5px', 'background':'#444', color:'#fff', padding:'0.25rem 0.5rem', 'border-radius':'4px' }}>Modified</span></Show>
          </div>
        </FlatCard>
      </Show>
    </Body>
  );
}
export default Subclasses;