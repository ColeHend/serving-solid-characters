import { Component, For, Show, createMemo, createSignal } from "solid-js";
import { Option, Select, addSnackbar } from "coles-solid-library";
import { AbilityScores, Race } from "../../../../../models/generated";
import RaceView from "../../../../../shared/components/modals/raceView/raceView";
import { ABILITY_LABELS } from "../../rules/constants";
import { normalizeAbility } from "../../rules/engine";
import { signed } from "../../../../../shared/customHooks/utility/tools/dndMath";
import { InfoButton } from "../../shell/infoButton";
import { LegacyBadge } from "../../shell/legacyBadge";
import { editionSideOf, hasVariantOnSide } from "../../state/bothMode";
import { useCreate } from "../../state/createContext";
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

  const pickSpecies = (race: Race) => {
    const next = draft.species === race.name ? "" : race.name;
    actions.setSpecies(next);
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

  const lineages = createMemo(() =>
    data.subraces().filter((sub) => sub.parentRace?.toLowerCase() === draft.species.toLowerCase()));

  const traits = createMemo(() => {
    const race = derived.selectedRace();
    const subrace = derived.selectedSubrace();
    return [...(race?.traits ?? []), ...(subrace?.traits ?? [])]
      .map((trait) => trait.details?.name)
      .filter(Boolean);
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
              classList={{ [styles.cardSelected]: draft.species === race.name }}
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
          derived.selectedRace()?.abilityBonusChoice
        }
      >
        {(_) => {
          const choice = () => derived.selectedRace()!.abilityBonusChoice!;
          return (
            <div class={styles.choiceBlock}>
              <h5 class={styles.blockLabel}>
                Ability bonus — choose {choice().amount} ({draft.raceAbilityChoices.length}/
                {choice().amount})
              </h5>
              <div class={styles.choicePills}>
                <For each={choice().choices ?? []}>
                  {(bonus) => {
                    const key = normalizeAbility(AbilityScores[bonus.stat]);
                    if (!key) return null;
                    return (
                      <button
                        type="button"
                        class={styles.choicePill}
                        classList={{
                          [styles.choicePillActive]: draft.raceAbilityChoices.includes(key),
                        }}
                        onClick={() => actions.toggleRaceAbilityChoice(key, choice().amount)}
                      >
                        {signed(bonus.value)} {ABILITY_LABELS[key]}
                      </button>
                    );
                  }}
                </For>
              </div>
            </div>
          );
        }}
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

      <Show
        when={
          (draft.edition === "2014" ||
            (draft.edition === "both" && derived.selectedRace()?.legacy === true)) &&
          draft.species &&
          lineages().length > 0
        }
      >
        <div class={styles.lineageRow}>
          <h5 class={styles.blockLabel}>
            Lineage
            <Show when={lineages().find((sub) => sub.name === draft.lineage)}>
              {(chosen) => (
                <InfoButton label={`View ${draft.lineage} details`} onClick={() => viewRace(chosen())} />
              )}
            </Show>
          </h5>
          <Select
            value={draft.lineage}
            onChange={(value: string) => actions.setLineage(value)}
            placeholder="Choose a lineage…"
          >
            <For each={lineages()}>{(sub) => <Option value={sub.name}>{sub.name}</Option>}</For>
          </Select>
        </div>
      </Show>

      <Show when={viewedRace()} keyed>
        {(race) => <RaceView currentRace={() => race} backClick={[showRaceView, setShowRaceView]} />}
      </Show>
    </div>
  );
};
