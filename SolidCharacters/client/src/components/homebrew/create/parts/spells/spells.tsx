import { Component, Match, Show, Switch, batch, createEffect, createMemo, createSignal, onCleanup, onMount } from "solid-js";
import { useNavigate, useSearchParams } from "@solidjs/router";
import { Button, Container, FormGroup, Validators, addSnackbar } from "coles-solid-library";
import { homebrewManager } from "../../../../../shared/customHooks/homebrewManager";
import { useDnDSpells } from "../../../../../shared/customHooks/dndInfo/info/all/spells";
import { useDnDClasses } from "../../../../../shared/customHooks/dndInfo/info/all/classes";
import { defaultEditionKey, editionToLegacy } from "../../../../../shared/customHooks/dndInfo/info/edition";
import { Spell } from "../../../../../models/generated";
import { takeEditHandoff } from "../../../../../shared/ai/editHandoff";
import {
  STEP_META,
  SpellForm,
  SpellWizardStep,
  collectForm,
  draftStorage,
  hydrateDraft,
  parseDraft,
  serializeDraft,
  spellDraftKey,
  stepStatus,
  toDataSpell,
} from "./wizard/wizard.shared";
import { Stepper } from "./wizard/stepper";
import { WizardFooter } from "./wizard/wizardFooter";
import { StepIdentity } from "./wizard/stepIdentity";
import { StepCasting } from "./wizard/stepCasting";
import { StepClasses } from "./wizard/stepClasses";
import { StepReview } from "./wizard/stepReview";
import styles from "../classes/wizard/classesWizard.module.scss";

type ResumeState = 'none' | 'pending' | 'resumed' | 'discarded';

