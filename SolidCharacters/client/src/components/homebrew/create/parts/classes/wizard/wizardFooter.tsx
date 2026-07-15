import { Component } from 'solid-js';
import { STEP_META, WIZARD_STEPS, WizardStep } from './wizard.shared';
import styles from './classesWizard.module.scss';

interface WizardFooterProps {
  step: WizardStep;
  className: string;
  onBack: () => void;
  /** Advances to the next step; on the Review step this is the publish action. */
  onNext: () => void;
}

export const WizardFooter: Component<WizardFooterProps> = (props) => {
  const nextLabel = () => {
    if (props.step === WizardStep.Review) return `Publish ${props.className.trim() || 'class'}`;
    if (props.step === WizardStep.Spellcasting) return 'Review →';
    return `Continue to ${STEP_META[(props.step + 1) as WizardStep].label} →`;
  };
  return (
    <div class={styles.footer}>
      <button
        type="button"
        class={styles.backBtn}
        disabled={props.step === WizardStep.Identity}
        onClick={() => props.onBack()}
      >
        ← Back
      </button>
      <span class={styles.footerCenter}>
        Step {props.step + 1} of {WIZARD_STEPS.length} · everything autosaves
      </span>
      <button type="button" class={styles.nextBtn} onClick={() => props.onNext()}>
        {nextLabel()}
      </button>
    </div>
  );
};
