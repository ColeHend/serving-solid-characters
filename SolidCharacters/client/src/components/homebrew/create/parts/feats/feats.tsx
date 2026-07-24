import { Component, Match, Show, Switch, batch, createEffect, createMemo, createSignal, onCleanup, onMount } from "solid-js";
import { useNavigate, useSearchParams } from "@solidjs/router";
import { Button, Container, FormGroup, Validators, addSnackbar } from "coles-solid-library";
import { homebrewManager } from "../../../../../shared/customHooks/homebrewManager";
import { useDnDFeats } from "../../../../../shared/customHooks/dndInfo/info/all/feats";
import { defaultEditionKey, editionToLegacy } from "../../../../../shared/customHooks/dndInfo/info/edition";
import { Feat, FeatureDetail, FeatureMetadata, Prerequisite } from "../../../../../models/generated";
import { takeEditHandoff } from "../../../../../shared/ai/editHandoff";
import { FeaturesPopup } from "../../../Parts/featuresPopup/featuresPopup";
import {
  FeatForm,
  FeatWizardStep,
  STEP_META,
  collectForm,
  draftStorage,
  featDraftKey,
  formMads,
  hydrateDraft,
  mapLegacyPreReqs,
  parseDraft,
  serializeDraft,
  stepStatus,
  toDataFeat,
} from "./wizard/wizard.shared";
import { Stepper } from "./wizard/stepper";
import { WizardFooter } from "./wizard/wizardFooter";
import { StepIdentity } from "./wizard/stepIdentity";
import { StepPrerequisites } from "./wizard/stepPrerequisites";
import { StepEffects } from "./wizard/stepEffects";
import { StepReview } from "./wizard/stepReview";
import styles from "../classes/wizard/classesWizard.module.scss";

type ResumeState = 'none' | 'pending' | 'resumed' | 'discarded';

/** A feat as it comes back from storage/AI — the model plus the legacy root fields. */
type LoadedFeat = Partial<Feat> & { name?: string; desc?: unknown; preReqs?: unknown[] };

const featName = (feat: LoadedFeat | undefined): string =>
  feat?.details?.name ?? feat?.name ?? '';

