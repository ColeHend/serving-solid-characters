import { Component, createSignal, createEffect, onMount, onCleanup } from "solid-js";
import { useSearchParams } from "@solidjs/router";
import { addSnackbar, Button, Container, Form, FormGroup, Validators } from "coles-solid-library";
import { DeployedCode, HomeRepairService, IdentityPlatform, Save, Star } from "coles-solid-library/icons";
import { Proficiencies } from "./proficiencies";
import { toClass5E } from "./classAdapter";
// Use unified homebrewManager so new classes immediately appear in homebrew views
import { homebrewManager } from "../../../../../shared/customHooks/homebrewManager";
import { FeatureTable } from "./featureTable";
import { Stats } from "./stats";
import { Items } from "./items";
import { Header } from "./header";
import styles from './classes.module.scss';
import { CastingStat, Stat } from "../../../../../shared/models/stats";
import { LevelEntity, Subclass } from "../../../../../models/old/class.model";
import { CasterType, Choice, FeatureTypes } from "../../../../../models/old/core.model";
import { SpellsKnown } from "../../../../../shared/models/casting";
import { useDnDClasses } from "../../../../../shared/customHooks/dndInfo/info/all/classes";
import { Class5E } from "../../../../../models/data/classes";
import { beutifyChip } from "../../../../../shared";
import { FlatCard } from "../../../../../shared/components/flatCard/flatCard";

interface ClassSpecificValue {
  key: string;
  value: string;
};

export interface ClassForm {
  name: string;
  description: string;
  hitDie: number;
  primaryStat: Stat[]; // now multi-select
  savingThrows: Stat[];
  armorProficiencies: string[];
  weaponProficiencies: string[];
  toolProficiencies: string[];
  armorStart: string[];
  weaponStart: string[];
  itemStart: string[];
  armorProfChoices: Choice<string>[];
  weaponProfChoices: Choice<string>[];
  toolProfChoices: Choice<string>[];
  skills: Stat[];
  skillChoiceNum: number;
  skillChoices: string[];
  startingEquipment: string[];
  spellCasting: boolean;
  castingStat?: CastingStat;
  casterType?: CasterType;
  classSpecificValues?: ClassSpecificValue[];
  subclasses?: Subclass[];
  metadataSubclassLevels?: number[];
  metadataSubclassName?: string;
  metadataSubclassPos?: 'before' | 'after' | string;
  classLevels: LevelEntity[];
  spellcastName: string;
  spellsKnownCalc: SpellsKnown;
  spellcastAbility: CastingStat;
  spellsKnownRoundup?: boolean;
  spellsInfo: string;
  spellsLevel: number;
  hasCantrips: boolean;
}

