import { Component, Match, Show, Switch, createEffect, createSignal, on, onCleanup, onMount } from 'solid-js';
import { unwrap } from 'solid-js/store';
import { useNavigate, useSearchParams } from '@solidjs/router';
import { Container, addSnackbar } from 'coles-solid-library';
import { homebrewManager } from '../../../../../shared';
import { FeaturesPopup } from '../../../Parts/featuresPopup/featuresPopup';
import { FeatureDetail } from '../../../../../models/generated';
import { Feature, FeatureTypes } from '../../../../../models/old/core.model';
import { itemsStore } from './itemsStore';
import {
  ITEM_STEPS,
  ItemsWizardStep,
  STEP_META,
  errorsForStep,
  itemStepStatus,
} from './wizard/wizard.shared';
import { Stepper } from './wizard/stepper';
import { WizardFooter } from './wizard/wizardFooter';
import { StepIdentity } from './wizard/stepIdentity';
import { StepDetails } from './wizard/stepDetails';
import { StepFeatures } from './wizard/stepFeatures';
import { StepReview } from './wizard/stepReview';
import wizardStyles from '../classes/wizard/classesWizard.module.scss';
import styles from './wizard/itemsWizard.module.scss';

// Items creator — the same step-wizard shell as the subclass/class creators, sitting on
// top of the itemsStore singleton (state, validation and persistence are unchanged).
const Items: Component = () => {
  const store = itemsStore;
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [step, setStep] = createSignal<ItemsWizardStep>(ItemsWizardStep.Identity);

  // Steps the user has actually navigated to — Details/Features only earn their checkmark
  // once visited (or genuinely filled). Editing a saved item is handled by visitedSteps().
  const [visited, setVisited] = createSignal<ReadonlySet<ItemsWizardStep>>(
    new Set([ItemsWizardStep.Identity]),
  );
  const ALL_VISITED: ReadonlySet<ItemsWizardStep> = new Set(ITEM_STEPS);
  // Loading any existing item means its fields are already filled, so every step counts as
  // visited. Derived from the store (not set in the selectionVersion effect below) because
  // that effect first subscribes after the ?name= prefill has already select()ed — it never
  // fires for the initial deep-link load.
  const visitedSteps = (): ReadonlySet<ItemsWizardStep> =>
    store.state.selection.activeName !== '__new__' && store.state.form
      ? ALL_VISITED
      : visited();

  createEffect(() => {
    const s = step();
    setVisited(prev => (prev.has(s) ? prev : new Set(prev).add(s)));
  });

  store.loadSrdOnce();

  const paramName = () =>
    typeof searchParams.name === 'string' ? searchParams.name : searchParams.name?.join(' ');

  onMount(() => {
    document.body.classList.add('items-bg');
    // No deep link → make sure something is on the anvil (the store singleton may
    // still hold the draft from a previous visit).
    if (!paramName() && !store.state.form) store.selectNew();
  });

  // Reactive ?name= prefill: on a cold load the SRD poll and Dexie's homebrew load both
  // finish after mount, so keep trying until the target exists somewhere (subclass-wizard
  // idiom). The live manager signal is the reactive trigger for late-arriving homebrew.
  const [prefilled, setPrefilled] = createSignal(false);
  createEffect(() => {
    if (prefilled()) return;
    const target = paramName();
    if (!target) return;
    if (store.state.selection.activeName === target) {
      setPrefilled(true);
      return;
    }
    const live = homebrewManager.items().find(i => i?.name === target);
    if (!store.state.homebrew[target] && live) store.refreshHomebrew();
    if (store.state.homebrew[target] || store.state.srd[target]) {
      store.select(target);
      setPrefilled(true);
    }
  });

  onCleanup(() => {
    document.body.classList.remove('items-bg');
  });

  // Loading a different item mid-flight returns to Identity and clears navigation history —
  // a fresh entity shouldn't leave the user parked on the previous item's Review step or
  // inherit its visited checkmarks (visitedSteps() re-adds all for saved items).
  createEffect(on(() => store.state.selectionVersion, () => {
    setStep(ItemsWizardStep.Identity);
    setVisited(new Set([ItemsWizardStep.Identity]));
  }, { defer: true }));

  const selectExisting = (val: string) => {
    if (!val || val === '__divider_homebrew__') return;
    if (val === '__new__') {
      store.selectNew();
      return;
    }
    if (searchParams.name !== val) setSearchParams({ name: val });
    store.select(val);
  };

  // ---------------------------------------------------------------------------
  // Shared FeaturesPopup (single mounted instance; the Features step opens it).
  // Items persist Feature<string,string> (name + value round-tripped through
  // properties.__draft), so the popup's FeatureDetail is adapted at this boundary;
  // popup metadata (category/mads/uses) rides along inside the feature's metadata.

  const [showFeaturePopup, setShowFeaturePopup] = createSignal(false);
  const [currentFeature, setCurrentFeature] = createSignal<FeatureDetail>({ id: '', name: '', description: '' });
  const [featureEditIndex, setFeatureEditIndex] = createSignal(-1);

  const toDetail = (f: Feature<string, string>, index: number): FeatureDetail => ({
    id: `item-feature-${index}`,
    name: f.name,
    description: f.value || '',
    metadata: f.metadata as FeatureDetail['metadata'],
  });
  const fromDetail = (data: FeatureDetail): Feature<string, string> => ({
    name: data.name,
    value: data.description || '',
    info: { className: '', subclassName: '', level: 0, type: FeatureTypes.Item, other: 'item' },
    metadata: (data.metadata ?? {}) as Feature<string, string>['metadata'],
  });

  const openAddFeature = () => {
    setFeatureEditIndex(-1);
    setCurrentFeature({ id: '', name: '', description: '' });
    setShowFeaturePopup(true);
  };
  const openEditFeature = (index: number) => {
    const f = store.state.form?.features[index];
    if (!f) return;
    // The popup structured-clones its input while hydrating the mads FormArray,
    // which throws on Solid store proxies — detach a deep copy first.
    setFeatureEditIndex(index);
    setCurrentFeature(toDetail(structuredClone(unwrap(f)), index));
    setShowFeaturePopup(true);
  };
  const onFeatureSaved = (data: FeatureDetail) => {
    if (!data.name.trim()) return;
    // The popup's metadata rides on FormArray store nodes; JSON round-trip detaches any
    // proxies so the store's structuredClone-on-mutate can't throw on later edits.
    const feat = fromDetail(JSON.parse(JSON.stringify(data)) as FeatureDetail);
    const idx = featureEditIndex();
    store.mutate(d => {
      if (idx >= 0 && idx < d.features.length) {
        const copy = [...d.features];
        copy[idx] = feat;
        d.features = copy;
      } else {
        d.features = [...d.features, feat];
      }
    });
  };

  // ---------------------------------------------------------------------------
  // Publish

  const publishLabel = () =>
    store.state.selection.activeName !== '__new__' && store.isModified()
      ? 'Update Homebrew'
      : 'Save Homebrew';

  const publish = () => {
    const res = store.persist();
    if (!res.ok) {
      const errs = res.errs ?? [];
      addSnackbar({ message: errs[0] || 'Validation failed', severity: 'warning' });
      const offending = ITEM_STEPS.find(s => errorsForStep(s, errs).length > 0);
      if (offending !== undefined) setStep(offending);
      return;
    }
    addSnackbar({ message: `${store.state.form?.name || 'Item'} saved to your homebrew`, severity: 'success' });
    navigate('/homebrew');
  };

  // ---------------------------------------------------------------------------

  const eyebrowName = () => store.state.form?.name?.trim() || 'New Item';

  const stepProps = {
    goToStep: (s: ItemsWizardStep) => setStep(s),
    selectExisting,
    openAddFeature,
    openEditFeature,
    publish,
  };

  return (
    <Container
      theme="surface"
      class={wizardStyles.wizard}
      data-testid="items-wizard"
      data-selver={store.state.selectionVersion}
      data-kind={store.state.form?.kind ?? ''}
    >
      <div class={styles.eyebrowRow}>
        <div class={wizardStyles.eyebrow}>Forging — {eyebrowName()}</div>
        <Show when={store.state.selection.activeName !== '__new__' && store.isModified()}>
          <span class={styles.modifiedBadge}>Modified</span>
        </Show>
      </div>
      <h1 class={wizardStyles.question}>{STEP_META[step()].question}</h1>
      <p class={wizardStyles.subtitle}>{STEP_META[step()].subtitle}</p>

      <Stepper
        current={step()}
        status={(s) => itemStepStatus(s, store.state.form, store.errors(), visitedSteps())}
        onJump={(s) => setStep(s)}
      />

      <Show when={store.state.status === 'loading'}>
        <div class={wizardStyles.banner}><span>Loading SRD items…</span></div>
      </Show>
      <Show when={store.state.status === 'error'}>
        <div class={`${wizardStyles.banner} ${wizardStyles.bannerWarn}`}>
          <span>Failed to load items: {store.state.error}</span>
        </div>
      </Show>

      {/* Keyed on selectionVersion so loading a different item mounts fresh step inputs
          (the old page's data-selver reset guarantee), while field edits never remount. */}
      <Show when={store.state.form ? store.state.selectionVersion + 1 : null} keyed>
        <Switch>
          <Match when={step() === ItemsWizardStep.Identity}><StepIdentity {...stepProps} /></Match>
          <Match when={step() === ItemsWizardStep.Details}><StepDetails {...stepProps} /></Match>
          <Match when={step() === ItemsWizardStep.Features}><StepFeatures {...stepProps} /></Match>
          <Match when={step() === ItemsWizardStep.Review}><StepReview {...stepProps} /></Match>
        </Switch>
      </Show>

      <WizardFooter
        step={step()}
        publishLabel={publishLabel()}
        onBack={() => setStep(s => Math.max(ItemsWizardStep.Identity, s - 1) as ItemsWizardStep)}
        onNext={() => {
          if (step() === ItemsWizardStep.Review) {
            publish();
          } else {
            setStep(s => Math.min(ItemsWizardStep.Review, s + 1) as ItemsWizardStep);
          }
        }}
      />

      <FeaturesPopup
        Show={[showFeaturePopup, setShowFeaturePopup]}
        feature={[currentFeature, setCurrentFeature]}
        isEdit={() => featureEditIndex() >= 0}
        onClose={onFeatureSaved}
      />
    </Container>
  );
};

export default Items;
