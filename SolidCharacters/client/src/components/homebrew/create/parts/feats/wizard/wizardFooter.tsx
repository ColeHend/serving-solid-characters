import { Component } from 'solid-js';
import { STEP_META, FEAT_STEPS, FeatWizardStep } from './wizard.shared';
import styles from '../../classes/wizard/classesWizard.module.scss';

// Thin sibling of the class wizard's WizardFooter, typed to the feat step enum.

interface WizardFooterProps {
  step: FeatWizardStep;
  featName: string;
  onBack: () => void;
  /** Advances to the next step; on the Review step this is the publish action. */
  onNext: () => void;
}

export const WizardFooter: Component<WizardFooterProps> = (props) => {
  const nextLabel = () => {
    if (props.step === FeatWizardStep.Review) return `Publish ${props.featName.trim() || 'feat'}`;
    if (props.step === FeatWizardStep.Effects) return 'Review →';
    return `Continue to ${STEP_META[(props.step + 1) as FeatWizardStep].label} →`;
  };
  return (
    <div class={styles.footer}>
      <button
        type="button"
        class={styles.backBtn}
        disabled={props.step === FeatWizardStep.Identity}
        onClick={() => props.onBack()}
      >
        ← Back
      </button>
      <span class={styles.footerCenter}>
        Step {props.step + 1} of {FEAT_STEPS.length} · everything autosaves
      </span>
      <button type="button" class={styles.nextBtn} onClick={() => props.onNext()}>
        {nextLabel()}
      </button>
    </div>
  );
};
