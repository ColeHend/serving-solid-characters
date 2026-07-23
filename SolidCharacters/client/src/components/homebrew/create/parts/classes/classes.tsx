import { Component, Match, Show, Switch, createEffect, createSignal, onCleanup, onMount } from "solid-js";
import { createStore, unwrap } from "solid-js/store";
import { useNavigate, useSearchParams } from "@solidjs/router";
import { Button, Container, FormGroup, Validators, addSnackbar } from "coles-solid-library";
import { toClass5E } from "./classAdapter";
// Use unified homebrewManager so new classes immediately appear in homebrew views
import { homebrewManager } from "../../../../../shared/customHooks/homebrewManager";
import { useDnDClasses } from "../../../../../shared/customHooks/dndInfo/info/all/classes";
import { useDnDItems } from "../../../../../shared/customHooks/dndInfo/info/all/items";
import { defaultEditionKey, editionToLegacy } from "../../../../../shared/customHooks/dndInfo/info/edition";
import { Class5E } from "../../../../../models/data/classes";
import { FeatureDetail } from "../../../../../models/generated";
import { createNewId } from "../../../../../shared/customHooks/utility/tools/idGen";
import { Stat } from "../../../../../shared/models/stats";
import { CasterType, FeatureTypes } from "../../../../../models/old/core.model";
import { SpellsKnown } from "../../../../../shared/models/casting";
import { FeaturesPopup } from "../../../Parts/featuresPopup/featuresPopup";
import {
  ClassForm,
  DRAFT_FORM_KEYS,
  ProfStore,
  STEP_META,
  WizardLevels,
  WizardStep,
  buildLevelEntities,
  draftKey,
  draftStorage,
  emptyWizardLevels,
  hydrateDraft,
  parseDraft,
  serializeDraft,
  stepStatus,
} from "./wizard/wizard.shared";
import { parseOptionString } from "./wizard/equipment.shared";
import { Stepper } from "./wizard/stepper";
import { WizardFooter } from "./wizard/wizardFooter";
import { StepIdentity } from "./wizard/stepIdentity";
import { StepProficiencies } from "./wizard/stepProficiencies";
import { StepEquipment } from "./wizard/stepEquipment";
import { StepFeatures } from "./wizard/stepFeatures";
import { StepSpellcasting } from "./wizard/stepSpellcasting";
import { StepReview } from "./wizard/stepReview";
import styles from "./wizard/classesWizard.module.scss";

// Back-compat re-exports: the form/adapter types now live with the wizard.
export type { ClassForm, ProfStore } from "./wizard/wizard.shared";

type ResumeState = 'none' | 'pending' | 'resumed' | 'discarded';

