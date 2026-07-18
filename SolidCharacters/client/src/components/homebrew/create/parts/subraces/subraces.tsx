import { Component, Match, Show, Switch, batch, createEffect, createMemo, createSignal, onCleanup, onMount, runWithOwner } from "solid-js";
import { createStore, unwrap } from "solid-js/store";
import { useNavigate, useSearchParams } from "@solidjs/router";
import { Button, Container, FormGroup, Validators, addSnackbar } from "coles-solid-library";
import { homebrewManager } from "../../../../../shared/customHooks/homebrewManager";
import { useGetSrdRaces } from "../../../../../shared/customHooks/dndInfo/info/srd/races";
import getUserSettings from "../../../../../shared/customHooks/userSettings";
import { FeatureDetail, Race, Subrace } from "../../../../../models/generated";
import { createNewId } from "../../../../../shared/customHooks/utility/tools/idGen";
import { FeaturesPopup } from "../../../Parts/featuresPopup/featuresPopup";
import { hydrateBonuses, hydrateTraits, mergeDescriptions, parseSizes, pickDescription, toSubrace } from "./subraceAdapter";
import {
  RaceExtras,
  STEP_META,
  SubraceForm,
  SubraceWizardStep,
  bonusLabel,
  draftStorage,
  emptyExtras,
  hydrateDraft,
  parseDraft,
  raceSelectorKey,
  serializeDraft,
  stepStatus,
  subraceDraftKey,
  toRaceOption,
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

const Subraces: Component = () => {
  const [userSettings] = getUserSettings();
  // SRD races for the active ruleset + the LIVE homebrew list. (useDnDRaces' homebrew
  // source snapshots Dexie once at first use, so a race created this session would be
  // missing from it; homebrewManager.races() is the signal its mutations update.)
  const parentCatalog = createMemo(() => {
    const version = userSettings().dndSystem || '2014';
    const srd = useGetSrdRaces(version);
    return [...srd(), ...homebrewManager.races()];
  });
  const raceOptions = () => parentCatalog().map(toRaceOption);
  const [searchParams, setSearchParams] = useSearchParams<{ race: string; subrace: string }>();
  const navigate = useNavigate();

  const SubraceFormGroup = new FormGroup<SubraceForm>({
    parentRaceKey: ['', [Validators.Required]],
    parentRaceName: ['', []],
    name: ['', [Validators.Required]],
    desc: ['', []],
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

  const setField = <K extends keyof SubraceForm>(key: K, value: SubraceForm[K]) =>
    SubraceFormGroup.set(key, value);

  const [step, setStep] = createSignal<SubraceWizardStep>(SubraceWizardStep.Identity);
  const [extras, setExtras] = createStore<RaceExtras>(emptyExtras());

  const paramString = (value: string | string[] | undefined) => {
    if (typeof value === 'string') return value;
    return value?.join(' ') ?? '';
  };
  const editRace = () => paramString(searchParams.race);
  const editSubrace = () => paramString(searchParams.subrace);
  const storageKey = () => subraceDraftKey(editRace(), editSubrace());

  /** Resolve a ?race= name to a race entity — homebrew rows win over same-named SRD ones
   *  (matches the old editor, which only offered homebrew parents). */
  const findParentByName = (nameLower: string): Race | undefined =>
    homebrewManager.races().find(r => (r.name || '').toLowerCase() === nameLower)
      ?? parentCatalog().find(r => (r.name || '').toLowerCase() === nameLower);

  // ---------------------------------------------------------------------------
  // Prefill (?race=&subrace= edit mode; ?race= alone preselects the parent)

  // When the stored parent can't be resolved (its race was deleted, or an SRD id from
  // the other ruleset), the parent fields stay blank and Identity forces a re-pick.
  const prefillForm = (parent: Race | undefined, found: Subrace) => {
    batch(() => {
      setField('parentRaceKey', parent ? raceSelectorKey(parent) : '');
      setField('parentRaceName', parent?.name ?? '');
      setField('name', found.name || '');
      setField('desc', pickDescription(found, 'desc'));
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
  const [baseline, setBaseline] = createSignal(serializeDraft(SubraceFormGroup, extras, step()));

  const resumeDraft = () => {
    const draft = pendingDraft();
    if (!draft) return;
    hydrateDraft(SubraceFormGroup, draft);
    setExtras(draft.extras);
    setStep(draft.step);
    setPrefilledTarget(prefillTarget()); // draft wins over ?race=&subrace= prefill
    setResumeState('resumed');
    setBaseline(serializeDraft(SubraceFormGroup, extras, step()));
  };

  const discardDraft = () => {
    draftStorage.remove(storageKey());
    setPendingDraft(null);
    setResumeState('discarded');
  };

  let autosaveTimer: ReturnType<typeof setTimeout> | undefined;
  createEffect(() => {
    const snapshot = serializeDraft(SubraceFormGroup, extras, step());
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

  // Reactive prefill: a deep link on a hard reload races the async Dexie hydration,
  // so keep retrying until the target rows show up. Keyed by the edit target (not a
  // boolean) so the Identity step's edit picker can retarget the wizard in place.
  const prefillTarget = () => `${editRace().trim().toLowerCase()}::${editSubrace().trim().toLowerCase()}`;
  const [prefilledTarget, setPrefilledTarget] = createSignal<string | null>(null);
  createEffect(() => {
    if (resumeState() === 'pending') return;
    const target = prefillTarget();
    if (prefilledTarget() === target) return;
    const raceName = editRace().trim().toLowerCase();
    const subName = editSubrace().trim().toLowerCase();
    if (subName) {
      // The subraces table is name-keyed, so the name alone identifies the row.
      // Resolving through the parent name instead breaks when a same-named race
      // shadows the original parent (homebrew Elf vs SRD Elf) or the active
      // ruleset changed (2014/2024 SRD ids differ).
      const found = homebrewManager.subraces().find(s => (s.name || '').toLowerCase() === subName);
      if (!found) return; // keep waiting for subrace hydration
      const parent = parentCatalog().find(r => r.id === found.parentRace)
        ?? (raceName ? findParentByName(raceName) : undefined);
      prefillForm(parent, found);
    } else if (raceName) {
      // Parent-only deep link: preselect the parent race for a new subrace.
      const parent = findParentByName(raceName);
      if (!parent) return; // keep waiting for catalog/Dexie hydration
      batch(() => {
        setField('parentRaceKey', raceSelectorKey(parent));
        setField('parentRaceName', parent.name);
      });
    } else {
      return; // nothing to prefill
    }
    setPrefilledTarget(target);
    setBaseline(serializeDraft(SubraceFormGroup, extras, step()));
  });

  // ---------------------------------------------------------------------------
  // Existing-lineage picker (Identity step) — the wizard's edit affordance. The
  // old editor had an in-page subrace Select; without one, a published subrace
  // could never be reopened (nothing else in the app links with ?subrace=).

  const selectedParent = () =>
    parentCatalog().find(r => raceSelectorKey(r) === ((SubraceFormGroup.get('parentRaceKey') as string) || ''));

  const subraceOptions = () => {
    const parent = selectedParent();
    return parent
      ? homebrewManager.subraces().filter(s => s.parentRace === parent.id).map(s => s.name)
      : [];
  };

  const resetForNew = () => {
    batch(() => {
      setField('name', '');
      setField('desc', '');
      setField('source', '');
      setField('size', []);
      setField('speed', 30);
      setField('languages', []);
      setField('langChoiceAmount', 0);
      setField('langChoiceOptions', []);
      setField('abilityBonuses', []);
      setField('descAge', '');
      setField('descAlignment', '');
      setField('descSize', '');
      setField('descLanguage', '');
      setField('descAbilities', '');
      setExtras(emptyExtras());
    });
  };

  // Retargets the wizard through the search params so the prefill effect, draft key
  // and publish's existing-row resolution all follow. runWithOwner(null) + echo guard:
  // the coles Select fires onChange from a tracked effect.
  const onPickSubrace = (name: string) => runWithOwner(null, () => {
    if (name === (editSubrace() || '')) return; // Select echo of the current value
    const parentName = (SubraceFormGroup.get('parentRaceName') as string) || editRace();
    if (!name) resetForNew(); // "+ New Subrace": keep the parent, blank the rest
    setSearchParams({ race: parentName, subrace: name || undefined });
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
    const name = ((SubraceFormGroup.get('name') as string) || '').trim();
    const parent = selectedParent();
    if (!name || !parent) {
      addSnackbar({
        message: !parent
          ? 'Pick a parent race on the Identity step first'
          : 'Give the subrace a name on the Identity step first',
        severity: 'warning',
      });
      setStep(SubraceWizardStep.Identity);
      return;
    }
    if (!parent.id) {
      addSnackbar({ message: 'The parent race has no id — republish it first', severity: 'warning' });
      return;
    }
    // The homebrew row being edited (?subrace= target). The subraces table is
    // name-keyed, so the name alone identifies the row — resolving through the
    // parent by name breaks when a same-named race shadows the original parent.
    // Keeping the row's id means saveSubrace updates in place even on re-parent.
    const editTarget = editSubrace().trim().toLowerCase();
    const existing = editTarget
      ? homebrewManager.subraces().find(s => (s.name || '').toLowerCase() === editTarget)
      : undefined;
    // Duplicate guard: the Dexie subraces table is keyed by NAME alone, so a same-name
    // row — even under another parent race — would be silently overwritten by a save.
    const collides = homebrewManager.subraces().some(s =>
      (s.name || '').toLowerCase() === name.toLowerCase() && (!existing || s.id !== existing.id));
    if (collides) {
      addSnackbar({ message: 'Subrace name already exists', severity: 'warning' });
      return;
    }
    addSnackbar({ message: 'Publishing subrace...', severity: 'info' });
    const built = toSubrace(SubraceFormGroup, unwrap(extras), parent.id, existing?.id);
    // Spread over the existing row so fields the wizard has no UI for survive the
    // update; descriptions keep unknown keys but drop the alternate spellings the
    // canonical keys replace (see mergeDescriptions).
    const subrace: Subrace = existing
      ? { ...existing, ...built, descriptions: mergeDescriptions(existing.descriptions, built.descriptions) }
      : built;
    // saveSubrace upserts (matched by id, then (parentRace, name)), handles renames
    // itself, and returns false after toasting its own error snackbar.
    const saved = await homebrewManager.saveSubrace(subrace);
    if (!saved) return;
    addSnackbar({ message: existing ? 'Subrace updated' : 'Subrace created', severity: 'success' });
    draftStorage.remove(storageKey());
    navigate('/homebrew');
  };

  // ---------------------------------------------------------------------------
  // Test instrumentation: aggregate reactive snapshot for unit tests

  const [debugSnapshot, setDebugSnapshot] = createSignal({
    parent: '', name: '', sizes: '', speed: '', abilities: '', languages: '', traits: ''
  });
  createEffect(() => {
    setDebugSnapshot({
      parent: (SubraceFormGroup.get('parentRaceName') as string) || '',
      name: (SubraceFormGroup.get('name') as string) || '',
      sizes: ((SubraceFormGroup.get('size') as string[]) ?? []).join(','),
      speed: String((SubraceFormGroup.get('speed') as number) ?? ''),
      abilities: ((SubraceFormGroup.get('abilityBonuses') as SubraceForm['abilityBonuses']) ?? []).map(bonusLabel).join(','),
      languages: ((SubraceFormGroup.get('languages') as string[]) ?? []).join(','),
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

  const eyebrowName = () => ((SubraceFormGroup.get('name') as string) || '').trim() || 'New Subrace';

  const stepProps = {
    formGroup: SubraceFormGroup,
    extras,
    setExtras,
    raceOptions,
    subraceOptions,
    subracePickerValue: () => editSubrace(),
    onPickSubrace,
    goToStep: (s: SubraceWizardStep) => setStep(s),
    openAddFeature,
    openEditFeature,
    publish,
  };

  return (
    <Container
      theme="surface"
      class={styles.wizard}
      data-testid="subrace-form"
      data-parent={debugSnapshot().parent}
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
        status={(s) => stepStatus(s, SubraceFormGroup, extras)}
        onJump={(s) => setStep(s)}
      />

      <Switch>
        <Match when={step() === SubraceWizardStep.Identity}><StepIdentity {...stepProps} /></Match>
        <Match when={step() === SubraceWizardStep.AbilityBonuses}><StepAbilityBonuses {...stepProps} /></Match>
        <Match when={step() === SubraceWizardStep.Languages}><StepLanguages {...stepProps} /></Match>
        <Match when={step() === SubraceWizardStep.Traits}><StepTraits {...stepProps} /></Match>
        <Match when={step() === SubraceWizardStep.Flavor}><StepFlavor {...stepProps} /></Match>
        <Match when={step() === SubraceWizardStep.Review}><StepReview {...stepProps} /></Match>
      </Switch>

      <WizardFooter
        step={step()}
        subraceName={(SubraceFormGroup.get('name') as string) || ''}
        onBack={() => setStep(s => Math.max(SubraceWizardStep.Identity, s - 1) as SubraceWizardStep)}
        onNext={() => {
          if (step() === SubraceWizardStep.Review) {
            void publish();
          } else {
            setStep(s => Math.min(SubraceWizardStep.Review, s + 1) as SubraceWizardStep);
          }
        }}
      />

      <FeaturesPopup
        Show={[showFeaturePopup, setShowFeaturePopup]}
        feature={[currentFeature, setCurrentFeature]}
        isEdit={() => !!featureTarget().editId}
        onClose={onFeatureSaved}
        context={{
          kind: 'Subrace trait',
          className: ((SubraceFormGroup.get('name') as string) || '').trim() || undefined,
        }}
      />
    </Container>
  );
};

export default Subraces;
