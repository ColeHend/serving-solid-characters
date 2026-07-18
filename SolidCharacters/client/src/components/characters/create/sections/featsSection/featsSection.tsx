import { Component, For, Show, createMemo, createSignal } from "solid-js";
import { Button, Chip, Input } from "coles-solid-library";
import { Feat, PrerequisiteType } from "../../../../../models/generated";
import FeatView from "../../../../../shared/components/modals/featModal/featView";
import { featCategory, normalizeAbility, summarize } from "../../rules/engine";
import { InfoButton } from "../../shell/infoButton";
import { LegacyBadge } from "../../shell/legacyBadge";
import { useCreate } from "../../state/createContext";
import { FeatureChoices } from "./featureChoices";
import styles from "./featsSection.module.scss";

export const FeatsSection: Component = () => {
  const { draft, actions, derived, data } = useCreate();
  const [search, setSearch] = createSignal("");

  const [viewedFeat, setViewedFeat] = createSignal<Feat>();
  const [showFeatView, setShowFeatView] = createSignal(false);
  const viewFeat = (feat: Feat) => {
    setViewedFeat(feat);
    setShowFeatView(true);
  };
  const featByName = (name: string | undefined) =>
    data.feats().find((feat) => feat.details?.name?.toLowerCase() === (name ?? "").toLowerCase());

  const filteredFeats = createMemo(() => {
    const query = search().trim().toLowerCase();
    return data
      .feats()
      .filter((feat) => !query || feat.details?.name?.toLowerCase().includes(query))
      .sort((a, b) => (a.details?.name ?? "").localeCompare(b.details?.name ?? ""));
  });

  const isTaken = (name: string | undefined) => !!name && draft.feats.includes(name);

  /** Prerequisite summary; ability-score ones ("Strength 13") are checked, the rest shown as-is. */
  const prereqStatus = (feat: Feat): { text: string; unmet: boolean } | null => {
    const prereqs = feat.prerequisites ?? [];
    if (prereqs.length === 0) return null;
    const text = prereqs.map((p) => p.value).filter(Boolean).join(", ");
    if (!text) return null;
    const unmet = prereqs.some((p) => {
      if (p.type !== PrerequisiteType.Stat) return false;
      const match = (p.value ?? "").match(/([A-Za-z]+)\D*(\d+)/);
      const key = match ? normalizeAbility(match[1]) : undefined;
      return key !== undefined && derived.effectiveScores()[key] < parseInt(match![2], 10);
    });
    return { text, unmet };
  };

  return (
    <div>
      <div class={styles.takenRow}>
        <Show when={derived.backgroundFeat()}>
          <span class={styles.lockedChip}>
            {derived.backgroundFeat()} · from background
            <Show when={featByName(derived.backgroundFeat())}>
              {(feat) => (
                <InfoButton label={`View ${derived.backgroundFeat()} details`} onClick={() => viewFeat(feat())} />
              )}
            </Show>
          </span>
        </Show>
        <For each={draft.feats}>
          {(name) => (
            <span class={styles.chipWithInfo}>
              <Chip value={name} remove={() => actions.removeFeat(name)} />
              <Show when={featByName(name)}>
                {(feat) => <InfoButton label={`View ${name} details`} onClick={() => viewFeat(feat())} />}
              </Show>
            </span>
          )}
        </For>
      </div>

      <Input
        value={search()}
        onInput={(e) => setSearch(e.currentTarget.value)}
        placeholder="Search feats…"
      />

      <div class={styles.featList}>
        <For each={filteredFeats()}>
          {(feat) => (
            <div class={styles.featRow}>
              <div class={styles.featText}>
                <span class={styles.featName}>
                  {feat.details?.name}
                  <Show when={draft.edition === "both" && feat.legacy === true}>
                    <LegacyBadge />
                  </Show>
                  <InfoButton label={`View ${feat.details?.name} details`} onClick={() => viewFeat(feat)} />
                  <span class={styles.categoryChip}>{featCategory(feat)}</span>
                </span>
                <span class={styles.featDescription}>{summarize(feat.details?.description)}</span>
                <Show when={prereqStatus(feat)}>
                  {(status) => (
                    <span
                      class={styles.prereqLine}
                      classList={{ [styles.prereqUnmet]: status().unmet }}
                    >
                      Prerequisite: {status().text}
                      <Show when={status().unmet}> — not met (taken anyway is allowed)</Show>
                    </span>
                  )}
                </Show>
              </div>
              <Show
                when={isTaken(feat.details?.name)}
                fallback={
                  <Button onClick={() => actions.addFeat(feat.details?.name ?? "")}>Add</Button>
                }
              >
                <Button theme="error" transparent onClick={() => actions.removeFeat(feat.details?.name ?? "")}>
                  Remove
                </Button>
              </Show>
            </div>
          )}
        </For>
      </div>

      <FeatureChoices />

      <Show when={viewedFeat()} keyed>
        {(feat) => <FeatView feat={() => feat} show={[showFeatView, setShowFeatView]} width="40%" height="40%" />}
      </Show>
    </div>
  );
};
