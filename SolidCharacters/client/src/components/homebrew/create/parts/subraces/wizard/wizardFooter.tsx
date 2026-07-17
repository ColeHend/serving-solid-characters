import { Component } from 'solid-js';
import { SUBRACE_STEPS, SubraceWizardStep, STEP_META } from './wizard.shared';
import styles from '../../classes/wizard/classesWizard.module.scss';

// Thin sibling of the class wizard's WizardFooter, typed to the subrace step enum.

interface WizardFooterProps {
  step: SubraceWizardStep;
  subraceName: string;
  onBack: () => void;
  /** Advances to the next step; on the Review step this is the publish action. */
  onNext: () => void;
}

export const WizardFooter: Component<WizardFooterProps> = (props) => {
  const nextLabel = () => {
    if (props.step === SubraceWizardStep.Review) return `Publish ${props.subraceName.trim() || 'subrace'}`;
    if (props.step === SubraceWizardStep.Flavor) return 'Review →';
    return `Continue to ${STEP_META[(props.step + 1) as SubraceWizardStep].label} →`;
  };
  return (
    <div class={styles.footer}>
      <button
        type="button"
        class={styles.backBtn}
        disabled={props.step === SubraceWizardStep.Identity}
        onClick={() => props.onBack()}
      >
        ← Back
      </button>
      <span class={styles.footerCenter}>
        Step {props.step + 1} of {SUBRACE_STEPS.length} · everything autosaves
      </span>
      <button type="button" class={styles.nextBtn} onClick={() => props.onNext()}>
        {nextLabel()}
      </button>
    </div>
  );
};
