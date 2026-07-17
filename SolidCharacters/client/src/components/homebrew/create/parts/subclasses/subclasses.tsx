import { Component, Match, Show, Switch, batch, createEffect, createMemo, createSignal, onCleanup, onMount } from "solid-js";
import { createStore, unwrap } from "solid-js/store";
import { useNavigate, useSearchParams } from "@solidjs/router";
import { Button, Container, FormGroup, Validators, addSnackbar } from "coles-solid-library";
import { homebrewManager } from "../../../../../shared/customHooks/homebrewManager";
import { useDnDClasses } from "../../../../../shared/customHooks/dndInfo/info/all/classes";
import { useDnDSpells } from "../../../../../shared/customHooks/dndInfo/info/all/spells";
import { FeatureDetail } from "../../../../../models/generated";
import { Spell } from "../../../../../models/data";
import { srdSubclass } from "../../../../../models/data/generated";
import { createNewId } from "../../../../../shared/customHooks/utility/tools/idGen";
import { detectSubclassFeatureLevels } from "../../../../../shared/ai/refs/classProgression";
import { FeaturesPopup } from "../../../Parts/featuresPopup/featuresPopup";
import { parseDataSpellcasting } from "./subclassAdapter";
import { SpellsKnown } from "./SpellsKnown";
import {
  STEP_META,
  SubclassForm,
  SubclassLevels,
  SubclassWizardStep,
  classSelectorKey,
  collectForm,
  draftStorage,
  emptySubclassLevels,
  hydrateDraft,
  hydrateSubclassFeatures,
  normalizeCastingAbility,
  parseDraft,
  serializeDraft,
  stepStatus,
  subclassDraftKey,
  subclassFeatureLevels,
  subclassStorageKey,
  toClassOption,
  toDataSubclass,
} from "./wizard/wizard.shared";
import { Stepper } from "./wizard/stepper";
import { WizardFooter } from "./wizard/wizardFooter";
import { StepIdentity } from "./wizard/stepIdentity";
import { StepFeatures } from "./wizard/stepFeatures";
import { StepSpellcasting } from "./wizard/stepSpellcasting";
import { StepReview } from "./wizard/stepReview";
import styles from "../classes/wizard/classesWizard.module.scss";

type ResumeState = 'none' | 'pending' | 'resumed' | 'discarded';

