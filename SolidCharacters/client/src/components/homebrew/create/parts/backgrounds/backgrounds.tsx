import { Component, Match, Show, Switch, batch, createEffect, createMemo, createSignal, onCleanup, onMount } from "solid-js";
import { createStore, unwrap } from "solid-js/store";
import { useNavigate, useSearchParams } from "@solidjs/router";
import { Button, Container, FormGroup, Validators, addSnackbar } from "coles-solid-library";
import { homebrewManager } from "../../../../../shared/customHooks/homebrewManager";
import { useDnDBackgrounds } from "../../../../../shared/customHooks/dndInfo/info/all/backgrounds";
import { useDnDFeats } from "../../../../../shared/customHooks/dndInfo/info/all/feats";
import { Background, FeatureDetail } from "../../../../../models/generated";
import { createNewId } from "../../../../../shared/customHooks/utility/tools/idGen";
import { FeaturesPopup } from "../../../Parts/featuresPopup/featuresPopup";
import {
  BackgroundExtras,
  BackgroundForm,
  BackgroundWizardStep,
  STEP_META,
  backgroundDraftKey,
  draftStorage,
  emptyExtras,
  hydrateDraft,
  hydrateFeatures,
  parseDraft,
  serializeDraft,
  stepStatus,
  toBackground,
  toEquipmentGroups,
} from "./wizard/wizard.shared";
import { Stepper } from "./wizard/stepper";
import { WizardFooter } from "./wizard/wizardFooter";
import { StepIdentity } from "./wizard/stepIdentity";
import { StepAbilitiesFeat } from "./wizard/stepAbilitiesFeat";
import { StepProficienciesLanguages } from "./wizard/stepProficienciesLanguages";
import { StepEquipment } from "./wizard/stepEquipment";
import { StepFeatures } from "./wizard/stepFeatures";
import { StepReview } from "./wizard/stepReview";
import styles from "../classes/wizard/classesWizard.module.scss";

type ResumeState = 'none' | 'pending' | 'resumed' | 'discarded';

