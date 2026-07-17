import { Component } from 'solid-js';
import { RACE_STEPS, RaceWizardStep, STEP_META } from './wizard.shared';
import styles from '../../classes/wizard/classesWizard.module.scss';

// Thin sibling of the class wizard's WizardFooter, typed to the race step enum.

interface WizardFooterProps {
  step: RaceWizardStep;
  raceName: string;
  onBack: () => void;
  /** Advances to the next step; on the Review step this is the publish action. */
  onNext: () => void;
}

export const WizardFooter: Component<WizardFooterProps> = (props) => {
  const nextLabel = () => {
    if (props.step === RaceWizardStep.Review) return `Publish ${props.raceName.trim() || 'race'}`;
    if (props.step === RaceWizardStep.Flavor) return 'Review →';
    return `Continue to ${STEP_META[(props.step + 1) as RaceWizardStep].label} →`;
  };
  return (
    <div class={styles.footer}>
      <button
        type="button"
        class={styles.backBtn}
        disabled={props.step === RaceWizardStep.Identity}
        onClick={() => props.onBack()}
      >
        ← Back
      </button>
      <span class={styles.footerCenter}>
        Step {props.step + 1} of {RACE_STEPS.length} · everything autosaves
      </span>
      <button type="button" class={styles.nextBtn} onClick={() => props.onNext()}>
        {nextLabel()}
      </button>
    </div>
  );
};
