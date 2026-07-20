import { Component, For, Show, createMemo, createSignal } from "solid-js";
import { Option, Select, addSnackbar } from "coles-solid-library";
import { AbilityScores, Race } from "../../../../../models/generated";
import RaceView from "../../../../../shared/components/modals/raceView/raceView";
import { entitySelectorKey } from "../../../../../shared/customHooks/utility/tools/entityKey";
import { ABILITY_LABELS } from "../../rules/constants";
import { normalizeAbility } from "../../rules/engine";
import { signed } from "../../../../../shared/customHooks/utility/tools/dndMath";
import { senseLabels } from "../../../../../shared/customHooks/mads/rollFormat";
import { InfoButton } from "../../shell/infoButton";
import { LegacyBadge } from "../../shell/legacyBadge";
import { MadChoiceControl } from "../../shell/madChoiceControl";
import { editionSideOf, hasVariantOnSide } from "../../state/bothMode";
import { useCreate } from "../../state/createContext";
import choiceStyles from "../../shell/madChoiceControl.module.scss";
import styles from "./speciesSection.module.scss";

/** "+2 DEX, +1 INT" — 2014 cards advertise their ability bonuses. */
function bonusLine(race: Race): string {
  return (race.abilityBonuses ?? [])
    .map((bonus) => {
      if (bonus.stat === AbilityScores.ALL) return `${signed(bonus.value)} all`;
      const key = normalizeAbility(AbilityScores[bonus.stat]);
      return key ? `${signed(bonus.value)} ${ABILITY_LABELS[key]}` : "";
    })
    .filter(Boolean)
    .join(", ");
}