const Backgrounds: Component = () => {
  const allBackgrounds = useDnDBackgrounds();
  const allFeats = useDnDFeats();
  const originFeats = createMemo(() => allFeats().filter(f => (f.prerequisites?.length ?? 0) === 0));
  const [searchParams] = useSearchParams<{ name: string }>();
  const navigate = useNavigate();

  const BackgroundFormGroup = new FormGroup<BackgroundForm>({
    name: ['', [Validators.Required]],
    desc: ['', []],
    feat: ['', []],
    abilityOptions: [[], []],
    languages: [[], []],
    langChoiceAmount: [0, []],
    armorProfs: [[], []],
    weaponProfs: [[], []],
    toolProfs: [[], []],
    skillProfs: [[], []],
  });

  const setField = <K extends keyof BackgroundForm>(key: K, value: BackgroundForm[K]) =>
    BackgroundFormGroup.set(key, value);

  const [step, setStep] = createSignal<BackgroundWizardStep>(BackgroundWizardStep.Identity);
  const [extras, setExtras] = createStore<BackgroundExtras>(emptyExtras());

  const paramString = (value: string | string[] | undefined) => {
    if (typeof value === 'string') return value;
    return value?.join(' ') ?? '';
  };
  const editName = () => paramString(searchParams.name);
  const storageKey = () => backgroundDraftKey(editName());

  // ---------------------------------------------------------------------------
  // Prefill (?name= edit mode — a homebrew name edits in place, an SRD name clones)

  const prefillForm = (found: Background) => {
    batch(() => {
      setField('name', found.name || '');
      setField('desc', found.desc || '');
      setField('feat', found.feat || '');
      setField('abilityOptions', found.abilityOptions ?? []);
      setField('languages', found.languages?.options ?? []);
      setField('langChoiceAmount', found.languages?.amount ?? 0);
      setField('armorProfs', found.proficiencies?.armor ?? []);
      setField('weaponProfs', found.proficiencies?.weapons ?? []);
      setField('toolProfs', found.proficiencies?.tools ?? []);
      setField('skillProfs', found.proficiencies?.skills ?? []);
      setExtras({
        equipment: toEquipmentGroups(found.startEquipment),
        features: hydrateFeatures(found.features),
      });
    });
  };

  // ---------------------------------------------------------------------------
  // Draft autosave + resume

  const [resumeState, setResumeState] = createSignal<ResumeState>('none');
  const [pendingDraft, setPendingDraft] = createSignal(parseDraft(draftStorage.read(storageKey())));
  if (pendingDraft()) setResumeState('pending');

  // Baseline snapshot: autosave only writes once the state differs from it, so opening the
  // page (or a prefilled edit) without touching anything never creates a draft.
  const [baseline, setBaseline] = createSignal(serializeDraft(BackgroundFormGroup, extras, step()));

  const resumeDraft = () => {
    const draft = pendingDraft();
    if (!draft) return;
    hydrateDraft(BackgroundFormGroup, draft);
    setExtras(draft.extras);
    setStep(draft.step);
    setPrefilled(true); // draft wins over ?name= prefill
    setResumeState('resumed');
    setBaseline(serializeDraft(BackgroundFormGroup, extras, step()));
  };

  const discardDraft = () => {
    draftStorage.remove(storageKey());
    setPendingDraft(null);
    setResumeState('discarded');
  };

  let autosaveTimer: ReturnType<typeof setTimeout> | undefined;
  createEffect(() => {
    const snapshot = serializeDraft(BackgroundFormGroup, extras, step());
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

  // Reactive prefill: wait until both the search param and the background list are available
  const [prefilled, setPrefilled] = createSignal(false);
  createEffect(() => {
    if (prefilled() || resumeState() === 'pending') return;
    const name = editName().trim().toLowerCase();
    if (!name) return;
    const found = allBackgrounds().find(b => (b.name || '').toLowerCase() === name);
    if (!found) return;
    prefillForm(found);
    setPrefilled(true);
    setBaseline(serializeDraft(BackgroundFormGroup, extras, step()));
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
      setExtras('features', arr => arr.map(f => f.id === editId ? merged : f));
    } else {
      setExtras('features', arr => [...arr, { ...data, id: data.id || createNewId() }]);
    }
  };

  // ---------------------------------------------------------------------------
  // Publish

  const publish = async () => {
    const name = ((BackgroundFormGroup.get('name') as string) || '').trim();
    if (!name) {
      addSnackbar({ message: 'Give the background a name on the Identity step first', severity: 'warning' });
      setStep(BackgroundWizardStep.Identity);
      return;
    }
    // The homebrew row being edited (?name= target). An SRD-only ?name= match is a clone —
    // there is no homebrew row, so publish adds a new one.
    const editTarget = editName().trim().toLowerCase();
    const existing = editTarget
      ? homebrewManager.backgrounds().find(b => (b.name || '').toLowerCase() === editTarget)
      : undefined;
    // Duplicate guard: block only when the name collides with a homebrew background we're
    // NOT editing. Shadowing an SRD name is allowed — that's how cloning works.
    const collides = homebrewManager.backgrounds().some(b =>
      (b.name || '').toLowerCase() === name.toLowerCase() && (!existing || b.id !== existing.id));
    if (collides) {
      addSnackbar({ message: 'Background name already exists', severity: 'warning' });
      return;
    }
    addSnackbar({ message: 'Publishing background...', severity: 'info' });
    const background = toBackground(BackgroundFormGroup, unwrap(extras), existing?.id);
    // addBackground silently no-ops on a duplicate name and updateBackground on an unknown
    // id — both are ruled out above (existing.id comes straight from the homebrew list).
    // They resolve void and emit their own success/error snackbars, so (unlike the class
    // publish) there is no saved-boolean to check here.
    if (existing) await homebrewManager.updateBackground(background);
    else await homebrewManager.addBackground(background);
    draftStorage.remove(storageKey());
    navigate('/homebrew');
  };

  // ---------------------------------------------------------------------------
  // Test instrumentation: aggregate reactive snapshot for unit tests

  const [debugSnapshot, setDebugSnapshot] = createSignal({
    name: '', feat: '', abilities: '', languages: '', groups: '', features: ''
  });
  createEffect(() => {
    setDebugSnapshot({
      name: (BackgroundFormGroup.get('name') as string) || '',
      feat: (BackgroundFormGroup.get('feat') as string) || '',
      abilities: ((BackgroundFormGroup.get('abilityOptions') as string[]) ?? []).join(','),
      languages: ((BackgroundFormGroup.get('languages') as string[]) ?? []).join(','),
      groups: extras.equipment.map(g => g.key).join(','),
      features: extras.features.map(f => f.name).join(','),
    });
  });

  onMount(() => {
    document.body.classList.add('backgrounds-bg');
  });

  onCleanup(() => {
    document.body.classList.remove('backgrounds-bg');
  });

  // ---------------------------------------------------------------------------

  const eyebrowName = () => ((BackgroundFormGroup.get('name') as string) || '').trim() || 'New Background';

  const stepProps = {
    formGroup: BackgroundFormGroup,
    extras,
    setExtras,
    originFeats,
    goToStep: (s: BackgroundWizardStep) => setStep(s),
    openAddFeature,
    openEditFeature,
    publish,
  };

  return (
    <Container
      theme="surface"
      class={styles.wizard}
      data-testid="background-form"
      data-name={debugSnapshot().name}
      data-feat={debugSnapshot().feat}
      data-abilities={debugSnapshot().abilities}
      data-languages={debugSnapshot().languages}
      data-groups={debugSnapshot().groups}
      data-features={debugSnapshot().features}
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
        status={(s) => stepStatus(s, BackgroundFormGroup, extras)}
        onJump={(s) => setStep(s)}
      />

      <Switch>
        <Match when={step() === BackgroundWizardStep.Identity}><StepIdentity {...stepProps} /></Match>
        <Match when={step() === BackgroundWizardStep.AbilitiesFeat}><StepAbilitiesFeat {...stepProps} /></Match>
        <Match when={step() === BackgroundWizardStep.ProficienciesLanguages}><StepProficienciesLanguages {...stepProps} /></Match>
        <Match when={step() === BackgroundWizardStep.Equipment}><StepEquipment {...stepProps} /></Match>
        <Match when={step() === BackgroundWizardStep.Features}><StepFeatures {...stepProps} /></Match>
        <Match when={step() === BackgroundWizardStep.Review}><StepReview {...stepProps} /></Match>
      </Switch>

      <WizardFooter
        step={step()}
        backgroundName={(BackgroundFormGroup.get('name') as string) || ''}
        onBack={() => setStep(s => Math.max(BackgroundWizardStep.Identity, s - 1) as BackgroundWizardStep)}
        onNext={() => {
          if (step() === BackgroundWizardStep.Review) {
            void publish();
          } else {
            setStep(s => Math.min(BackgroundWizardStep.Review, s + 1) as BackgroundWizardStep);
          }
        }}
      />

      <FeaturesPopup
        Show={[showFeaturePopup, setShowFeaturePopup]}
        feature={[currentFeature, setCurrentFeature]}
        isEdit={() => !!featureTarget().editId}
        onClose={onFeatureSaved}
        context={{
          kind: 'Background feature',
          className: ((BackgroundFormGroup.get('name') as string) || '').trim() || undefined,
        }}
      />
    </Container>
  );
};

export default Backgrounds;
