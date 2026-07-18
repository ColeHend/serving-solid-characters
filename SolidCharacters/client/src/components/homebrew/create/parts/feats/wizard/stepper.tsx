import { Component, For, Show } from 'solid-js';
import { STEP_META, StepStatus, FEAT_STEPS, FeatWizardStep } from './wizard.shared';
import styles from '../../classes/wizard/classesWizard.module.scss';

// Thin sibling of the class wizard's Stepper — same markup and styles, typed to the
// feat step enum (distinct enums aren't assignable, so sharing one component would
// force casts at every call site).

interface StepperProps {
  current: FeatWizardStep;
  status: (step: FeatWizardStep) => StepStatus;
  onJump: (step: FeatWizardStep) => void;
}

export const Stepper: Component<StepperProps> = (props) => {
  const stateClass = (step: FeatWizardStep) => {
    if (step === props.current) return styles.stepCurrent;
    const status = props.status(step);
    if (status === 'complete') return styles.stepDone;
    if (status === 'warning') return styles.stepWarn;
    return '';
  };
  return (
    <div class={styles.stepper} role="navigation" aria-label="Wizard steps">
      <For each={FEAT_STEPS}>{(step, i) => (
        <>
          <Show when={i() > 0}>
            <div class={`${styles.connector} ${props.status(FEAT_STEPS[i() - 1]) === 'complete' ? styles.connectorDone : ''}`} />
          </Show>
          <button
            type="button"
            class={`${styles.stepperItem} ${stateClass(step)}`}
            aria-current={step === props.current ? 'step' : undefined}
            onClick={() => props.onJump(step)}
          >
            <span class={styles.stepCircle}>
              {props.status(step) === 'complete' && step !== props.current ? '✓' : step + 1}
            </span>
            <span class={styles.stepLabel}>{STEP_META[step].label}</span>
          </button>
        </>
      )}</For>
    </div>
  );
};