const Feats: Component = () => {
  const allFeats = useDnDFeats();
  const [searchParams] = useSearchParams<{ name: string }>();
  const navigate = useNavigate();

  const FeatFormGroup = new FormGroup<FeatForm>({
    name: ['', [Validators.Required]],
    description: ['', []],
    source: ['', []],
    prerequisites: [[], []],
    metadata: [undefined, []],
    id: ['', []],
    legacy: [editionToLegacy(defaultEditionKey()), []],
  });

  const setField = <K extends keyof FeatForm>(key: K, value: FeatForm[K]) =>
    FeatFormGroup.set(key, value);

  const [step, setStep] = createSignal<FeatWizardStep>(FeatWizardStep.Identity);

  const paramString = (value: string | string[] | undefined) => {
    if (typeof value === 'string') return value;
    return value?.join(' ') ?? '';
  };
  const editName = () => paramString(searchParams.name);
  const storageKey = () => featDraftKey(editName());

  // The stored homebrew feat the current name points at (live via homebrewManager —
  // the useDnD* homebrew snapshot never sees in-session mutations). Matched loosely,
  // but deletes/updates go through the stored EXACT name, which is what Dexie keys on.
  const storedMatch = createMemo(() => {
    const name = ((FeatFormGroup.get('name') as string) || '').trim().toLowerCase();
    return name
      ? (homebrewManager.feats() as LoadedFeat[]).find(f => featName(f).toLowerCase() === name)
      : undefined;
  });
  const isExisting = () => !!storedMatch();

  // ---------------------------------------------------------------------------
  // Prefill (?name= edit mode + AI "Edit manually" handoff)

  const prefillForm = (found: LoadedFeat) => {
    batch(() => {
      setField('name', featName(found));
      setField('description', found.details?.description
        ?? (Array.isArray(found.desc) ? found.desc[0] : typeof found.desc === 'string' ? found.desc : '')
        ?? '');
      setField('prerequisites', Array.isArray(found.prerequisites)
        ? [...found.prerequisites]
        : Array.isArray(found.preReqs) ? mapLegacyPreReqs(found.preReqs) : []);
      // Carries AI-authored mads (and usage/category) into the wizard instead of dropping them.
      setField('metadata', found.details?.metadata ? structuredClone(found.details.metadata) : undefined);
      setField('id', found.id || '');
      setField('legacy', found.legacy);
      setField('source', found.source ?? '');
    });
  };

  // ---------------------------------------------------------------------------
  // Draft autosave + resume

  const [resumeState, setResumeState] = createSignal<ResumeState>('none');
  const [pendingDraft, setPendingDraft] = createSignal(parseDraft(draftStorage.read(storageKey())));
  if (pendingDraft()) setResumeState('pending');

  // Baseline snapshot: autosave only writes once the state differs from it, so opening the
  // page (or a prefilled edit) without touching anything never creates a draft.
  const [baseline, setBaseline] = createSignal(serializeDraft(FeatFormGroup, step()));

  const resumeDraft = () => {
    const draft = pendingDraft();
    if (!draft) return;
    hydrateDraft(FeatFormGroup, draft);
    setStep(draft.step);
    setPrefilled(true); // draft wins over ?name= prefill
    setResumeState('resumed');
    setBaseline(serializeDraft(FeatFormGroup, step()));
  };

  const discardDraft = () => {
    draftStorage.remove(storageKey());
    setPendingDraft(null);
    setResumeState('discarded');
  };

  let autosaveTimer: ReturnType<typeof setTimeout> | undefined;
  createEffect(() => {
    const snapshot = serializeDraft(FeatFormGroup, step());
    if (resumeState() === 'pending') return; // don't clobber an undecided draft
    if (snapshot === baseline()) return;
    clearTimeout(autosaveTimer);
    autosaveTimer = setTimeout(() => {
      // Re-check at fire time: a baseline reset (prefill/resume) may have landed after
      // this write was scheduled — never persist a draft equal to the baseline state.
      if (snapshot === baseline()) return;
      draftStorage.write(storageKey(), snapshot);
    }, 500);
  });
  onCleanup(() => clearTimeout(autosaveTimer));

  // Reactive prefill: wait until the search param and feat catalogs are available.
  // Homebrew wins over an SRD feat of the same name, like the old page.
  const [prefilled, setPrefilled] = createSignal(false);
  createEffect(() => {
    if (prefilled() || resumeState() === 'pending') return;
    const target = editName().trim().toLowerCase();
    if (!target) return;
    const stored = (homebrewManager.feats() as LoadedFeat[]).find(f => featName(f).toLowerCase() === target);
    const found = stored ?? (allFeats() as LoadedFeat[]).find(f => featName(f).toLowerCase() === target);
    if (found) {
      prefillForm(found);
      setPrefilled(true);
      setBaseline(serializeDraft(FeatFormGroup, step()));
    }
  });

  // ---------------------------------------------------------------------------
  // Effects editor (shared FeaturesPopup on this feat's single FeatureDetail)

  const [showEffectsPopup, setShowEffectsPopup] = createSignal(false);
  const [popupFeature, setPopupFeature] = createSignal<FeatureDetail>({ id: '', name: '', description: '' });

  const openEffectsEditor = () => {
    const name = ((FeatFormGroup.get('name') as string) || '').trim();
    // The popup only hydrates a named feature (an empty name means "add mode"), so an
    // unnamed feat would open blank and could wipe effects it never loaded.
    if (!name) {
      addSnackbar({ message: 'Name your feat on the Identity step first', severity: 'warning' });
      setStep(FeatWizardStep.Identity);
      return;
    }
    const metadata = FeatFormGroup.get('metadata') as FeatureMetadata | undefined;
    setPopupFeature({
      id: (FeatFormGroup.get('id') as string) || '',
      name,
      description: (FeatFormGroup.get('description') as string) || '',
      ...(metadata ? { metadata: structuredClone(metadata) } : {}),
    });
    setShowEffectsPopup(true);
  };

  const onEffectsSaved = (data: FeatureDetail) => {
    batch(() => {
      // The popup's Details tab edits the same feature, so carry its edits back — but
      // never let a blank popup field wipe what the Identity step holds.
      if (data.name?.trim()) setField('name', data.name);
      if (data.description?.trim()) setField('description', data.description);
      setField('metadata', data.metadata);
    });
  };

  // ---------------------------------------------------------------------------
  // Publish / delete

  const publish = async () => {
    const name = ((FeatFormGroup.get('name') as string) || '').trim();
    if (!name) {
      addSnackbar({ message: 'Name your feat on the Identity step first', severity: 'warning' });
      setStep(FeatWizardStep.Identity);
      return;
    }
    addSnackbar({ message: 'Publishing feat...', severity: 'info' });
    const data = toDataFeat(collectForm(FeatFormGroup));
    const editKey = editName().trim().toLowerCase();
    // Duplicate guard: block only when the name collides with a feat we're NOT editing.
    const looseExists = (homebrewManager.feats() as LoadedFeat[])
      .some(f => featName(f).toLowerCase() === name.toLowerCase());
    if (looseExists && name.toLowerCase() !== editKey) {
      addSnackbar({ message: `A feat named ${name} already exists`, severity: 'warning' });
      return;
    }
    // Dexie keys feats by name, so renaming an edited feat publishes a NEW record and
    // leaves the old-named row behind (Delete on Review removes it) — same as spells.
    // Update-vs-add follows the manager's exact-name check so an update can't silently no-op.
    const exactExists = (homebrewManager.feats() as LoadedFeat[]).some(f => featName(f) === data.name);
    await (exactExists
      ? homebrewManager.updateFeat(data as unknown as Feat)
      : homebrewManager.addFeat(data as unknown as Feat));
    // The manager resolves even when Dexie fails (it snackbars the error itself) — only
    // treat the publish as done once the feat is actually in the live list.
    if (!(homebrewManager.feats() as LoadedFeat[]).some(f => featName(f) === data.name)) {
      addSnackbar({ message: 'Saving the feat failed — it was NOT stored', severity: 'error' });
      return;
    }
    draftStorage.remove(storageKey());
    addSnackbar({ message: `${name} published`, severity: 'success' });
    navigate('/homebrew');
  };

  const deleteFeat = async () => {
    const target = storedMatch();
    if (!target) return;
    await homebrewManager.removeFeat(featName(target));
    draftStorage.remove(storageKey());
    navigate('/homebrew');
  };

  // ---------------------------------------------------------------------------
  // Test instrumentation: aggregate reactive snapshot for unit tests

  const [debugSnapshot, setDebugSnapshot] = createSignal({
    name: '', description: '', prereqs: '', mads: ''
  });
  createEffect(() => {
    setDebugSnapshot({
      name: (FeatFormGroup.get('name') as string) || '',
      description: (FeatFormGroup.get('description') as string) || '',
      prereqs: ((FeatFormGroup.get('prerequisites') as Prerequisite[]) ?? []).map(p => p.value).join('|'),
      mads: formMads(FeatFormGroup).map(m => m.command).join(','),
    });
  });

  onMount(() => {
    // A feat handed off from the Grimoire assistant's "Edit manually" isn't saved yet, so
    // it can't be looked up by name — load the entity directly. The one-shot take() means
    // this can only fire once; the ?name= edit path covers everything else.
    const draft = takeEditHandoff<Feat>("feat");
    if (draft) {
      prefillForm(draft);
      setPrefilled(true);
      setBaseline(serializeDraft(FeatFormGroup, step()));
    }
    document.body.classList.add('feats-bg');
  });

  onCleanup(() => {
    document.body.classList.remove('feats-bg');
  });

  // ---------------------------------------------------------------------------

  const eyebrowName = () => ((FeatFormGroup.get('name') as string) || '').trim() || 'New Feat';

  const stepProps = {
    formGroup: FeatFormGroup,
    goToStep: (s: FeatWizardStep) => setStep(s),
    openEffectsEditor,
    publish,
    deleteFeat,
    isExisting,
  };

  return (
    <Container
      theme="surface"
      class={styles.wizard}
      data-testid="feat-form"
      data-name={debugSnapshot().name}
      data-description={debugSnapshot().description}
      data-prereqs={debugSnapshot().prereqs}
      data-mads={debugSnapshot().mads}
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
        status={(s) => stepStatus(s, FeatFormGroup)}
        onJump={(s) => setStep(s)}
      />

      <Switch>
        <Match when={step() === FeatWizardStep.Identity}><StepIdentity {...stepProps} /></Match>
        <Match when={step() === FeatWizardStep.Prerequisites}><StepPrerequisites {...stepProps} /></Match>
        <Match when={step() === FeatWizardStep.Effects}><StepEffects {...stepProps} /></Match>
        <Match when={step() === FeatWizardStep.Review}><StepReview {...stepProps} /></Match>
      </Switch>

      <WizardFooter
        step={step()}
        featName={(FeatFormGroup.get('name') as string) || ''}
        onBack={() => setStep(s => Math.max(FeatWizardStep.Identity, s - 1) as FeatWizardStep)}
        onNext={() => {
          if (step() === FeatWizardStep.Review) {
            void publish();
          } else {
            setStep(s => Math.min(FeatWizardStep.Review, s + 1) as FeatWizardStep);
          }
        }}
      />

      <FeaturesPopup
        Show={[showEffectsPopup, setShowEffectsPopup]}
        feature={[popupFeature, setPopupFeature]}
        isEdit={() => true}
        onClose={onEffectsSaved}
        context={{ kind: 'Feat' }}
      />
    </Container>
  );
};

export default Feats;
