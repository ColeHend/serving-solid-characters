import { Component } from 'solid-js';
import { BACKGROUND_STEPS, BackgroundWizardStep, STEP_META } from './wizard.shared';
import styles from '../../classes/wizard/classesWizard.module.scss';

// Thin sibling of the class wizard's WizardFooter, typed to the background step enum.

interface WizardFooterProps {
  step: BackgroundWizardStep;
  backgroundName: string;
  onBack: () => void;
  /** Advances to the next step; on the Review step this is the publish action. */
  onNext: () => void;
}

export const WizardFooter: Component<WizardFooterProps> = (props) => {
  const nextLabel = () => {
    if (props.step === BackgroundWizardStep.Review) return `Publish ${props.backgroundName.trim() || 'background'}`;
    if (props.step === BackgroundWizardStep.Features) return 'Review →';
    return `Continue to ${STEP_META[(props.step + 1) as BackgroundWizardStep].label} →`;
  };
  return (
    <div class={styles.footer}>
      <button
        type="button"
        class={styles.backBtn}
        disabled={props.step === BackgroundWizardStep.Identity}
        onClick={() => props.onBack()}
      >
        ← Back
      </button>
      <span class={styles.footerCenter}>
        Step {props.step + 1} of {BACKGROUND_STEPS.length} · everything autosaves
      </span>
      <button type="button" class={styles.nextBtn} onClick={() => props.onNext()}>
        {nextLabel()}
      </button>
    </div>
  );
};
