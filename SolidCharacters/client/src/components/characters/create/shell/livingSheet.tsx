import { Component, For, Show, createMemo } from "solid-js";
import { signed } from "../../../../shared/customHooks/utility/tools/dndMath";
import { ABILITY_LABELS, ABILITY_KEYS } from "../rules/constants";
import { useCreate } from "../state/createContext";
import styles from "./livingSheet.module.scss";

const SPELL_LEVEL_LABELS: Record<string, string> = {
  "0": "Cantrips",
  "1": "Level 1",
  "2": "Level 2",
  "3": "Level 3",
  "4": "Level 4",
  "5": "Level 5",
  "6": "Level 6",
  "7": "Level 7",
  "8": "Level 8",
  "9": "Level 9",
};

interface LivingSheetProps {
  hidden: boolean;
  /** Collapsing changes the page grid, so the state lives on the page. */
  onToggle: (hidden: boolean) => void;
}

/** The always-live summary sidebar. Sticky on the LEFT; collapses to a thin rail. */
export const LivingSheet: Component<LivingSheetProps> = (props) => {
  const { draft, derived, data } = useCreate();

  const proficientSkills = createMemo(() => derived.skillRows().filter((row) => row.state !== "none"));

  const featLine = createMemo(() => {
    const parts = [
      ...(derived.backgroundFeat() ? [`${derived.backgroundFeat()} (origin)`] : []),
      ...draft.feats,
    ];
    return parts.join(", ");
  });

  const grimoireLines = createMemo(() => {
    if (draft.spells.length === 0) return [];
    const byName = new Map(data.spells().map((s) => [s.name.toLowerCase(), s]));
    const groups = new Map<string, string[]>();
    draft.spells.forEach((name) => {
      const level = `${byName.get(name.toLowerCase())?.level ?? "?"}`;
      groups.set(level, [...(groups.get(level) ?? []), name]);
    });
    return [...groups.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([level, names]) => `${SPELL_LEVEL_LABELS[level] ?? "Unplaced"} — ${names.join(", ")}`);
  });

  const sensesLine = createMemo(() =>
    derived.senses().map(([name, range]) => `${name} ${range}ft`).join(", "));

  const defensesLine = createMemo(() => {
    const { resistances, immunities, vulnerabilities } = derived.defenses();
    return [
      resistances.length ? `Resists ${resistances.join(", ")}` : "",
      immunities.length ? `Immune to ${immunities.join(", ")}` : "",
      vulnerabilities.length ? `Vulnerable to ${vulnerabilities.join(", ")}` : "",
    ]
      .filter(Boolean)
      .join(" · ");
  });

  const stats = () => [
    { label: "AC", value: `${derived.ac()}` },
    { label: "HP", value: `${derived.maxHp()}` },
    { label: "INIT", value: signed(derived.initiative()) },
    { label: "SPEED", value: `${derived.speed()}ft` },
    { label: "PROF", value: signed(derived.profBonus()) },
    { label: "PERC.", value: `${derived.passivePerception()}` },
  ];

  return (
    <Show
      when={!props.hidden}
      fallback={
        <aside class={styles.rail}>
          <button type="button" class={styles.railButton} onClick={() => props.onToggle(false)} title="Show the living sheet">
            ◂
          </button>
        </aside>
      }
    >
      <aside class={styles.sheet}>
        <div class={styles.sheetHeader}>
          <h3 class={styles.sheetTitle}>✦ Living Sheet</h3>
          <button type="button" class={styles.hideButton} onClick={() => props.onToggle(true)}>
            ◂ Hide
          </button>
        </div>

        <h4 class={styles.charName}>{draft.name.trim() || "Unnamed Adventurer"}</h4>
        <p class={styles.summaryLine}>{derived.summaryLine()}</p>

        <div class={styles.statGrid}>
          <For each={stats()}>
            {(stat) => (
              <div class={styles.statTile}>
                <span class={styles.statLabel}>{stat.label}</span>
                <span class={styles.statValue}>{stat.value}</span>
              </div>
            )}
          </For>
        </div>

        <div class={styles.abilityRow}>
          <For each={ABILITY_KEYS}>
            {(key) => (
              <div class={styles.abilityTile}>
                <span class={styles.statLabel}>{ABILITY_LABELS[key]}</span>
                <span class={styles.abilityScore}>{derived.effectiveScores()[key]}</span>
                <span class={styles.abilityMod}>{signed(derived.effectiveMods()[key])}</span>
              </div>
            )}
          </For>
        </div>

        <Show when={sensesLine()}>
          <h5 class={styles.blockLabel}>Senses</h5>
          <p class={styles.blockText}>{sensesLine()}</p>
        </Show>

        <Show when={defensesLine()}>
          <h5 class={styles.blockLabel}>Defenses</h5>
          <p class={styles.blockText}>{defensesLine()}</p>
        </Show>

        <h5 class={styles.blockLabel}>Saving Throws</h5>
        <div class={styles.saveChips}>
          <For each={derived.savingThrows()}>
            {(save) => (
              <span class={styles.saveChip} classList={{ [styles.saveProficient]: save.proficient }}>
                {ABILITY_LABELS[save.key]} {signed(save.mod)}
                <Show when={save.proficient}>
                  <span class={styles.saveDot} />
                </Show>
              </span>
            )}
          </For>
        </div>

        <h5 class={styles.blockLabel}>Proficient Skills</h5>
        <p class={styles.blockText}>
          <Show when={proficientSkills().length > 0} fallback="None yet">
            <For each={proficientSkills()}>
              {(row, index) => (
                <>
                  {index() > 0 && ", "}
                  {row.name}
                  {row.state === "expertise" && " ◆"}
                </>
              )}
            </For>
          </Show>
        </p>

        <h5 class={styles.blockLabel}>Feats</h5>
        <p class={styles.blockText}>{featLine() || "None yet"}</p>

        <h5 class={styles.blockLabel}>Grimoire</h5>
        <Show when={grimoireLines().length > 0} fallback={<p class={styles.blockText}>None inscribed</p>}>
          <For each={grimoireLines()}>{(line) => <p class={styles.blockText}>{line}</p>}</For>
        </Show>
        <Show when={derived.grantedSpells().length > 0}>
          <p class={styles.blockText}>✧ Granted — {derived.grantedSpells().join(", ")}</p>
        </Show>

        <h5 class={styles.blockLabel}>Languages</h5>
        <p class={styles.blockText}>
          {(derived.languages().length > 0 ? derived.languages() : ["Common", ...draft.languages]).join(", ")}
        </p>
      </aside>
    </Show>
  );
};
