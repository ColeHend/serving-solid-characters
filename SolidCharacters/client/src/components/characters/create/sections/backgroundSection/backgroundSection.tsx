import { Component, For, Show, createMemo, createSignal } from "solid-js";
import { Button, Chip, Option, Select, addSnackbar } from "coles-solid-library";
import { Background, StartingEquipment } from "../../../../../models/generated";
import BackgroundView from "../../../../../shared/components/modals/background/backgrondView";
import { entitySelectorKey } from "../../../../../shared/customHooks/utility/tools/entityKey";
import { LANGUAGES } from "../../rules/constants";
import { featCategory } from "../../rules/engine";
import { InfoButton } from "../../shell/infoButton";
import { LegacyBadge } from "../../shell/legacyBadge";
import { FeatureChoices } from "../featsSection/featureChoices";
import { editionSideOf, hasVariantOnSide } from "../../state/bothMode";
import { useCreate } from "../../state/createContext";
import styles from "./backgroundSection.module.scss";

function equipmentLine(options: StartingEquipment[] | undefined): string {
  if (!options?.length) return "";
  return options
    .map((option) => {
      const key = option.optionKeys?.length ? `${option.optionKeys.join("/")}: ` : "";
      return `${key}${(option.items ?? []).join(", ")}`;
    })
    .join("  —or—  ");
}

