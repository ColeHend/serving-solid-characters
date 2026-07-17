import { Component, Match, Show, Switch, batch, createEffect, createSignal, onCleanup, onMount } from "solid-js";
import { createStore, unwrap } from "solid-js/store";
import { useNavigate, useSearchParams } from "@solidjs/router";
import { Button, Container, FormGroup, Validators, addSnackbar } from "coles-solid-library";
import { homebrewManager } from "../../../../../shared/customHooks/homebrewManager";
import { useDnDRaces } from "../../../../../shared/customHooks/dndInfo/info/all/races";
import { FeatureDetail, Race } from "../../../../../models/generated";
import { createNewId } from "../../../../../shared/customHooks/utility/tools/idGen";
import { FeaturesPopup } from "../../../Parts/featuresPopup/featuresPopup";
import { hydrateBonuses, hydrateTraits, mergeDescriptions, parseSizes, pickDescription, toRace } from "./raceAdapter";
import {
  RaceExtras,
  RaceForm,
  RaceWizardStep,
  STEP_META,
  bonusLabel,
  draftStorage,
  emptyExtras,
  hydrateDraft,
  parseDraft,
  raceDraftKey,
  serializeDraft,
  stepStatus,
} from "./wizard/wizard.shared";
import { Stepper } from "./wizard/stepper";
import { WizardFooter } from "./wizard/wizardFooter";
import { StepIdentity } from "./wizard/stepIdentity";
import { StepAbilityBonuses } from "./wizard/stepAbilityBonuses";
import { StepLanguages } from "./wizard/stepLanguages";
import { StepTraits } from "./wizard/stepTraits";
import { StepFlavor } from "./wizard/stepFlavor";
import { StepReview } from "./wizard/stepReview";
import styles from "../classes/wizard/classesWizard.module.scss";

type ResumeState = 'none' | 'pending' | 'resumed' | 'discarded';

