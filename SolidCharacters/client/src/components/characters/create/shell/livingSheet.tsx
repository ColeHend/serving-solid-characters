import { Component, For, Show, createMemo } from "solid-js";
import { signed } from "../../../../shared/customHooks/utility/tools/dndMath";
import {
  entitySelectorKey,
  featSelectorKey,
  selectorKeyDisplayName,
} from "../../../../shared/customHooks/utility/tools/entityKey";
import { advantageLabel, grantedActionLabel, rollBonusLabel, senseLabels } from "../../../../shared/customHooks/mads/rollFormat";
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
    const featName = (key: string) =>
      data.feats().find((f) => featSelectorKey(f) === key)?.details?.name ?? selectorKeyDisplayName(key);
    const parts = [
      ...(derived.backgroundFeat() ? [`${derived.backgroundFeat()} (origin)`] : []),
      ...draft.feats.map(featName),
    ];
    return parts.join(", ");
  });

  const grimoireLines = createMemo(() => {
    if (draft.spells.length === 0) return [];
    const byKey = new Map(data.spells().map((s) => [entitySelectorKey(s), s]));
    const groups = new Map<string, string[]>();
    draft.spells.forEach((key) => {
      const spell = byKey.get(key);
      const level = `${spell?.level ?? "?"}`;
      groups.set(level, [...(groups.get(level) ?? []), spell?.name ?? selectorKeyDisplayName(key)]);
    });
    return [...groups.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([level, names]) => `${SPELL_LEVEL_LABELS[level] ?? "Unplaced"} — ${names.join(", ")}`);
  });

  const sensesLine = createMemo(() =>
    senseLabels(Object.fromEntries(derived.senses())).join(", "));

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

  // Walking speed lives in the SPEED tile; this lists only the extra modes.
  const movementLine = createMemo(() => derived.movementModes().join(", "));

  // Class/background base lists with equipment-proficiency mads (grants + resolved picks) applied.
  const equipLines = createMemo(() => {
    const profs = derived.equipProficiencies();
    return [
      profs.armor.length ? `Armor: ${profs.armor.join(", ")}` : "",
      profs.weapons.length ? `Weapons: ${profs.weapons.join(", ")}` : "",
      profs.tools.length ? `Tools: ${profs.tools.join(", ")}` : "",
    ].filter(Boolean);
  });

  const actionsLine = createMemo(() =>
    derived.grantedActions().map(grantedActionLabel).join(", "));

  const advantagesLine = createMemo(() =>
    derived.rollAdvantages().map((adv) => `${adv.rollType} ${advantageLabel(adv)}`).join(" · "));

  // Initiative bonuses are already folded into the INIT tile.
  const rollBonusLine = createMemo(() =>
    derived.rollBonuses()
      .filter((rb) => rb.rollType !== "Initiative")
      .map((rb) => `${rb.rollType} ${rollBonusLabel(rb, derived.profBonus(), derived.effectiveScores())}`)
      .join(" · "));

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

        <Show when={movementLine()}>
          <h5 class={styles.blockLabel}>Movement</h5>
          <p class={styles.blockText}>{movementLine()}</p>
        </Show>

        <Show when={actionsLine() || derived.attacksPerAction() > 1}>
          <h5 class={styles.blockLabel}>Actions</h5>
          <Show when={actionsLine()}>
            <p class={styles.blockText}>{actionsLine()}</p>
          </Show>
          <Show when={derived.attacksPerAction() > 1}>
            <p class={styles.blockText}>Attacks per action: {derived.attacksPerAction()}</p>
          </Show>
        </Show>

        <Show when={advantagesLine()}>
          <h5 class={styles.blockLabel}>Advantages</h5>
          <p class={styles.blockText}>{advantagesLine()}</p>
        </Show>

        <Show when={rollBonusLine()}>
          <h5 class={styles.blockLabel}>Roll Bonuses</h5>
          <p class={styles.blockText}>{rollBonusLine()}</p>
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

        <Show when={equipLines().length > 0}>
          <h5 class={styles.blockLabel}>Proficiencies</h5>
          <For each={equipLines()}>{(line) => <p class={styles.blockText}>{line}</p>}</For>
        </Show>

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
