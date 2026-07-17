import { Component } from 'solid-js';
import { STEP_META, SPELL_STEPS, SpellWizardStep } from './wizard.shared';
import styles from '../../classes/wizard/classesWizard.module.scss';

// Thin sibling of the class wizard's WizardFooter, typed to the spell step enum.

interface WizardFooterProps {
  step: SpellWizardStep;
  spellName: string;
  onBack: () => void;
  /** Advances to the next step; on the Review step this is the publish action. */
  onNext: () => void;
}

export const WizardFooter: Component<WizardFooterProps> = (props) => {
  const nextLabel = () => {
    if (props.step === SpellWizardStep.Review) return `Publish ${props.spellName.trim() || 'spell'}`;
    if (props.step === SpellWizardStep.Classes) return 'Review →';
    return `Continue to ${STEP_META[(props.step + 1) as SpellWizardStep].label} →`;
  };
  return (
    <div class={styles.footer}>
      <button
        type="button"
        class={styles.backBtn}
        disabled={props.step === SpellWizardStep.Identity}
        onClick={() => props.onBack()}
      >
        ← Back
      </button>
      <span class={styles.footerCenter}>
        Step {props.step + 1} of {SPELL_STEPS.length} · everything autosaves
      </span>
      <button type="button" class={styles.nextBtn} onClick={() => props.onNext()}>
        {nextLabel()}
      </button>
    </div>
  );
};
