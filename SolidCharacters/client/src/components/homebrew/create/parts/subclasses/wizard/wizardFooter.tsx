import { Component } from 'solid-js';
import { STEP_META, SUBCLASS_STEPS, SubclassWizardStep } from './wizard.shared';
import styles from '../../classes/wizard/classesWizard.module.scss';

// Thin sibling of the class wizard's WizardFooter, typed to the subclass step enum.

interface WizardFooterProps {
  step: SubclassWizardStep;
  subclassName: string;
  onBack: () => void;
  /** Advances to the next step; on the Review step this is the publish action. */
  onNext: () => void;
}

export const WizardFooter: Component<WizardFooterProps> = (props) => {
  const nextLabel = () => {
    if (props.step === SubclassWizardStep.Review) return `Publish ${props.subclassName.trim() || 'subclass'}`;
    if (props.step === SubclassWizardStep.Spellcasting) return 'Review →';
    return `Continue to ${STEP_META[(props.step + 1) as SubclassWizardStep].label} →`;
  };
  return (
    <div class={styles.footer}>
      <button
        type="button"
        class={styles.backBtn}
        disabled={props.step === SubclassWizardStep.Identity}
        onClick={() => props.onBack()}
      >
        ← Back
      </button>
      <span class={styles.footerCenter}>
        Step {props.step + 1} of {SUBCLASS_STEPS.length} · everything autosaves
      </span>
      <button type="button" class={styles.nextBtn} onClick={() => props.onNext()}>
        {nextLabel()}
      </button>
    </div>
  );
};
