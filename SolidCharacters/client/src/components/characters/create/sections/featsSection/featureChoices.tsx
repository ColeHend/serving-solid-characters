import { Component, For, Show, createMemo } from "solid-js";
import { MadChoiceControl } from "../../shell/madChoiceControl";
import { useCreate } from "../../state/createContext";
import styles from "../../shell/madChoiceControl.module.scss";

/**
 * Pickers for choice-form MADS commands carried by picked feats (origin + chosen). Class
 * and species feature choices render in their own sections — the class detail cards and
 * the species section — via the same MadChoiceControl.
 */
export const FeatureChoices: Component = () => {
  const { derived } = useCreate();

  const featChoices = createMemo(() => derived.madChoices().filter((c) => c.source === "feat"));

  return (
    <Show when={featChoices().length > 0}>
      <h5 class={styles.choicesLabel}>Feat choices</h5>
      <div class={styles.choicesList}>
        <For each={featChoices()}>{(choice) => <MadChoiceControl choice={choice} />}</For>
      </div>
    </Show>
  );
};