export const Classes: Component = () => {
  // SRD classes (depends on userSettings().dndSystem: 2014 | 2024 | both)
  const srdClasses = useDnDClasses();
  // Item names for the edit-load equipment parser; loads async, so an unhydrated list just
  // means bare names classify as custom chips (still lossless — see equipment.shared.ts).
  const dndItems = useDnDItems();
  const itemNameMap = () => new Map(dndItems().map(i => [i.name.toLowerCase(), i.name]));
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const ClassFormGroup = new FormGroup<ClassForm>({
    name: ['', [Validators.Required]],
    description: ['', []],
    source: ['', []],
    legacy: [editionToLegacy(defaultEditionKey()), []],
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
    equipmentChoices: [[], []],
    spellCasting: [false, []],
    castingStat: [undefined, []],
    // undefined until the user picks a caster card — selecting "None" is an explicit answer
    casterType: [undefined, []],
    classSpecificValues: [[], []],
    subclasses: [[], []],
    metadataSubclassLevels: [[], []],
    metadataSubclassName: ['', []],
    metadataSubclassPos: ['before', []],
    classLevels: [[], []],
    spellcastName: ['', []],
    spellsKnownCalc: [SpellsKnown.Number, []],
    spellsKnownMode: ['fixed', []],
    spellcastAbility: [undefined, []],
    spellsKnownRoundup: [false, []],
    spellsInfo: ['', []],
    spellsLevel: [1, []],
    hasCantrips: [false, []]
  });

  const setField = <K extends keyof ClassForm>(key: K, value: ClassForm[K] | undefined) =>
    ClassFormGroup.set(key, value as ClassForm[K]);

  const [step, setStep] = createSignal<WizardStep>(WizardStep.Identity);
  const [levels, setLevels] = createStore<WizardLevels>(emptyWizardLevels());

  const editName = () => {
    if (typeof searchParams.name === 'string') return searchParams.name;
    return searchParams.name?.join(' ') ?? '';
  };
  const storageKey = () => draftKey(editName());

  // ---------------------------------------------------------------------------
  // Prefill (?name= edit mode)

  const toStoreSpecific = (classSpecific: Class5E['classSpecific']): WizardLevels['classSpecific'] => {
    const result: WizardLevels['classSpecific'] = {};
    if (!classSpecific) return result;
    Object.keys(classSpecific).forEach(key => {
      result[key] = { ...classSpecific[key] };
    });
    return result;
  };

  const prefillForm = (raw: any) => {
    if (!raw) return;
    const cls = raw as Class5E;

    // Basic fields
    setField('name', cls.name || '');
    setField('source', cls.source ?? '');
    setField('legacy', cls.legacy);
    // Persisted / SRD class data is snake_case (see toClass5E in classAdapter.ts); fall back to camelCase
    const hitDieRaw = (cls as any).hit_die ?? cls.hitDie;
    const dieNum = typeof hitDieRaw === 'string' ? parseInt(hitDieRaw.replace(/^[dD]/, '') || '0') : hitDieRaw || 0;
    setField('hitDie', dieNum);
    const statMap: Record<string, Stat> = { 'STR': Stat.STR, 'DEX': Stat.DEX, 'CON': Stat.CON, 'INT': Stat.INT, 'WIS': Stat.WIS, 'CHA': Stat.CHA };
    const primaryRaw = ((cls as any).primary_ability || cls.primaryAbility || '').toUpperCase();
    if (primaryRaw) {
      const parts: string[] = primaryRaw.split(',').map((p: string) => p.trim().slice(0, 3)).filter(Boolean);
      const mapped: Stat[] = parts.map((p: string) => statMap[p]).filter((v: Stat | undefined): v is Stat => v !== undefined);
      if (mapped.length) setField('primaryStat', mapped);
    }
    const saves: string[] = (cls as any).saving_throws || cls.savingThrows || [];
    const savingThrowEnums = saves.map(st => statMap[st.toUpperCase()] ?? st).filter(v => v !== undefined);
    setField('savingThrows', savingThrowEnums as Stat[]);

    // Proficiencies (chips render straight from the form arrays)
    const profs = cls.proficiencies || { armor: [], weapons: [], tools: [], skills: [] };
    setField('armorProficiencies', profs.armor || []);
    setField('weaponProficiencies', profs.weapons || []);
    setField('toolProficiencies', profs.tools || []);
    // skills source is string[] but the form field is Stat[]; cast remains intentional
    ClassFormGroup.set('skills', (profs.skills || []) as any);

    // Starting equipment (attempt to pull names)
    const startingEquip: any[] = (cls as any).starting_equipment || cls.startingEquipment || [];
    const startingEquipNames = startingEquip.flatMap((e: any) =>
      Array.isArray(e?.items) ? e.items.map((i: any) => i?.name ?? i) : [e?.item?.name || e?.name]
    ).filter(Boolean);
    setField('itemStart', startingEquipNames);
    // Keep legacy field in case other code reads it
    setField('startingEquipment', startingEquipNames);

    // Start choices (optional structured starting equipment / proficiency choices)
    const sc: any = (cls as any).startChoices || (cls as any).start_choices;
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
      if (Array.isArray(sc.skill) && sc.skill.length) {
        const existingChoices = ClassFormGroup.get('skillChoices') || [];
        const merged = Array.from(new Set([...existingChoices, ...sc.skill]));
        setField('skillChoices', merged);
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
        const equipmentChoices: ClassForm['equipmentChoices'] = [];
        Object.entries(allChoices).forEach(([ckey, cval]: any) => {
          const choose = cval.amount ?? cval.Amount ?? 0;
          const options: string[] = cval.options || cval.Options || [];
          if (ckey === 'skill_proficiencies') {
            const existing = ClassFormGroup.get('skillChoices') || [];
            const merged = Array.from(new Set([...existing, ...options]));
            setField('skillChoices', merged);
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
          } else if (ckey.startsWith('equipment_')) {
            // Wizard Equipment step rows: each saved option string is parsed back into
            // item/custom entries (known names become item chips, the rest custom text)
            equipmentChoices.push({
              options: options.map(opt => ({ entries: parseOptionString(opt, itemNameMap()) })),
            });
          } else if (sc && sc.equipment === ckey) {
            ensurePush('toolProfChoices', choose, options);
          }
        });
        if (equipmentChoices.length) setField('equipmentChoices', equipmentChoices);

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
            } else if (k.startsWith('tool_prof_') || k.startsWith('equipment_')) {
              // tool choices handled above; equipment_ keys already mapped to A-or-B rows
              if (k.startsWith('tool_prof_')) ensurePush('toolProfChoices', choose, options);
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

    // Features → wizard level store (FeatureDetail[] per level, ids stamped)
    const features: WizardLevels['features'] = {};
    Object.entries(cls.features ?? {}).forEach(([lvl, feats]) => {
      const level = parseInt(lvl);
      if (!level || !feats?.length) return;
      features[level] = feats.map((f: any) => ({
        id: f.id || createNewId(),
        name: f.name,
        description: f.description ?? f.value ?? '',
        metadata: f.metadata,
      }));
    });
    setLevels({
      features,
      classSpecific: toStoreSpecific(cls.classSpecific),
      cantripsKnown: {},
    });

    // Spellcasting (optional)
    if (cls.spellcasting) {
      const casting: any = cls.spellcasting;
      setField('spellCasting', true);
      const rawType = casting.caster_type ?? casting.metadata?.casterType;
      const casterType = typeof rawType === 'number' && rawType <= CasterType.Full ? rawType as CasterType : CasterType.Full;
      setField('casterType', casterType);
      const abilityRaw = String(casting.spellcasting_ability ?? casting.spells_known?.stat ?? '').toUpperCase();
      if (statMap[abilityRaw] !== undefined) setField('spellcastAbility', statMap[abilityRaw]);
      const knownType = casting.known_type ?? casting.knownType;
      setField('spellsKnownMode', knownType === 'calc' ? 'prepared' : 'fixed');
      setField('spellsKnownCalc', knownType === 'calc' ? SpellsKnown.StatLevel : SpellsKnown.Number);
      // Per-level cantrips known from the stamped slot table
      const slots: Record<number, any> = casting.metadata?.slots ?? {};
      const cantrips: WizardLevels['cantripsKnown'] = {};
      let sawCantrips = false;
      Object.entries(slots).forEach(([lvl, slot]: [string, any]) => {
        const value = slot?.cantripsKnown ?? slot?.cantrips_known;
        if (value !== undefined) {
          cantrips[parseInt(lvl)] = value;
          sawCantrips = true;
        }
      });
      if (sawCantrips) {
        setLevels('cantripsKnown', cantrips);
        setField('hasCantrips', true);
      }
    } else {
      setField('spellCasting', false);
      setField('castingStat', undefined);
      setField('spellcastAbility', undefined);
      setField('casterType', CasterType.None);
    }
  };

  // ---------------------------------------------------------------------------
  // Draft autosave + resume

  const [resumeState, setResumeState] = createSignal<ResumeState>('none');
  const [pendingDraft, setPendingDraft] = createSignal(parseDraft(draftStorage.read(storageKey())));
  if (pendingDraft()) setResumeState('pending');

  // Baseline snapshot: autosave only writes once the state differs from it, so opening a
  // page (or a prefilled ?name= edit) without touching anything never creates a draft.
  const [baseline, setBaseline] = createSignal(serializeDraft(ClassFormGroup, levels, step()));

  const resumeDraft = () => {
    const draft = pendingDraft();
    if (!draft) return;
    hydrateDraft(ClassFormGroup, draft);
    setLevels(draft.levels);
    setStep(draft.step);
    setPrefilled(true); // draft wins over ?name= prefill
    setResumeState('resumed');
    setBaseline(serializeDraft(ClassFormGroup, levels, step()));
  };

  const discardDraft = () => {
    draftStorage.remove(storageKey());
    setPendingDraft(null);
    setResumeState('discarded');
  };

  let autosaveTimer: ReturnType<typeof setTimeout> | undefined;
  createEffect(() => {
    const snapshot = serializeDraft(ClassFormGroup, levels, step());
    if (resumeState() === 'pending') return; // don't clobber an undecided draft
    // Cancel any pending write BEFORE the baseline check — reverting to the pristine
    // state must also cancel the write the edit scheduled, or a phantom draft lands.
    clearTimeout(autosaveTimer);
    if (snapshot === baseline()) return;
    autosaveTimer = setTimeout(() => {
      // Re-check at fire time: a baseline reset (prefill/resume) may have landed after
      // this write was scheduled — never persist a draft equal to the baseline state.
      if (snapshot === baseline()) return;
      draftStorage.write(storageKey(), snapshot);
    }, 500);
  });
  onCleanup(() => clearTimeout(autosaveTimer));

  // Reactive prefill: wait until both search param and homebrew classes are available
  const [prefilled, setPrefilled] = createSignal(false);
  createEffect(() => {
    if (prefilled() || resumeState() === 'pending') return;
    const className = editName().toLowerCase();
    if (!className) return;
    const hb = homebrewManager.classes();
    const srd = srdClasses();
    // Wait for at least one source to load
    if ((!hb || hb.length === 0) && (!srd || srd.length === 0)) return;
    const existingClass = srd.find(c => (c.name || '').toLowerCase() === className) || hb.find(c => (c.name || '').toLowerCase() === className);
    if (existingClass) {
      prefillForm(existingClass);
      setPrefilled(true);
      setBaseline(serializeDraft(ClassFormGroup, levels, step()));
    }
  });

  // ---------------------------------------------------------------------------
  // Shared FeaturesPopup (single mounted instance; steps open it via callbacks)

  const [showFeaturePopup, setShowFeaturePopup] = createSignal(false);
  const [currentFeature, setCurrentFeature] = createSignal<FeatureDetail>({ id: '', name: '', description: '' });
  const [featureTarget, setFeatureTarget] = createSignal<{ level: number; editId?: string; editCategory?: string }>({ level: 1 });

  const openAddFeature = (level: number) => {
    setFeatureTarget({ level });
    setCurrentFeature({ id: '', name: '', description: '' });
    setShowFeaturePopup(true);
  };

  const openEditFeature = (level: number, feature: FeatureDetail) => {
    // The row hands us a Solid store node; the popup structured-clones its input while
    // hydrating the mads FormArray, which throws "Proxy object could not be cloned" on
    // store proxies — unwrap to the raw object and detach a deep copy first.
    const plain = structuredClone(unwrap(feature));
    setFeatureTarget({ level, editId: plain.id, editCategory: plain.metadata?.category });
    setCurrentFeature(plain);
    setShowFeaturePopup(true);
  };

  const onFeatureSaved = (data: FeatureDetail) => {
    const { level, editId, editCategory } = featureTarget();
    // The popup preserves id/category now; editId still wins for replace-by-id,
    // and editCategory is only a fallback for features saved before that change.
    if (editId) {
      const merged: FeatureDetail = {
        ...data,
        id: editId,
        // ?? not || — an emptied category is an intentional clear, not a miss.
        metadata: { ...data.metadata, category: data.metadata?.category ?? editCategory },
      };
      setLevels('features', level, arr => (arr ?? []).map(f => f.id === editId ? merged : f));
    } else {
      setLevels('features', level, arr => [...(arr ?? []), { ...data, id: data.id || createNewId() }]);
    }
  };

  // ---------------------------------------------------------------------------
  // Publish

  const collectForm = (builtLevels: ClassForm['classLevels']): ClassForm => {
    const form = {} as Record<string, unknown>;
    DRAFT_FORM_KEYS.forEach(key => { form[key] = ClassFormGroup.get(key); });
    form.classLevels = builtLevels;
    form.subclasses = [];
    return form as unknown as ClassForm;
  };

  const publish = async () => {
    const name = ((ClassFormGroup.get('name') as string) || '').trim();
    if (!name) {
      addSnackbar({ message: 'Give the class a name on the Identity step first', severity: 'warning' });
      setStep(WizardStep.Identity);
      return;
    }
    addSnackbar({ message: 'Publishing class...', severity: 'info' });
    const builtLevels = buildLevelEntities(name, unwrap(levels));
    const form = collectForm(builtLevels);
    const profs: ProfStore = {
      armor: ClassFormGroup.get('armorProficiencies') || [],
      weapons: ClassFormGroup.get('weaponProficiencies') || [],
      tools: ClassFormGroup.get('toolProficiencies') || [],
    };
    const adapted = toClass5E(form, profs, builtLevels);
    const param = editName();
    // Duplicate guard: block only when the name collides with a class we're NOT editing
    if (homebrewManager.classes().some(c => c.name.toLowerCase() === name.toLowerCase() && param.toLowerCase() !== name.toLowerCase())) {
      addSnackbar({ message: 'Class name already exists', severity: 'warning' });
      return;
    }
    const exists = homebrewManager.classes().some(c => c.name.toLowerCase() === name.toLowerCase());
    const saved = exists
      ? await homebrewManager.updateClass(adapted as any)
      : await homebrewManager.addClass(adapted as any);
    if (!saved) {
      addSnackbar({ message: 'Saving the class failed — it was NOT stored', severity: 'error' });
      return;
    }
    draftStorage.remove(storageKey());
    addSnackbar({ message: `${name} published`, severity: 'success' });
    navigate('/homebrew');
  };

  // ---------------------------------------------------------------------------
  // Test instrumentation: aggregate reactive snapshot for unit tests

  const [debugSnapshot, setDebugSnapshot] = createSignal({
    primaryStat: '', savingThrows: '', armor: '', weapon: '', tool: '', itemStart: ''
  });
  createEffect(() => {
    const primArr = ClassFormGroup.get('primaryStat') || [];
    const prim = primArr.join(',');
    const saves = (ClassFormGroup.get('savingThrows') ?? []).join(',');
    const armor = (ClassFormGroup.get('armorProficiencies') ?? []).join('|');
    const weapon = (ClassFormGroup.get('weaponProficiencies') ?? []).join('|');
    const tool = (ClassFormGroup.get('toolProficiencies') ?? []).join('|');
    const itemStart = (ClassFormGroup.get('itemStart') ?? []).join('|');
    setDebugSnapshot({ primaryStat: prim, savingThrows: saves, armor, weapon, tool, itemStart });
  });

  onMount(() => {
    document.body.classList.add('classes-bg');
  });

  onCleanup(() => {
    document.body.classList.remove('classes-bg');
  });

  // ---------------------------------------------------------------------------

  const eyebrowName = () => ((ClassFormGroup.get('name') as string) || '').trim() || 'New Class';

  const stepProps = {
    formGroup: ClassFormGroup,
    levels,
    setLevels,
    goToStep: (s: WizardStep) => setStep(s),
    openAddFeature,
    openEditFeature,
    publish,
  };

  return (
    <Container
      theme="surface"
      class={styles.wizard}
      data-testid="class-form"
      data-primary-stat={debugSnapshot().primaryStat}
      data-saving-throws={debugSnapshot().savingThrows}
      data-armor-profs={debugSnapshot().armor}
      data-weapon-profs={debugSnapshot().weapon}
      data-tool-profs={debugSnapshot().tool}
      data-item-start={debugSnapshot().itemStart}
    >
      <Show when={resumeState() === 'pending'}>
        <div class={styles.resumeBanner}>
          <span>You have an unpublished draft{pendingDraft()?.form?.name ? ` of "${pendingDraft()!.form.name}"` : ''}. Resume where you left off?</span>
          <div class={styles.resumeActions}>
            <Button theme="primary" onClick={resumeDraft}>Resume draft</Button>
            <Button transparent onClick={discardDraft}>Discard</Button>
          </div>
        </div>
      </Show>

      <div class={styles.eyebrow}>Forging — {eyebrowName()}</div>
      <h1 class={styles.question}>{STEP_META[step()].question}</h1>
      <p class={styles.subtitle}>{STEP_META[step()].subtitle}</p>

      <Stepper
        current={step()}
        status={(s) => stepStatus(s, ClassFormGroup, levels)}
        onJump={(s) => setStep(s)}
      />

      <Switch>
        <Match when={step() === WizardStep.Identity}><StepIdentity {...stepProps} /></Match>
        <Match when={step() === WizardStep.Proficiencies}><StepProficiencies {...stepProps} /></Match>
        <Match when={step() === WizardStep.Equipment}><StepEquipment {...stepProps} /></Match>
        <Match when={step() === WizardStep.Features}><StepFeatures {...stepProps} /></Match>
        <Match when={step() === WizardStep.Spellcasting}><StepSpellcasting {...stepProps} /></Match>
        <Match when={step() === WizardStep.Review}><StepReview {...stepProps} /></Match>
      </Switch>

      <WizardFooter
        step={step()}
        className={(ClassFormGroup.get('name') as string) || ''}
        onBack={() => setStep(s => Math.max(WizardStep.Identity, s - 1) as WizardStep)}
        onNext={() => {
          if (step() === WizardStep.Review) {
            void publish();
          } else {
            setStep(s => Math.min(WizardStep.Review, s + 1) as WizardStep);
          }
        }}
      />

      <FeaturesPopup
        Show={[showFeaturePopup, setShowFeaturePopup]}
        feature={[currentFeature, setCurrentFeature]}
        isEdit={() => !!featureTarget().editId}
        onClose={onFeatureSaved}
        context={{
          className: (ClassFormGroup.get('name') as string) || undefined,
          level: featureTarget().level,
        }}
      />
    </Container>
  );
};
