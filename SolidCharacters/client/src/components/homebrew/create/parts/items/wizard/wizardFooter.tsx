import { Component } from 'solid-js';
import { ITEM_STEPS, ItemsWizardStep, STEP_META } from './wizard.shared';
import styles from '../../classes/wizard/classesWizard.module.scss';

// Thin sibling of the class/subclass wizards' WizardFooter, typed to the items step enum.
// No autosave claim in the center text — the items wizard has no draft autosave (yet).

interface WizardFooterProps {
  step: ItemsWizardStep;
  /** Review-step action label: "Save Homebrew" / "Update Homebrew". */
  publishLabel: string;
  onBack: () => void;
  /** Advances to the next step; on the Review step this is the publish action. */
  onNext: () => void;
}

export const WizardFooter: Component<WizardFooterProps> = (props) => {
  const nextLabel = () => {
    if (props.step === ItemsWizardStep.Review) return props.publishLabel;
    if (props.step === ItemsWizardStep.Features) return 'Review →';
    return `Continue to ${STEP_META[(props.step + 1) as ItemsWizardStep].label} →`;
  };
  return (
    <div class={styles.footer}>
      <button
        type="button"
        class={styles.backBtn}
        disabled={props.step === ItemsWizardStep.Identity}
        onClick={() => props.onBack()}
      >
        ← Back
      </button>
      <span class={styles.footerCenter}>
        Step {props.step + 1} of {ITEM_STEPS.length}
      </span>
      <button type="button" class={styles.nextBtn} onClick={() => props.onNext()}>
        {nextLabel()}
      </button>
    </div>
  );
};