const Subclasses: Component = () => {
  const allClasses = useDnDClasses();
  const classOptions = () => allClasses().map(toClassOption);
  const allSpells = useDnDSpells();
  const [searchParams] = useSearchParams<{ name: string; subclass: string }>();
  const navigate = useNavigate();

  const SubclassFormGroup = new FormGroup<SubclassForm>({
    parentClass: ['', [Validators.Required]],
    parentClassId: ['', []],
    name: ['', [Validators.Required]],
    description: ['', []],
    hasCasting: [false, []],
    casterType: ['', []],
    castingModifier: ['', []],
    spellsKnownCalc: [SpellsKnown.None, []],
    halfCasterRoundUp: [false, []],
    hasCantrips: [false, []],
    hasRitualCasting: [false, []],
    spellsKnownPerLevel: [[], []],
    spellcastingInfo: [[], []],
    subclassSpells: [[], []],
    selectedSpellName: ['', []],
  });

  const setField = <K extends keyof SubclassForm>(key: K, value: SubclassForm[K]) =>
    SubclassFormGroup.set(key, value);

  // Resolve by selector key first (unambiguous across 2014/2024/homebrew); fall back to the
  // name for states that predate the id — old drafts and name-only ?name= prefills.
  const parentClassData = createMemo(() => {
    const key = (SubclassFormGroup.get('parentClassId') as string) || '';
    if (key) return allClasses().find(c => classSelectorKey(c) === key);
    const name = (SubclassFormGroup.get('parentClass') as string) || '';
    return name ? allClasses().find(c => c.name === name) : undefined;
  });

  // Levels the parent class grants subclass features at; null = nothing detectable
  // (no class picked, or a class without markers) → the Features step falls back to all 20.
  const allowedLevels = createMemo<number[] | null>(() => {
    const detected = detectSubclassFeatureLevels(parentClassData());
    return detected.length ? detected : null;
  });

  const [step, setStep] = createSignal<SubclassWizardStep>(SubclassWizardStep.Identity);
  const [levels, setLevels] = createStore<SubclassLevels>(emptySubclassLevels());

  const paramString = (value: string | string[] | undefined) => {
    if (typeof value === 'string') return value;
    return value?.join(' ') ?? '';
  };
  const editClass = () => paramString(searchParams.name);
  const editSubclass = () => paramString(searchParams.subclass);
  const storageKey = () => subclassDraftKey(editClass(), editSubclass());

  const storageKeyFor = (s: srdSubclass) =>
    s?.storage_key ? s.storage_key : subclassStorageKey(s?.parentClass || '', s?.name || '');

  // ---------------------------------------------------------------------------
  // Prefill (?name=&subclass= edit mode)

  const prefillForm = (found: srdSubclass) => {
    batch(() => {
      setField('parentClass', found.parentClass || '');
      // Stored subclasses know their parent only by name; resolve the selector key to the
      // first name match (same class the pre-id lookup would have used) so the Select shows it.
      const parentMatch = allClasses().find(c => c.name === found.parentClass);
      setField('parentClassId', parentMatch ? classSelectorKey(parentMatch) : '');
      setField('name', found.name || '');
      setField('description', found.description || '');
      setLevels({ features: hydrateSubclassFeatures(found.features) });
      if (found.spellcasting) {
        const parsed = parseDataSpellcasting(found.spellcasting as never);
        if (parsed) {
          setField('hasCasting', true);
          setField('casterType', parsed.casterTypeString || '');
          setField('spellsKnownCalc', parsed.spellsKnownCalc ?? SpellsKnown.None);
          if (parsed.customKnown?.length) setField('spellsKnownPerLevel', parsed.customKnown);
          setField('castingModifier', normalizeCastingAbility(parsed.castingModifier));
          setField('halfCasterRoundUp', !!parsed.roundUp);
          setField('hasCantrips', !!parsed.hasCantrips);
        }
        // Not part of the persisted Spellcasting model today, but restore when present.
        const info = (found.spellcasting as { info?: { name: string; desc: string[] }[] }).info;
        if (info) setField('spellcastingInfo', info);
      }
      const spells = (found as { spells?: Spell[] }).spells;
      if (spells) setField('subclassSpells', spells);
    });
  };

  // ---------------------------------------------------------------------------
  // Draft autosave + resume

  const [resumeState, setResumeState] = createSignal<ResumeState>('none');
  const [pendingDraft, setPendingDraft] = createSignal(parseDraft(draftStorage.read(storageKey())));
  if (pendingDraft()) setResumeState('pending');

  // Baseline snapshot: autosave only writes once the state differs from it, so opening the
  // page (or a prefilled edit) without touching anything never creates a draft.
  const [baseline, setBaseline] = createSignal(serializeDraft(SubclassFormGroup, levels, step()));

  const resumeDraft = () => {
    const draft = pendingDraft();
    if (!draft) return;
    hydrateDraft(SubclassFormGroup, draft);
    setLevels(draft.levels);
    setStep(draft.step);
    setPrefilled(true); // draft wins over ?name=&subclass= prefill
    setResumeState('resumed');
    setBaseline(serializeDraft(SubclassFormGroup, levels, step()));
  };

  const discardDraft = () => {
    draftStorage.remove(storageKey());
    setPendingDraft(null);
    setResumeState('discarded');
  };

  let autosaveTimer: ReturnType<typeof setTimeout> | undefined;
  createEffect(() => {
    const snapshot = serializeDraft(SubclassFormGroup, levels, step());
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

  // Reactive prefill: wait until both search params and homebrew subclasses are available
  const [prefilled, setPrefilled] = createSignal(false);
  createEffect(() => {
    if (prefilled() || resumeState() === 'pending') return;
    const className = editClass().toLowerCase();
    const subclassName = editSubclass().toLowerCase();
    if (!className || !subclassName) return;
    const stored = homebrewManager.subclasses().find(s =>
      (s.parentClass || '').toLowerCase() === className && (s.name || '').toLowerCase() === subclassName);
    if (stored) {
      prefillForm(stored);
      setPrefilled(true);
      setBaseline(serializeDraft(SubclassFormGroup, levels, step()));
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

  const publish = async () => {
    const name = ((SubclassFormGroup.get('name') as string) || '').trim();
    const parentClass = ((SubclassFormGroup.get('parentClass') as string) || '').trim();
    if (!name || !parentClass) {
      addSnackbar({ message: 'Pick a parent class and name the subclass on the Identity step first', severity: 'warning' });
      setStep(SubclassWizardStep.Identity);
      return;
    }
    addSnackbar({ message: 'Publishing subclass...', severity: 'info' });
    const data = toDataSubclass(collectForm(SubclassFormGroup), unwrap(levels));
    const key = data.storage_key!;
    const editKey = editClass() && editSubclass() ? subclassStorageKey(editClass(), editSubclass()) : '';
    const exists = homebrewManager.subclasses().some(s => storageKeyFor(s) === key);
    // Duplicate guard: block only when the name collides with a subclass we're NOT editing
    if (exists && key !== editKey) {
      addSnackbar({ message: `${parentClass} already has a subclass named ${name}`, severity: 'warning' });
      return;
    }
    const saved = exists
      ? await homebrewManager.updateSubclass(data as never)
      : await homebrewManager.addSubclass(data as never);
    if (!saved) {
      addSnackbar({ message: 'Saving the subclass failed — it was NOT stored', severity: 'error' });
      return;
    }
    draftStorage.remove(storageKey());
    addSnackbar({ message: `${name} published`, severity: 'success' });
    navigate('/homebrew');
  };

  // ---------------------------------------------------------------------------
  // Test instrumentation: aggregate reactive snapshot for unit tests

  const [debugSnapshot, setDebugSnapshot] = createSignal({
    parentClass: '', parentClassId: '', name: '', casterType: '', featureLevels: ''
  });
  createEffect(() => {
    setDebugSnapshot({
      parentClass: (SubclassFormGroup.get('parentClass') as string) || '',
      parentClassId: (SubclassFormGroup.get('parentClassId') as string) || '',
      name: (SubclassFormGroup.get('name') as string) || '',
      casterType: SubclassFormGroup.get('hasCasting') ? ((SubclassFormGroup.get('casterType') as string) || '') : '',
      featureLevels: subclassFeatureLevels(levels.features).join(','),
    });
  });

  onMount(() => {
    document.body.classList.add('subclasses-bg');
  });

  onCleanup(() => {
    document.body.classList.remove('subclasses-bg');
  });

  // ---------------------------------------------------------------------------

  const eyebrowName = () => ((SubclassFormGroup.get('name') as string) || '').trim() || 'New Subclass';

  const stepProps = {
    formGroup: SubclassFormGroup,
    levels,
    setLevels,
    classOptions,
    allowedLevels,
    allSpells: allSpells as unknown as () => Spell[],
    goToStep: (s: SubclassWizardStep) => setStep(s),
    openAddFeature,
    openEditFeature,
    publish,
  };

  return (
    <Container
      theme="surface"
      class={styles.wizard}
      data-testid="subclass-form"
      data-parent-class={debugSnapshot().parentClass}
      data-parent-class-id={debugSnapshot().parentClassId}
      data-name={debugSnapshot().name}
      data-caster-type={debugSnapshot().casterType}
      data-feature-levels={debugSnapshot().featureLevels}
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
        status={(s) => stepStatus(s, SubclassFormGroup, levels)}
        onJump={(s) => setStep(s)}
      />

      <Switch>
        <Match when={step() === SubclassWizardStep.Identity}><StepIdentity {...stepProps} /></Match>
        <Match when={step() === SubclassWizardStep.Features}><StepFeatures {...stepProps} /></Match>
        <Match when={step() === SubclassWizardStep.Spellcasting}><StepSpellcasting {...stepProps} /></Match>
        <Match when={step() === SubclassWizardStep.Review}><StepReview {...stepProps} /></Match>
      </Switch>

      <WizardFooter
        step={step()}
        subclassName={(SubclassFormGroup.get('name') as string) || ''}
        onBack={() => setStep(s => Math.max(SubclassWizardStep.Identity, s - 1) as SubclassWizardStep)}
        onNext={() => {
          if (step() === SubclassWizardStep.Review) {
            void publish();
          } else {
            setStep(s => Math.min(SubclassWizardStep.Review, s + 1) as SubclassWizardStep);
          }
        }}
      />

      <FeaturesPopup
        Show={[showFeaturePopup, setShowFeaturePopup]}
        feature={[currentFeature, setCurrentFeature]}
        isEdit={() => !!featureTarget().editId}
        onClose={onFeatureSaved}
        context={{
          className: (SubclassFormGroup.get('parentClass') as string) || undefined,
          subclassName: (SubclassFormGroup.get('name') as string) || undefined,
          level: featureTarget().level,
        }}
      />
    </Container>
  );
};

export default Subclasses;
