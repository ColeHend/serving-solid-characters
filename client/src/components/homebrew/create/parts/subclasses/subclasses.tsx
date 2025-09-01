import { Component, createMemo, createSignal, onMount, batch, Show } from "solid-js";
import { homebrewManager, getAddNumberAccent, getNumberArray, getSpellcastingDictionary, useDnDClasses } from "../../../../../shared";
import { Subclass as OldSubclass } from "../../../../../models/old/class.model";
import { useSearchParams } from "@solidjs/router";
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

export interface FeatureDetailLevel extends FeatureDetail {
  info: {
    level: number;
    [key: string]: any;
  }
}

const Subclasses: Component = () => {
  // URL params
  const [searchParam, setSearchParam] = useSearchParams();

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
    const className = subclassClass().toLowerCase();
    const [ currentClass ] = allClasses().filter((c)=> c.name?.toLowerCase() === className?.toLowerCase());
				
        
    if (!!currentClass && !!currentClass.classMetadata?.subclassLevels?.length) {
      return currentClass.classMetadata.subclassLevels.map(x=>`${x}`);
    } else {
      switch (className) {
      case 'cleric':
        return ["1", "2", "6", "8", "17"];
      case 'druid':
      case 'wizard':
        return ["2", "6", "10", "14"];
      case 'barbarian':
        return ["3", "6", "10", "14"];
      case 'monk':
        return ["3", "6", "11", "17"];
      case 'bard':
        return ["3", "6", "14"];
      case 'sorcerer':
      case 'warlock':
        return ["1", "6", "14", "18"];
      case 'fighter':
        return ["3", "7", "10", "15", "18"];
      case 'paladin':
        return ["3", "7", "15", "20"];
      case 'ranger':
        return ["3", "7", "11", "15"];
      case 'rogue':
        return ["3", "9", "13", "17"];
      case 'forgemaster':
        return ["3", "7", "11", "15", "20"];
      default:
        return [];
      }
    }
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

  const canAddSubclass = createMemo(() => {
    return !SubclassFormGroup.get('parent_class') || !SubclassFormGroup.get('name');
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
      const stored = homebrewManager.subclasses().find(s => s.parent_class?.toLowerCase() === searchParam.name!.toLowerCase() && s.name.toLowerCase() === searchParam.subclass!.toLowerCase());
      if (stored) {
        batch(() => {
          SubclassFormGroup.set('parent_class', stored.parent_class as any);
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
      // Legacy hydration fallback
      const [cls] = allClasses().filter(c => c.name.toLowerCase() === searchParam.name!.toLowerCase());
      if (cls) {
        const [sc] = cls.subclasses.filter(s => s.name.toLowerCase() === searchParam.subclass!.toLowerCase());
        if (sc) {
          batch(() => {
            SubclassFormGroup.set('parent_class', cls.name as any);
            SubclassFormGroup.set('name', sc.name as any);
            SubclassFormGroup.set('description', (sc.desc || []).join('\n') as any);
            // Legacy features -> convert old Feature<T,K> with value -> FeatureDetailLevel using description
            const legacyFeats = (sc.features || []).map((f: any) => ({
              name: f.name,
              description: f.value ?? f.description ?? '',
              info: { level: f.info?.level ?? 0 }
            }));
            SubclassFormGroup.set('features', legacyFeats as any);
            SubclassFormGroup.set('subclassSpells', (sc.spells || []) as any);
            if (sc.spellcasting) {
              SubclassFormGroup.set('hasCasting', true as any);
              SubclassFormGroup.set('casterType', (sc.spellcasting.casterType || '') as any);
              SubclassFormGroup.set('castingModifier', (sc.spellcasting.spellcastingAbility as unknown as string) as any);
              SubclassFormGroup.set('spellsKnownCalc', (sc.spellcasting.spellsKnownCalc as SpellsKnown ?? SpellsKnown.None) as any);
              SubclassFormGroup.set('halfCasterRoundUp', (!!sc.spellcasting.spellsKnownRoundup) as any);
              SubclassFormGroup.set('spellcastingInfo', (sc.spellcasting?.info || []) as any);
              const custom = (sc.spellcasting.castingLevels || []).map(x => ({ level: x.level, amount: (x as any).spellcasting?.spells_known })).filter(x => typeof x.amount === 'number');
              if (custom.length) SubclassFormGroup.set('spellsKnownPerLevel', custom as any);
            }
          });
        }
      }
    }
  });

  // Helpers to mutate features
  const updateParamsIfReady = () => {
    if (SubclassFormGroup.get('parent_class') && SubclassFormGroup.get('name')) {
      setSearchParam({ name: subclassClass(), subclass: subclassName() });
    }
  };

  return (
    <Body>
      <h1>Subclass Homebrew</h1>
      <ClassSelection form={SubclassFormGroup as any} allClassNames={allClassNames} getSubclassLevels={getSubclassLevels} setToAddFeatureLevel={setToAddFeatureLevel} updateParamsIfReady={updateParamsIfReady} />
      <CoreFields form={SubclassFormGroup as any} updateParamsIfReady={updateParamsIfReady} />
      <Show when={SubclassFormGroup.get('parent_class') && SubclassFormGroup.get('name')}>
        <FeaturesSection 
          form={SubclassFormGroup as any} 
          getSubclassLevels={getSubclassLevels} 
          toAddFeatureLevel={toAddFeatureLevel} 
          setToAddFeatureLevel={setToAddFeatureLevel} 
          getLevelUpFeatures={getLevelUpFeatures} 
          setEditIndex={setEditIndex}
          getEditIndex={editIndex} />
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
          onSave={() => {
            const dataSubclass = toDataSubclass();
            const existing = homebrewManager.subclasses().find(s => s.name.toLowerCase() === dataSubclass.name.toLowerCase() && s.parent_class.toLowerCase() === dataSubclass.parent_class.toLowerCase());
            if (existing) homebrewManager.updateSubclass(dataSubclass as any); else homebrewManager.addSubclass(dataSubclass as any);
            clearValues();
          }}
          canSave={canAddSubclass}
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
      </Show>
    </Body>
  );
}
export default Subclasses;