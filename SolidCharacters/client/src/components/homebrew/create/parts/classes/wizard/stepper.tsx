import { Component, For, Show } from 'solid-js';
import { STEP_META, StepStatus, WIZARD_STEPS, WizardStep } from './wizard.shared';
import styles from './classesWizard.module.scss';

interface StepperProps {
  current: WizardStep;
  status: (step: WizardStep) => StepStatus;
  onJump: (step: WizardStep) => void;
}

export const Stepper: Component<StepperProps> = (props) => {
  const stateClass = (step: WizardStep) => {
    if (step === props.current) return styles.stepCurrent;
    const status = props.status(step);
    if (status === 'complete') return styles.stepDone;
    if (status === 'warning') return styles.stepWarn;
    return '';
  };
  return (
    <div class={styles.stepper} role="navigation" aria-label="Wizard steps">
      <For each={WIZARD_STEPS}>{(step, i) => (
        <>
          <Show when={i() > 0}>
            <div class={`${styles.connector} ${props.status(WIZARD_STEPS[i() - 1]) === 'complete' ? styles.connectorDone : ''}`} />
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