const Spells: Component = () => {
  const allSpells = useDnDSpells();
  const allClasses = useDnDClasses();
  const [searchParams] = useSearchParams<{ name: string }>();
  const navigate = useNavigate();

  const SpellFormGroup = new FormGroup<SpellForm>({
    name: ['', [Validators.Required]],
    level: ['0', []],
    school: ['', []],
    description: ['', []],
    higherLevel: ['', []],
    castingTime: ['', []],
    range: ['', []],
    duration: ['', []],
    concentration: [false, []],
    ritual: [false, []],
    isVerbal: [false, []],
    isSomatic: [false, []],
    isMaterial: [false, []],
    materialsNeeded: ['', []],
    classes: [[], []],
    id: ['', []],
    components: ['', []],
    damageType: ['', []],
    page: ['', []],
    subClasses: [[], []],
    legacy: [editionToLegacy(defaultEditionKey()), []],
    source: ['', []],
  });

  const setField = <K extends keyof SpellForm>(key: K, value: SpellForm[K]) =>
    SpellFormGroup.set(key, value);

  const [step, setStep] = createSignal<SpellWizardStep>(SpellWizardStep.Identity);

  const paramString = (value: string | string[] | undefined) => {
    if (typeof value === 'string') return value;
    return value?.join(' ') ?? '';
  };
  const editName = () => paramString(searchParams.name);
  const storageKey = () => spellDraftKey(editName());

  const classNames = createMemo(() => allClasses().map(c => c.name));

  // The stored homebrew spell the current name points at (live via homebrewManager —
  // the useDnD* homebrew snapshot never sees in-session mutations). Matched loosely,
  // but deletes/updates go through the stored EXACT name, which is what Dexie keys on.
  const storedMatch = createMemo(() => {
    const name = ((SpellFormGroup.get('name') as string) || '').trim().toLowerCase();
    return name ? homebrewManager.spells().find(s => (s.name || '').toLowerCase() === name) : undefined;
  });
  const isExisting = () => !!storedMatch();

  // ---------------------------------------------------------------------------
  // Prefill (?name= edit mode + AI "Edit manually" handoff)

  const prefillForm = (found: Spell) => {
    batch(() => {
      setField('name', found.name || '');
      setField('level', found.level || '0');
      setField('school', found.school || '');
      setField('description', found.description || '');
      setField('higherLevel', found.higherLevel || '');
      setField('castingTime', found.castingTime || '');
      setField('range', found.range || '');
      setField('duration', found.duration || '');
      setField('concentration', !!found.concentration);
      setField('ritual', !!found.ritual);
      setField('isVerbal', !!found.isVerbal);
      setField('isSomatic', !!found.isSomatic);
      setField('isMaterial', !!found.isMaterial);
      setField('materialsNeeded', found.materialsNeeded || '');
      setField('classes', [...(found.classes ?? [])]);
      setField('id', found.id || '');
      setField('components', found.components || '');
      setField('damageType', found.damageType || '');
      setField('page', found.page || '');
      setField('subClasses', [...(found.subClasses ?? [])]);
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
  const [baseline, setBaseline] = createSignal(serializeDraft(SpellFormGroup, step()));

  const resumeDraft = () => {
    const draft = pendingDraft();
    if (!draft) return;
    hydrateDraft(SpellFormGroup, draft);
    setStep(draft.step);
    setPrefilled(true); // draft wins over ?name= prefill
    setResumeState('resumed');
    setBaseline(serializeDraft(SpellFormGroup, step()));
  };

  const discardDraft = () => {
    draftStorage.remove(storageKey());
    setPendingDraft(null);
    setResumeState('discarded');
  };

  let autosaveTimer: ReturnType<typeof setTimeout> | undefined;
  createEffect(() => {
    const snapshot = serializeDraft(SpellFormGroup, step());
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

  // Reactive prefill: wait until the search param and spell catalogs are available.
  // Homebrew wins over an SRD spell of the same name, like the old page.
  const [prefilled, setPrefilled] = createSignal(false);
  createEffect(() => {
    if (prefilled() || resumeState() === 'pending') return;
    const target = editName().trim().toLowerCase();
    if (!target) return;
    const stored = homebrewManager.spells().find(s => (s.name || '').toLowerCase() === target);
    const found = stored ?? allSpells().find(s => (s.name || '').toLowerCase() === target);
    if (found) {
      prefillForm(found);
      setPrefilled(true);
      setBaseline(serializeDraft(SpellFormGroup, step()));
    }
  });

  // ---------------------------------------------------------------------------
  // Publish / delete

  const publish = async () => {
    const name = ((SpellFormGroup.get('name') as string) || '').trim();
    if (!name) {
      addSnackbar({ message: 'Name your spell on the Identity step first', severity: 'warning' });
      setStep(SpellWizardStep.Identity);
      return;
    }
    addSnackbar({ message: 'Publishing spell...', severity: 'info' });
    const data = toDataSpell(collectForm(SpellFormGroup));
    const editKey = editName().trim().toLowerCase();
    // Duplicate guard: block only when the name collides with a spell we're NOT editing.
    const looseExists = homebrewManager.spells().some(s => (s.name || '').toLowerCase() === name.toLowerCase());
    if (looseExists && name.toLowerCase() !== editKey) {
      addSnackbar({ message: `A spell named ${name} already exists`, severity: 'warning' });
      return;
    }
    // Dexie keys spells by name, so renaming an edited spell publishes a NEW record and
    // leaves the old-named row behind (Delete on Review removes it) — same as subclasses.
    // Update-vs-add follows the manager's exact-name check so an update can't silently no-op.
    const exactExists = homebrewManager.spells().some(s => s.name === data.name);
    await (exactExists ? homebrewManager.updateSpell(data) : homebrewManager.addSpell(data));
    // The manager resolves even when Dexie fails (it snackbars the error itself) — only
    // treat the publish as done once the spell is actually in the live list.
    if (!homebrewManager.spells().some(s => s.name === data.name)) {
      addSnackbar({ message: 'Saving the spell failed — it was NOT stored', severity: 'error' });
      return;
    }
    draftStorage.remove(storageKey());
    addSnackbar({ message: `${name} published`, severity: 'success' });
    navigate('/homebrew');
  };

  const deleteSpell = async () => {
    const target = storedMatch();
    if (!target) return;
    await homebrewManager.removeSpell(target.name);
    draftStorage.remove(storageKey());
    navigate('/homebrew');
  };

  // ---------------------------------------------------------------------------
  // Test instrumentation: aggregate reactive snapshot for unit tests

  const [debugSnapshot, setDebugSnapshot] = createSignal({
    name: '', level: '', school: '', classes: ''
  });
  createEffect(() => {
    setDebugSnapshot({
      name: (SpellFormGroup.get('name') as string) || '',
      level: (SpellFormGroup.get('level') as string) || '',
      school: (SpellFormGroup.get('school') as string) || '',
      classes: ((SpellFormGroup.get('classes') as string[]) ?? []).join(','),
    });
  });

  onMount(() => {
    // A spell handed off from the Grimoire assistant's "Edit manually" isn't saved yet, so
    // it can't be looked up by name — load the entity directly. The one-shot take() means
    // this can only fire once; the ?name= edit path covers everything else.
    const draft = takeEditHandoff<Spell>("spell");
    if (draft) {
      prefillForm(draft);
      setPrefilled(true);
      setBaseline(serializeDraft(SpellFormGroup, step()));
    }
    document.body.classList.add('spells-bg');
  });

  onCleanup(() => {
    document.body.classList.remove('spells-bg');
  });

  // ---------------------------------------------------------------------------

  const eyebrowName = () => ((SpellFormGroup.get('name') as string) || '').trim() || 'New Spell';

  const stepProps = {
    formGroup: SpellFormGroup,
    allSpells: allSpells as unknown as () => Spell[],
    classNames,
    goToStep: (s: SpellWizardStep) => setStep(s),
    publish,
    deleteSpell,
    isExisting,
  };

  return (
    <Container
      theme="surface"
      class={styles.wizard}
      data-testid="spell-form"
      data-name={debugSnapshot().name}
      data-level={debugSnapshot().level}
      data-school={debugSnapshot().school}
      data-classes={debugSnapshot().classes}
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
        status={(s) => stepStatus(s, SpellFormGroup)}
        onJump={(s) => setStep(s)}
      />

      <Switch>
        <Match when={step() === SpellWizardStep.Identity}><StepIdentity {...stepProps} /></Match>
        <Match when={step() === SpellWizardStep.Casting}><StepCasting {...stepProps} /></Match>
        <Match when={step() === SpellWizardStep.Classes}><StepClasses {...stepProps} /></Match>
        <Match when={step() === SpellWizardStep.Review}><StepReview {...stepProps} /></Match>
      </Switch>

      <WizardFooter
        step={step()}
        spellName={(SpellFormGroup.get('name') as string) || ''}
        onBack={() => setStep(s => Math.max(SpellWizardStep.Identity, s - 1) as SpellWizardStep)}
        onNext={() => {
          if (step() === SpellWizardStep.Review) {
            void publish();
          } else {
            setStep(s => Math.min(SpellWizardStep.Review, s + 1) as SpellWizardStep);
          }
        }}
      />
    </Container>
  );
};

export default Spells;