export const Classes: Component = () => {
  // SRD classes (depends on userSettings().dndSystem: 2014 | 2024 | both)
  const srdClasses = useDnDClasses();
  const [searchParams] = useSearchParams();

  const defaultClassLevels: LevelEntity[] = Array.from({ length: 20 }, (_, i) => ({
    level: i + 1,
    features: [{
      name: `Feature ${i + 1}`,
      value: 'Description of the feature',
      metadata: {

      },
      info: {
        className: '',
        subclassName: '',
        level: i + 1,
        type: FeatureTypes.Class,
        other: '',
      }
    }],
    info: {
      className: '',
      subclassName: '',
      level: i + 1,
      type: FeatureTypes.Class,
      other: '',
    },
    profBonus: i < 5 ? 2 : i < 9 ? 3 : i < 13 ? 4 : i < 17 ? 5 : 6,
    classSpecific: {},
  }));

  // const classLevels = new FormArray<LevelEntity[]>([[], []], defaultClassLevels);

  const ClassFormGroup = new FormGroup<ClassForm>({
    name: ['', [Validators.Required]],
    description: ['', []],
    hitDie: [undefined, [Validators.Required]],
    primaryStat: [[], [Validators.Required]],
    savingThrows: [[], []],
    armorProficiencies: [[], []],
    weaponProficiencies: [[], []],
    toolProficiencies: [[], []],
    armorStart: [[], []],
    weaponStart: [[], []],
    itemStart: [[], []],
    armorProfChoices: [[], []],
    weaponProfChoices: [[], []],
    toolProfChoices: [[], []],
    skills: [[], []],
    skillChoiceNum: [undefined, []],
    skillChoices: [[], []],
    startingEquipment: [[], []],
    spellCasting: [false, []],
    castingStat: [undefined, []],
    casterType: [CasterType.Full, []],
    classSpecificValues: [[], []],
    subclasses: [[], []],
    metadataSubclassLevels: [[], []],
    metadataSubclassName: ['', []],
    metadataSubclassPos: ['before', []],
    classLevels: [[], []],
    spellcastName: ['', []],
    spellsKnownCalc: [SpellsKnown.Number, []],
    spellcastAbility: [CastingStat.WIS, []],
    spellsKnownRoundup: [false, []],
    spellsInfo: ['', []],
    spellsLevel: [1, []],    
    hasCantrips: [false, []]
  });
  const [resetNonce, setResetNonce] = createSignal(0);
  // Typed setter: keeps key/value checked against ClassForm while tolerating the
  // intentionally-empty (`undefined`) reset values that the form holds before input.
  const setField = <K extends keyof ClassForm>(key: K, value: ClassForm[K] | undefined) =>
    ClassFormGroup.set(key, value as ClassForm[K]);
  const resetForm = () => {
    // Clear values succinctly (no reset API on FormGroup yet)
    // Reapply primitives
    setField('name', '');
    setField('description', '');
    setField('hitDie', undefined);
    setField('primaryStat', []);
    setField('savingThrows', []);
    setField('armorProficiencies', []);
    setField('weaponProficiencies', []);
    setField('toolProficiencies', []);
    setField('armorStart', []);
    setField('weaponStart', []);
    setField('itemStart', []);
    setField('armorProfChoices', []);
    setField('weaponProfChoices', []);
    setField('toolProfChoices', []);
    setField('skills', []);
    setField('skillChoiceNum', undefined);
    setField('skillChoices', []);
    setField('startingEquipment', []);
    setField('spellCasting', false);
    setField('castingStat', undefined);
    setField('casterType', CasterType.Full);
    setField('classSpecificValues', []);
    setField('subclasses', []);
    setField('metadataSubclassLevels', []);
    setField('metadataSubclassName', '');
    setField('metadataSubclassPos', 'before');
    setField('classLevels', defaultClassLevels);
    setField('spellcastName', '');
    setField('spellsKnownCalc', SpellsKnown.Number);
    setField('spellcastAbility', CastingStat.WIS);
    setField('spellsKnownRoundup', false);
    setField('spellsInfo', '');
    setField('spellsLevel', 1);
    setField('hasCantrips', false);
    setClassLevels(defaultClassLevels);
    setProfStore({});
    setResetNonce(n => n + 1);
    ClassFormGroup.reset();
  };

  const toFormSpecific = (classSpecific: Class5E['classSpecific'], level: number): Record<string, string> => {
    const result: Record<string, string> = {};
    if (!classSpecific) return result;
    Object.keys(classSpecific).forEach(key => {
      const levelMap = classSpecific[key];
      if (levelMap && levelMap[level] !== undefined) {
        result[beutifyChip(key)] = levelMap[level];
      }
    });
    return result;
  }

  const prefillForm = (raw: any) => {
    if (!raw) return;
    const cls = raw as Class5E; 
    console.log('Prefilling form with class', cls);
    
    // Basic fields
    setField('name', cls.name || '');
    // No description field in Class5E currently; leave blank
    const dieNum = typeof cls.hitDie === 'string' ? parseInt(cls.hitDie.replace(/^[dD]/, '') || '0') : (cls as any).hitDie || 0;
    setField('hitDie', dieNum);
    // Map string stats (e.g. 'INT') to Stat enum values expected by form controls
    const statMap: Record<string, Stat> = { 'STR': Stat.STR, 'DEX': Stat.DEX, 'CON': Stat.CON, 'INT': Stat.INT, 'WIS': Stat.WIS, 'CHA': Stat.CHA };
    // Primary ability can be a comma separated list in source -> map each to Stat enum
    const primaryRaw = (cls.primaryAbility || (cls as any).primaryAbility || '').toUpperCase();
    if (primaryRaw) {
      const parts: string[] = primaryRaw.split(',').map((p: string) => p.trim().slice(0, 3)).filter(Boolean);
      const mapped: Stat[] = parts.map((p: string) => statMap[p]).filter((v: Stat | undefined): v is Stat => v !== undefined);
      console.log('Mapped primary stats', parts, '->', mapped);
      
      if (mapped.length) setField('primaryStat', mapped);
    }
    const saves = cls.savingThrows || (cls as any).savingThrows || [];
    const savingThrowEnums = saves.map(st => statMap[st.toUpperCase()] ?? st).filter(v => v !== undefined);
    setField('savingThrows', savingThrowEnums);

    // Proficiencies
    const profs = cls.proficiencies || { armor: [], weapons: [], tools: [], skills: [] };
    // Update internal profStore (used on submit) AND visible form arrays (chips render from formGroup)
    setProfStore({
      armor: profs.armor || [],
      weapons: profs.weapons || [],
      tools: profs.tools || []
    });
    setField('armorProficiencies', profs.armor || []);
    setField('weaponProficiencies', profs.weapons || []);
    setField('toolProficiencies', profs.tools || []);
    // skills source is string[] but the form field is Stat[]; cast remains intentional
    ClassFormGroup.set('skills', (profs.skills || []) as any);

    // Starting equipment (attempt to pull names)
  const startingEquipNames = (cls.startingEquipment || []).map((e: any) => e?.item?.name || e?.name || '').filter(Boolean);
  // The UI displays weaponStart / armorStart / itemStart; without item classification, default all to itemStart
  setField('itemStart', startingEquipNames);
  // Keep legacy field in case other code reads it
  setField('startingEquipment', startingEquipNames);

    // Start choices (optional structured starting equipment / proficiency choices)
    // Class5E.startChoices?: { weapon?: string; armor?: string; tool?: string; skill?: string[]; equipment?: string; }
    // Map single-value equipment choices into respective start arrays so they render as chips.
    const sc: any = (cls as any).startChoices || (cls as any).start_choices; // tolerate snake_case just in case
    if (sc) {
      if (sc.weapon) {
        const current = ClassFormGroup.get('weaponStart') || [];
        if (!current.includes(sc.weapon)) current.push(sc.weapon);
        setField('weaponStart', current);
      }
      if (sc.armor) {
        const current = ClassFormGroup.get('armorStart') || [];
        if (!current.includes(sc.armor)) current.push(sc.armor);
        setField('armorStart', current);
      }
      if (sc.tool) {
        const current = ClassFormGroup.get('itemStart') || [];
        if (!current.includes(sc.tool)) current.push(sc.tool);
        setField('itemStart', current);
      }
      // If sc.equipment refers to a choice key, we'll handle it in the unified choices prefill below.
      if (Array.isArray(sc.skill) && sc.skill.length) {
        // Treat as a skill choice list: user can choose "skillChoiceNum" from these options.
        // If existing skill choices are empty, populate directly; else merge uniquely.
        const existingChoices = ClassFormGroup.get('skillChoices') || [];
        const merged = Array.from(new Set([...existingChoices, ...sc.skill]));
        setField('skillChoices', merged);
        // If no explicit number yet, default to 1 or the length if smaller than current value.
        const currentNum = ClassFormGroup.get('skillChoiceNum');
        if (currentNum === undefined || currentNum === null) {
          setField('skillChoiceNum', Math.min(merged.length, 1));
        }
      }
    }

    // ---- Prefill explicit choices (cls.choices) & link via starting_equipment.optionKeys ----
    try {
      const allChoices: Record<string, any> = (cls as any).choices || {};
      if (allChoices && Object.keys(allChoices).length) {
        const ensurePush = (key: 'weaponProfChoices' | 'armorProfChoices' | 'toolProfChoices', choose: number, options: string[]) => {
          if (!options?.length) return;
            const arr = (ClassFormGroup.get(key) as any[]) || [];
            const exists = arr.some((c: any) => c.choose === choose && options.every(o => c.choices.includes(o)));
            if (!exists) {
              arr.push({ type: FeatureTypes.Item, choose, choices: [...options] });
              setField(key, arr);
            }
        };
        // Directly map all choices regardless of starting equipment reference (so editing an existing class shows everything)
        Object.entries(allChoices).forEach(([ckey, cval]: any) => {
          const choose = cval.amount ?? cval.Amount ?? 0;
          const options: string[] = cval.options || cval.Options || [];
          if (ckey === 'skill_proficiencies') {
            // Merge skill options
            const existing = ClassFormGroup.get('skillChoices') || [];
            const merged = Array.from(new Set([...existing, ...options]));
            setField('skillChoices', merged);
            // Only set if not previously set by startChoices
            const currentNum = ClassFormGroup.get('skillChoiceNum');
            if (!currentNum && choose > 0) {
              setField('skillChoiceNum', choose);
            }
          } else if (ckey.startsWith('weapon_prof_')) {
            ensurePush('weaponProfChoices', choose, options);
          } else if (ckey.startsWith('armor_prof_')) {
            ensurePush('armorProfChoices', choose, options);
          } else if (ckey.startsWith('tool_prof_')) {
            ensurePush('toolProfChoices', choose, options);
          } else if (sc && sc.equipment === ckey) {
            // Equipment choice referenced via startChoices.equipment: treat as generic tool/item choice bucket
            ensurePush('toolProfChoices', choose, options);
          }
        });

        // Additionally, walk starting_equipment.optionKeys to make sure referenced choices are present
        (cls.startingEquipment || []).forEach((se: any) => {
          (se?.optionKeys || []).forEach((k: string) => {
            const cval = allChoices[k];
            if (!cval) return;
            const choose = cval.amount ?? cval.Amount ?? 0;
            const options: string[] = cval.options || cval.Options || [];
            if (k === 'skill_proficiencies') {
              const existing = ClassFormGroup.get('skillChoices') || [];
              const merged = Array.from(new Set([...existing, ...options]));
              setField('skillChoices', merged);
              const currentNum = ClassFormGroup.get('skillChoiceNum');
              if (!currentNum && choose > 0) setField('skillChoiceNum', choose);
            } else if (k.startsWith('weapon_prof_')) {
              ensurePush('weaponProfChoices', choose, options);
            } else if (k.startsWith('armor_prof_')) {
              ensurePush('armorProfChoices', choose, options);
            } else if (k.startsWith('tool_prof_')) {
              ensurePush('toolProfChoices', choose, options);
            } else {
              // Fallback: treat unspecified key as tool/item choice for visibility
              ensurePush('toolProfChoices', choose, options);
            }
          });
        });
      }
    } catch (err) {
      console.warn('Choice prefill failure', err);
    }

    // Features -> LevelEntity[]
    const levelEntities: LevelEntity[] = Array.from({ length: 20 }, (_, i) => {
      const level = i + 1;
      const feats = (cls.features?.[level] || []).map((f: any) => ({
        name: f.name,
        value: f.description || f.value || '',
        metadata: {},
        info: {
          className: cls.name,
          subclassName: '',
          level,
          type: FeatureTypes.Class,
          other: ''
        }
      }));
      return {
        level,
        features: feats,
        info: {
          className: cls.name,
          subclassName: '',
          level,
          type: FeatureTypes.Class,
          other: ''
        },
        profBonus: level < 5 ? 2 : level < 9 ? 3 : level < 13 ? 4 : level < 17 ? 5 : 6,
        classSpecific: (toFormSpecific(cls.classSpecific, level) || {}) as any
      } as LevelEntity;
    });
    setClassLevels(levelEntities);
    setField('classLevels', levelEntities);

    // Spellcasting (optional)
    if (cls.spellcasting) {
      setField('spellCasting', true);
      setField('castingStat', (cls.spellcasting as any).spellcasting_ability);
      setField('spellcastAbility', (cls.spellcasting as any).spellcasting_ability);
      setField('casterType', (cls.spellcasting as any).caster_type || CasterType.Full);
    } else {
      setField('spellCasting', false);
      setField('castingStat', undefined);
      setField('spellcastAbility', undefined);
      setField('casterType', CasterType.None);
    }

    setResetNonce(n => n + 1);
  };

  // Reactive prefill: wait until both search param and homebrew classes are available
  const [prefilled, setPrefilled] = createSignal(false);
  createEffect(() => {
    if (prefilled()) return; 
    let className: string;
    if (typeof searchParams.name === "string" ) {
      className = searchParams.name?.toLowerCase();
    } else {
      className = searchParams.name?.join(" ").toLowerCase() || "";
    }
    
    if (!className) return;
    const hb = homebrewManager.classes();
    const srd = srdClasses();
    // Wait for at least one source to load
    if ((!hb || hb.length === 0) && (!srd || srd.length === 0)) return;
    const existingClass = srd.find(c => (c.name || '').toLowerCase() === className) || hb.find(c => (c.name || '').toLowerCase() === className);
    if (existingClass) {
      prefillForm(existingClass);
      setPrefilled(true);
    }
  });

  const onSubmit = async (data: ClassForm) => {
    addSnackbar({ message: 'Saving class...', severity: 'info' });
    const fullData: ClassForm = {
      ...data,
      weaponProficiencies: profStore().weapons || [],
      armorProficiencies: profStore().armor || [],
      toolProficiencies: profStore().tools || [],
      classLevels: classLevels(),
    };
    const adapted = toClass5E(fullData, profStore(), classLevels());
    const param = typeof searchParams.name === "string" ? searchParams.name : searchParams.name?.join(" ") || "";
    // Simple duplicate guard
    if (homebrewManager.classes().some(c => c.name.toLowerCase() === (adapted.name || '').toLowerCase() && param?.toLowerCase() !== (adapted.name || '').toLowerCase())) {
      addSnackbar({ message: 'Class name already exists', severity: 'warning' });
      return;
    }
    const exists = homebrewManager.classes().some(c => c.name.toLowerCase() === (adapted.name || '').toLowerCase());
    if (exists) {
      await homebrewManager.updateClass(adapted as any);
    } else {
      await homebrewManager.addClass(adapted as any);
    }
    addSnackbar({ message: 'Class saved', severity: 'success' });
    resetForm();
  };
  ClassFormGroup.set('classLevels', defaultClassLevels);
  const [classLevels, setClassLevels] = createSignal<LevelEntity[]>(defaultClassLevels);
  const [profStore, setProfStore] = createSignal<ProfStore>({});
  // Test instrumentation: aggregate reactive snapshot for unit tests
  const [debugSnapshot, setDebugSnapshot] = createSignal({
    primaryStat: '', savingThrows: '', armor: '', weapon: '', tool: '', itemStart: ''
  });
  createEffect(() => {
    // Update snapshot whenever underlying fields change
  const primArr = ClassFormGroup.get('primaryStat') || [];
  const prim = primArr.join(',');
    const saves = (ClassFormGroup.get('savingThrows') ?? []).join(',');
    const armor = (ClassFormGroup.get('armorProficiencies') ?? []).join('|');
    const weapon = (ClassFormGroup.get('weaponProficiencies') ?? []).join('|');
    const tool = (ClassFormGroup.get('toolProficiencies') ?? []).join('|');
    const itemStart = (ClassFormGroup.get('itemStart') ?? []).join('|');
    setDebugSnapshot({ primaryStat: prim, savingThrows: saves, armor, weapon, tool, itemStart });
  });

  onMount(()=>{
    document.body.classList.add('classes-bg');
  })

  onCleanup(()=>{
    document.body.classList.remove('classes-bg');
  })

  return (
    <Container
      theme="surface"
      class={`${styles.container}`}
      data-testid="class-form"
      data-primary-stat={debugSnapshot().primaryStat}
      data-saving-throws={debugSnapshot().savingThrows}
      data-armor-profs={debugSnapshot().armor}
      data-weapon-profs={debugSnapshot().weapon}
      data-tool-profs={debugSnapshot().tool}
      data-item-start={debugSnapshot().itemStart}
    >
      <h2>Class Creator</h2>
      <Form data={ClassFormGroup} onSubmit={onSubmit}>
        <div >
          <FlatCard icon={IdentityPlatform} headerName="Identity" startOpen={true} transparent>
            <div class={styles.body}>
              <Header resetNonce={resetNonce()} />
              <Stats />
            </div>
          </FlatCard>
          <FlatCard icon={DeployedCode} headerName="Proficiencies" transparent>
            <Proficiencies setProfStore={setProfStore} formGroup={ClassFormGroup} />
          </FlatCard>
          <FlatCard icon={HomeRepairService} headerName="Starting Equipment" transparent>
            <Items formGroup={ClassFormGroup} />
          </FlatCard>
          <FlatCard icon={Star} headerName="Features" transparent>
            <FeatureTable tableData={classLevels} setTableData={setClassLevels} formGroup={ClassFormGroup} />
          </FlatCard>
        </div>
        <FlatCard
          icon={Save}
          headerName="Save"
          alwaysOpen
          transparent
        >
          <Button type="submit" aria-label="Save Class">
            Submit
          </Button>
        </FlatCard>
      </Form>
    </Container>
  );
};

export interface ProfStore {
  weapons?: string[];
  armor?: string[];
  tools?: string[];
}