export const BackgroundSection: Component = () => {
  const { draft, actions, derived, data } = useCreate();
  const [pendingLanguage, setPendingLanguage] = createSignal("");

  const [viewedBackground, setViewedBackground] = createSignal<Background>();
  const [showBackgroundView, setShowBackgroundView] = createSignal(false);
  const viewBackground = (bg: Background) => {
    setViewedBackground(bg);
    setShowBackgroundView(true);
  };

  const isPicked = (bg: Background) =>
    draft.backgroundId ? draft.backgroundId === entitySelectorKey(bg) : draft.background === bg.name;

  const pickBackground = (bg: Background) => {
    const picked = isPicked(bg);
    const next = picked ? "" : bg.name;
    actions.setBackground(next, picked ? undefined : entitySelectorKey(bg));
    if (next && draft.edition === "both" && draft.species) {
      const side = editionSideOf(data.backgroundsRaw(), next);
      if (side !== undefined && !hasVariantOnSide(data.racesRaw(), draft.species, side)) {
        addSnackbar({
          message: `${draft.species} has no ${side ? "2014" : "2024"} version — species cleared`,
          severity: "warning",
        });
        actions.setSpecies("");
      }
    }
  };

  const background = derived.selectedBackground;

  /** The feat actually taken: the player's pick, else the background's recommendation. */
  const chosenOriginFeat = createMemo(() => draft.originFeat || background()?.feat || "");

  const originFeatDescription = createMemo(() => {
    const featName = chosenOriginFeat();
    if (!featName) return "";
    return (
      data.feats().find((f) => f.details?.name?.toLowerCase() === featName.toLowerCase())?.details
        ?.description ?? ""
    );
  });

  /** Feats offered as origin picks: every Origin-category feat, recommendation first. */
  const originFeatOptions = createMemo(() => {
    const recommended = background()?.feat ?? "";
    const names = data
      .feats()
      .filter((feat) => featCategory(feat) === "Origin")
      .map((feat) => feat.details?.name ?? "")
      .filter((name) => name && name.toLowerCase() !== recommended.toLowerCase())
      .sort((a, b) => a.localeCompare(b));
    return recommended ? [recommended, ...names] : names;
  });

  // Languages the species already grants (fixed or picked) shouldn't be offered again.
  const raceGrantedLanguages = createMemo(() =>
    new Set(
      [
        ...(derived.selectedRace()?.languages ?? []),
        ...(derived.selectedSubrace()?.languages ?? []),
        ...draft.raceLanguageChoices,
      ].map((l) => l.toLowerCase()),
    ));

  const languageOptions = createMemo(() => {
    const fromBackground = background()?.languages?.options;
    const pool = fromBackground?.length ? fromBackground : LANGUAGES;
    return pool.filter(
      (lang) =>
        !draft.languages.includes(lang) &&
        lang.toLowerCase() !== "common" &&
        !raceGrantedLanguages().has(lang.toLowerCase()),
    );
  });

  const languageLimit = createMemo(() => background()?.languages?.amount || 2);

  return (
    <div>
      <Show when={draft.edition === "both" && derived.pairing().anchor === "species"}>
        <p class={styles.pairingNotice}>
          Showing {derived.pairing().side ? "legacy (2014)" : "2024"} backgrounds — paired with your{" "}
          {draft.species} species.
        </p>
      </Show>

      <div class={styles.cardGrid}>
        <For each={derived.backgroundPool()}>
          {(bg) => (
            <button
              type="button"
              class={styles.card}
              classList={{ [styles.cardSelected]: isPicked(bg) }}
              onClick={() => pickBackground(bg)}
            >
              <span class={styles.cardName}>
                {bg.name}
                <Show when={draft.edition === "both" && bg.legacy === true}>
                  <LegacyBadge />
                </Show>
                <InfoButton label={`View ${bg.name} details`} onClick={() => viewBackground(bg)} />
              </span>
              <span class={styles.cardMeta}>{(bg.proficiencies?.skills ?? []).slice(0, 2).join(", ")}</span>
            </button>
          )}
        </For>
      </div>

      <Show when={background()}>
        {(bg) => (
          <div class={styles.detailPanel}>
            <Show when={draft.edition !== "2014" && bg().abilityOptions?.length}>
              <p class={styles.detailLine}>
                <span class={styles.detailLabel}>Ability scores:</span>{" "}
                {bg().abilityOptions?.join(", ")} — assign +2/+1 or three +1s in Abilities below.
              </p>
            </Show>
            <Show when={bg().feat}>
              <div class={styles.detailLine}>
                <span class={styles.detailLabel}>Origin feat</span> —{" "}
                <Select
                  value={chosenOriginFeat()}
                  onChange={(value: string) => {
                    if (value === (bg().feat ?? "")) {
                      actions.setOriginFeat("");
                      return;
                    }
                    const feat = data
                      .feats()
                      .find((f) => f.details?.name?.toLowerCase() === value.toLowerCase());
                    actions.setOriginFeat(
                      value,
                      feat
                        ? entitySelectorKey({ id: feat.id, name: feat.details?.name ?? "" })
                        : undefined,
                    );
                  }}
                >
                  <For each={originFeatOptions()}>
                    {(name) => (
                      <Option value={name}>
                        {name === bg().feat ? `${name} (recommended)` : name}
                      </Option>
                    )}
                  </For>
                </Select>{" "}
                <Show when={originFeatDescription()}>
                  <span class={styles.featDescription}>({originFeatDescription()})</span>
                </Show>
              </div>
            </Show>
            <p class={styles.detailLine}>
              <span class={styles.detailLabel}>Skills</span> — {(bg().proficiencies?.skills ?? []).join(", ") || "None"}
              <Show when={bg().proficiencies?.tools?.length}>
                {" "}· <span class={styles.detailLabel}>Tool</span> — {bg().proficiencies.tools.join(", ")}
              </Show>
            </p>
            <Show when={equipmentLine(bg().startEquipment)}>
              <p class={styles.detailLine}>
                <span class={styles.detailLabel}>Equipment</span> — {equipmentLine(bg().startEquipment)}
              </p>
            </Show>
            <FeatureChoices source="background" label="Feature choices" />
          </div>
        )}
      </Show>

      <div class={styles.languagesBlock}>
        <h5 class={styles.blockLabel}>Languages</h5>
        <div class={styles.languageChips}>
          <Chip value="Common" />
          <For each={draft.languages}>
            {(language) => <Chip value={language} remove={() => actions.removeLanguage(language)} />}
          </For>
        </div>
        <div class={styles.languageAdd}>
          <Select
            value={pendingLanguage()}
            onChange={(value: string) => setPendingLanguage(value)}
            placeholder="Add a language…"
          >
            <For each={languageOptions()}>{(lang) => <Option value={lang}>{lang}</Option>}</For>
          </Select>
          <Button
            onClick={() => {
              if (pendingLanguage()) {
                actions.addLanguage(pendingLanguage());
                setPendingLanguage("");
              }
            }}
            disabled={!pendingLanguage() || draft.languages.length >= languageLimit()}
          >
            Add
          </Button>
          <span class={styles.languageHint}>
            Everyone knows Common plus {languageLimit()} languages of choice.
          </span>
        </div>
      </div>

      <Show when={viewedBackground()} keyed>
        {(bg) => <BackgroundView background={() => bg} backClick={[showBackgroundView, setShowBackgroundView]} />}
      </Show>
    </div>
  );
};
