import { Component, For } from "solid-js";
import { ABILITY_LABELS } from "../../rules/constants";
import { SkillRow } from "../../rules/engine";
import { signed } from "../../../../../shared/customHooks/utility/tools/dndMath";
import { useCreate } from "../../state/createContext";
import styles from "./skillsSection.module.scss";

const pillText: Record<SkillRow["state"], string> = {
  none: "—",
  proficient: "Proficient",
  expertise: "Expertise",
};

export const SkillsSection: Component = () => {
  const { actions, derived } = useCreate();

  return (
    <div class={styles.grid}>
      <For each={derived.skillRows()}>
        {(row) => (
          <div class={styles.row} classList={{ [styles.rowActive]: row.state !== "none" }}>
            <button
              type="button"
              class={styles.pill}
              classList={{
                [styles.pillProficient]: row.state === "proficient",
                [styles.pillExpertise]: row.state === "expertise",
              }}
              onClick={() => actions.cycleSkill(row.name, row.state)}
              title={row.source ? `From ${row.source}` : "Click to cycle"}
            >
              {pillText[row.state]}
            </button>
            <span class={styles.name}>{row.name}</span>
            <span class={styles.ability}>{ABILITY_LABELS[row.ability]}</span>
            <span class={styles.mod}>{signed(row.mod)}</span>
          </div>
        )}
      </For>
    </div>
  );
};