const Races: Component = () => {
  const allRaces = useDnDRaces();
  const [searchParams] = useSearchParams<{ name: string }>();
  const navigate = useNavigate();

  const RaceFormGroup = new FormGroup<RaceForm>({
    name: ['', [Validators.Required]],
    source: ['', []],
    size: [[], []],
    speed: [30, []],
    languages: [[], []],
    langChoiceAmount: [0, []],
    langChoiceOptions: [[], []],
    abilityBonuses: [[], []],
    descAge: ['', []],
    descAlignment: ['', []],
    descSize: ['', []],
    descLanguage: ['', []],
    descAbilities: ['', []],
  });

  const setField = <K extends keyof RaceForm>(key: K, value: RaceForm[K]) =>
    RaceFormGroup.set(key, value);

  const [step, setStep] = createSignal<RaceWizardStep>(RaceWizardStep.Identity);
  const [extras, setExtras] = createStore<RaceExtras>(emptyExtras());

  const paramString = (value: string | string[] | undefined) => {
    if (typeof value === 'string') return value;
    return value?.join(' ') ?? '';
  };
  const editName = () => paramString(searchParams.name);
  const storageKey = () => raceDraftKey(editName());

  // ---------------------------------------------------------------------------
  // Prefill (?name= edit mode — a homebrew name edits in place, an SRD name clones)

  const prefillForm = (found: Race) => {
    batch(() => {
      setField('name', found.name || '');
      setField('source', found.source ?? '');
      setField('size', parseSizes(found.size));
      setField('speed', found.speed || 30);
      setField('languages', [...(found.languages ?? [])]);
      setField('langChoiceAmount', found.languageChoice?.amount ?? 0);
      setField('langChoiceOptions', [...(found.languageChoice?.options ?? [])]);
      setField('abilityBonuses', hydrateBonuses(found.abilityBonuses));
      setField('descAge', pickDescription(found, 'age', 'ages'));
      setField('descAlignment', pickDescription(found, 'alignment', 'align'));
      setField('descSize', pickDescription(found, 'physical', 'size', 'sizeDescription', 'sizeDesc'));
      setField('descLanguage', pickDescription(found, 'language', 'languages', 'languageDesc', 'lang'));
      setField('descAbilities', pickDescription(found, 'abilities', 'ability', 'abilityDescription', 'abilitiesDesc'));
      setExtras({ traits: hydrateTraits(found.traits) });
    });
  };

  // ---------------------------------------------------------------------------
  // Draft autosave + resume

  const [resumeState, setResumeState] = createSignal<ResumeState>('none');
  const [pendingDraft, setPendingDraft] = createSignal(parseDraft(draftStorage.read(storageKey())));
  if (pendingDraft()) setResumeState('pending');

  // Baseline snapshot: autosave only writes once the state differs from it, so opening the
  // page (or a prefilled edit) without touching anything never creates a draft.
  const [baseline, setBaseline] = createSignal(serializeDraft(RaceFormGroup, extras, step()));

  const resumeDraft = () => {
    const draft = pendingDraft();
    if (!draft) return;
    hydrateDraft(RaceFormGroup, draft);
    setExtras(draft.extras);
    setStep(draft.step);
    setPrefilled(true); // draft wins over ?name= prefill
    setResumeState('resumed');
    setBaseline(serializeDraft(RaceFormGroup, extras, step()));
  };

  const discardDraft = () => {
    draftStorage.remove(storageKey());
    setPendingDraft(null);
    setResumeState('discarded');
  };

  let autosaveTimer: ReturnType<typeof setTimeout> | undefined;
  createEffect(() => {
    const snapshot = serializeDraft(RaceFormGroup, extras, step());
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

  // Reactive prefill: wait until both the search param and the race list are available.
  // homebrewManager.races() is checked first — it's the LIVE homebrew signal, whereas
  // useDnDRaces' homebrew source snapshots Dexie once and never sees races created
  // this session.
  const [prefilled, setPrefilled] = createSignal(false);
  createEffect(() => {
    if (prefilled() || resumeState() === 'pending') return;
    const name = editName().trim().toLowerCase();
    if (!name) return;
    const found = homebrewManager.races().find(r => (r.name || '').toLowerCase() === name)
      ?? allRaces().find(r => (r.name || '').toLowerCase() === name);
    if (!found) return;
    prefillForm(found);
    setPrefilled(true);
    setBaseline(serializeDraft(RaceFormGroup, extras, step()));
  });

  // ---------------------------------------------------------------------------
  // Shared FeaturesPopup (single mounted instance; steps open it via callbacks)

  const [showFeaturePopup, setShowFeaturePopup] = createSignal(false);
  const [currentFeature, setCurrentFeature] = createSignal<FeatureDetail>({ id: '', name: '', description: '' });
  const [featureTarget, setFeatureTarget] = createSignal<{ editId?: string; editCategory?: string }>({});

  const openAddFeature = () => {
    setFeatureTarget({});
    setCurrentFeature({ id: '', name: '', description: '' });
    setShowFeaturePopup(true);
  };

  const openEditFeature = (feature: FeatureDetail) => {
    // The row hands us a Solid store node; the popup structured-clones its input while
    // hydrating the mads FormArray, which throws "Proxy object could not be cloned" on
    // store proxies — unwrap to the raw object and detach a deep copy first.
    const plain = structuredClone(unwrap(feature));
    setFeatureTarget({ editId: plain.id, editCategory: plain.metadata?.category });
    setCurrentFeature(plain);
    setShowFeaturePopup(true);
  };

  const onFeatureSaved = (data: FeatureDetail) => {
    const { editId, editCategory } = featureTarget();
    if (editId) {
      const merged: FeatureDetail = {
        ...data,
        id: editId,
        // ?? not || — an emptied category is an intentional clear, not a miss.
        metadata: { ...data.metadata, category: data.metadata?.category ?? editCategory },
      };
      setExtras('traits', arr => arr.map(t => t.id === editId ? merged : t));
    } else {
      setExtras('traits', arr => [...arr, { ...data, id: data.id || createNewId() }]);
    }
  };

  // ---------------------------------------------------------------------------
  // Publish

  const publish = async () => {
    const name = ((RaceFormGroup.get('name') as string) || '').trim();
    if (!name) {
      addSnackbar({ message: 'Give the race a name on the Identity step first', severity: 'warning' });
      setStep(RaceWizardStep.Identity);
      return;
    }
    // The homebrew row being edited (?name= target). An SRD-only ?name= match is a clone —
    // there is no homebrew row, so publish adds a new one.
    const editTarget = editName().trim().toLowerCase();
    const existing = editTarget
      ? homebrewManager.races().find(r => (r.name || '').toLowerCase() === editTarget)
      : undefined;
    // Duplicate guard: block only when the name collides with a homebrew race we're
    // NOT editing. Shadowing an SRD name is allowed — that's how cloning works.
    const collides = homebrewManager.races().some(r =>
      (r.name || '').toLowerCase() === name.toLowerCase() && (!existing || r.name !== existing.name));
    if (collides) {
      addSnackbar({ message: 'Race name already exists', severity: 'warning' });
      return;
    }
    addSnackbar({ message: 'Publishing race...', severity: 'info' });
    const built = toRace(RaceFormGroup, unwrap(extras), existing?.id);
    // Spread over the existing row so fields the wizard has no UI for
    // (abilityBonusChoice, traitChoice, legacy, embedded subraces) survive the
    // update; descriptions keep unknown keys but drop the alternate spellings
    // the canonical keys replace (see mergeDescriptions).
    const race: Race = existing
      ? { ...existing, ...built, descriptions: mergeDescriptions(existing.descriptions, built.descriptions) }
      : built;
    // Race persistence is keyed by NAME (updateRace no-ops on an unknown name), so a
    // rename must remove the old row first and re-add under the new name — same id,
    // so subraces (linked by parentRace === race.id) stay attached.
    if (existing && existing.name !== race.name) {
      await homebrewManager.removeRace(existing.name);
      homebrewManager.addRace(race);
    } else if (existing) {
      await homebrewManager.updateRace(race);
    } else {
      homebrewManager.addRace(race);
    }
    draftStorage.remove(storageKey());
    navigate('/homebrew');
  };

  // ---------------------------------------------------------------------------
  // Test instrumentation: aggregate reactive snapshot for unit tests

  const [debugSnapshot, setDebugSnapshot] = createSignal({
    name: '', sizes: '', speed: '', abilities: '', languages: '', traits: ''
  });
  createEffect(() => {
    setDebugSnapshot({
      name: (RaceFormGroup.get('name') as string) || '',
      sizes: ((RaceFormGroup.get('size') as string[]) ?? []).join(','),
      speed: String((RaceFormGroup.get('speed') as number) ?? ''),
      abilities: ((RaceFormGroup.get('abilityBonuses') as RaceForm['abilityBonuses']) ?? []).map(bonusLabel).join(','),
      languages: ((RaceFormGroup.get('languages') as string[]) ?? []).join(','),
      traits: extras.traits.map(t => t.name).join(','),
    });
  });

  onMount(() => {
    document.body.classList.add('race-bg');
  });

  onCleanup(() => {
    document.body.classList.remove('race-bg');
  });

  // ---------------------------------------------------------------------------

  const eyebrowName = () => ((RaceFormGroup.get('name') as string) || '').trim() || 'New Race';

  const stepProps = {
    formGroup: RaceFormGroup,
    extras,
    setExtras,
    goToStep: (s: RaceWizardStep) => setStep(s),
    openAddFeature,
    openEditFeature,
    publish,
  };

  return (
    <Container
      theme="surface"
      class={styles.wizard}
      data-testid="race-form"
      data-name={debugSnapshot().name}
      data-sizes={debugSnapshot().sizes}
      data-speed={debugSnapshot().speed}
      data-abilities={debugSnapshot().abilities}
      data-languages={debugSnapshot().languages}
      data-traits={debugSnapshot().traits}
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
        status={(s) => stepStatus(s, RaceFormGroup, extras)}
        onJump={(s) => setStep(s)}
      />

      <Switch>
        <Match when={step() === RaceWizardStep.Identity}><StepIdentity {...stepProps} /></Match>
        <Match when={step() === RaceWizardStep.AbilityBonuses}><StepAbilityBonuses {...stepProps} /></Match>
        <Match when={step() === RaceWizardStep.Languages}><StepLanguages {...stepProps} /></Match>
        <Match when={step() === RaceWizardStep.Traits}><StepTraits {...stepProps} /></Match>
        <Match when={step() === RaceWizardStep.Flavor}><StepFlavor {...stepProps} /></Match>
        <Match when={step() === RaceWizardStep.Review}><StepReview {...stepProps} /></Match>
      </Switch>

      <WizardFooter
        step={step()}
        raceName={(RaceFormGroup.get('name') as string) || ''}
        onBack={() => setStep(s => Math.max(RaceWizardStep.Identity, s - 1) as RaceWizardStep)}
        onNext={() => {
          if (step() === RaceWizardStep.Review) {
            void publish();
          } else {
            setStep(s => Math.min(RaceWizardStep.Review, s + 1) as RaceWizardStep);
          }
        }}
      />

      <FeaturesPopup
        Show={[showFeaturePopup, setShowFeaturePopup]}
        feature={[currentFeature, setCurrentFeature]}
        isEdit={() => !!featureTarget().editId}
        onClose={onFeatureSaved}
        context={{
          kind: 'Race trait',
          className: ((RaceFormGroup.get('name') as string) || '').trim() || undefined,
        }}
      />
    </Container>
  );
};

export default Races;
