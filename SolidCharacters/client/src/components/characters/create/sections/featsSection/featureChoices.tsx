import { Component, For, Show, createMemo } from "solid-js";
import { MadChoiceControl } from "../../shell/madChoiceControl";
import { MadChoiceSource } from "../../rules/applyMads";
import { useCreate } from "../../state/createContext";
import styles from "../../shell/madChoiceControl.module.scss";

/**
 * Pickers for one source's choice-form MADS commands, as a labeled block. The feats and
 * background sections render it directly; class and species feature choices render in
 * their own sections (the class detail cards filter per-card by sourceKey) via the same
 * MadChoiceControl.
 */
export const FeatureChoices: Component<{ source: MadChoiceSource; label: string }> = (props) => {
  const { derived } = useCreate();

  const choices = createMemo(() => derived.madChoices().filter((c) => c.source === props.source));

  return (
    <Show when={choices().length > 0}>
      <h5 class={styles.choicesLabel}>{props.label}</h5>
      <div class={styles.choicesList}>
        <For each={choices()}>{(choice) => <MadChoiceControl choice={choice} />}</For>
      </div>
    </Show>
  );
};