export const SpeciesSection: Component = () => {
  const { draft, actions, derived, data } = useCreate();

  const [viewedRace, setViewedRace] = createSignal<Race>();
  const [showRaceView, setShowRaceView] = createSignal(false);
  const viewRace = (race: Race) => {
    setViewedRace(race);
    setShowRaceView(true);
  };

  /** Both-mode: does the species' edition still grant its own ability bonuses? */
  const raceBonusesApply = (race: Race) =>
    draft.edition === "2014" || (draft.edition === "both" && race.legacy === true);

  const isPicked = (race: Race) =>
    draft.speciesId ? draft.speciesId === entitySelectorKey(race) : draft.species === race.name;

  const pickSpecies = (race: Race) => {
    const picked = isPicked(race);
    const next = picked ? "" : race.name;
    actions.setSpecies(next, picked ? undefined : entitySelectorKey(race));
    if (next && draft.edition === "both" && draft.background) {
      const side = editionSideOf(data.racesRaw(), next);
      if (side !== undefined && !hasVariantOnSide(data.backgroundsRaw(), draft.background, side)) {
        addSnackbar({
          message: `${draft.background} has no ${side ? "2014" : "2024"} version — background cleared`,
          severity: "warning",
        });
        actions.setBackground("");
      }
    }
  };

  // SRD subraces reference their parent by race ID; homebrew rows by name — match both.
  const lineages = createMemo(() => {
    const race = derived.selectedRace();
    if (!race) return [];
    return data.subraces().filter((sub) =>
      (race.id && sub.parentRace === race.id) ||
      sub.parentRace?.toLowerCase() === (race.name ?? "").toLowerCase());
  });

  const chosenLineage = createMemo(() =>
    lineages().find((sub) =>
      draft.lineageId
        ? entitySelectorKey(sub) === draft.lineageId
        : !!draft.lineage && sub.name === draft.lineage));

  /** Choice-form MADS carried by species/subrace traits (and picked trait choices). */
  const raceChoices = createMemo(() => derived.madChoices().filter((c) => c.source === "race"));

  const traits = createMemo(() => {
    const race = derived.selectedRace();
    const subrace = derived.selectedSubrace();
    return [...(race?.traits ?? []), ...(subrace?.traits ?? [])]
      .map((trait) => trait.details?.name)
      .filter(Boolean);
  });

  /** Compact post-MADS movement + senses for the selected species — "Speed 35ft · Fly 35ft · Darkvision 60ft". */
  const travelSummary = createMemo(() => {
    const compact = (label: string) => label.replace(" ft", "ft");
    return [
      `Speed ${derived.speed()}ft`,
      ...derived.movementModes().map(compact),
      ...senseLabels(Object.fromEntries(derived.senses())).map(compact),
    ].join(" · ");
  });

  return (
    <div>
      <Show when={draft.edition === "both" && derived.pairing().anchor === "background"}>
        <p class={styles.pairingNotice}>
          Showing {derived.pairing().side ? "legacy (2014)" : "2024"} species — paired with your{" "}
          {draft.background} background.
        </p>
      </Show>

      <div class={styles.cardGrid}>
        <For each={derived.speciesPool()}>
          {(race) => (
            <button
              type="button"
              class={styles.card}
              classList={{ [styles.cardSelected]: isPicked(race) }}
              onClick={() => pickSpecies(race)}
            >
              <span class={styles.cardName}>
                {race.name}
                <Show when={draft.edition === "both" && race.legacy === true}>
                  <LegacyBadge />
                </Show>
                <InfoButton label={`View ${race.name} details`} onClick={() => viewRace(race)} />
              </span>
              <span class={styles.cardMeta}>
                {[race.size, `${race.speed} ft`].filter(Boolean).join(" · ")}
              </span>
              <Show when={raceBonusesApply(race) && bonusLine(race)}>
                <span class={styles.cardBonuses}>{bonusLine(race)}</span>
              </Show>
            </button>
          )}
        </For>
      </div>

      <Show when={traits().length > 0}>
        <div class={styles.traitRow}>
          <For each={traits()}>{(trait) => <span class={styles.traitChip}>{trait}</span>}</For>
        </div>
      </Show>

      <Show
        when={
          derived.selectedRace() &&
          raceBonusesApply(derived.selectedRace()!) &&
          derived.speciesBonusPool().tokens.length > 0
        }
      >
        <div class={styles.choiceBlock}>
          <h5 class={styles.blockLabel}>Ability bonuses</h5>
          <span class={styles.blockHint}>Assign them in the Abilities section.</span>
        </div>
      </Show>

      <Show when={derived.selectedRace()?.languages?.length || derived.selectedRace()?.languageChoice}>
        <div class={styles.choiceBlock}>
          <h5 class={styles.blockLabel}>Species languages</h5>
          <div class={styles.choicePills}>
            <For each={derived.selectedRace()?.languages ?? []}>
              {(language) => <span class={styles.traitChip}>{language}</span>}
            </For>
            <For each={derived.selectedSubrace()?.languages ?? []}>
              {(language) => <span class={styles.traitChip}>{language}</span>}
            </For>
          </div>
          <Show when={derived.selectedRace()?.languageChoice}>
            {(languageChoice) => (
              <>
                <h5 class={styles.blockLabel}>
                  Bonus language — choose {languageChoice().amount} (
                  {draft.raceLanguageChoices.length}/{languageChoice().amount})
                </h5>
                <div class={styles.choicePills}>
                  <For each={languageChoice().options ?? []}>
                    {(language) => (
                      <button
                        type="button"
                        class={styles.choicePill}
                        classList={{
                          [styles.choicePillActive]: draft.raceLanguageChoices.includes(language),
                        }}
                        onClick={() =>
                          actions.toggleRaceLanguageChoice(language, languageChoice().amount)
                        }
                      >
                        {language}
                      </button>
                    )}
                  </For>
                </div>
              </>
            )}
          </Show>
        </div>
      </Show>

      <Show when={derived.selectedRace()?.traitChoice}>
        {(traitChoice) => (
          <div class={styles.choiceBlock}>
            <h5 class={styles.blockLabel}>
              Traits — choose {traitChoice().amount} ({draft.raceTraitChoices.length}/
              {traitChoice().amount})
            </h5>
            <div class={styles.choicePills}>
              <For each={traitChoice().choices ?? []}>
                {(trait) => {
                  const name = trait.details?.name ?? "";
                  if (!name) return null;
                  return (
                    <button
                      type="button"
                      class={styles.choicePill}
                      classList={{ [styles.choicePillActive]: draft.raceTraitChoices.includes(name) }}
                      onClick={() => actions.toggleRaceTraitChoice(name, traitChoice().amount)}
                    >
                      {name}
                    </button>
                  );
                }}
              </For>
            </div>
          </div>
        )}
      </Show>

      <Show when={draft.species && lineages().length > 0}>
        <div class={styles.lineageRow}>
          <h5 class={styles.blockLabel}>
            Lineage
            <Show when={chosenLineage()}>
              {(chosen) => (
                <InfoButton label={`View ${draft.lineage} details`} onClick={() => viewRace(chosen())} />
              )}
            </Show>
          </h5>
          <Select
            value={chosenLineage() ? entitySelectorKey(chosenLineage()!) : ""}
            onChange={(value: string) => {
              const sub = lineages().find((s) => entitySelectorKey(s) === value);
              actions.setLineage(sub?.name ?? "", sub ? value : undefined);
            }}
            placeholder="Choose a lineage…"
          >
            <For each={lineages()}>
              {(sub) => <Option value={entitySelectorKey(sub)}>{sub.name}</Option>}
            </For>
          </Select>
        </div>
      </Show>

      <Show when={raceChoices().length > 0}>
        <h5 class={choiceStyles.choicesLabel}>Feature choices</h5>
        <div class={choiceStyles.choicesList}>
          <For each={raceChoices()}>{(choice) => <MadChoiceControl choice={choice} />}</For>
        </div>
      </Show>

      <Show when={derived.selectedRace()}>
        <div class={styles.choiceBlock}>
          <span class={styles.cardMeta}>{travelSummary()}</span>
        </div>
      </Show>

      <Show when={viewedRace()} keyed>
        {(race) => <RaceView currentRace={() => race} backClick={[showRaceView, setShowRaceView]} />}
      </Show>
    </div>
  );
};
