import { FlatCard } from "coles-solid-library";
import { Badge } from "coles-solid-library/icons";
import { For, Show, createMemo, Component, Accessor, createSignal } from "solid-js";
import { FeatureDetail, Markdown } from "../../../../../../shared";
import { featureUsage } from "../../../../../../shared/customHooks/mads/commands/useUsesFeature";
import { SectionCard } from "../SectionCard/SectionCard";
import styles from "../../sheet.module.scss";
import { SheetDerived } from "../../useSheetDerived";
import { Character } from "../../../../../../models/character.model";
import { FeatureChoices } from "./parts/featureChoices/FeatureChoices";
import SearchBar from "../../../../../../shared/components/SearchBar/SearchBar";

interface props {
    derived: Accessor<SheetDerived>;
    currentCharacter: Accessor<Character | undefined>;
    displayCharacter: Accessor<Character | undefined>;
    allFeatures: Accessor<FeatureDetail[]>;
    chooseStatAt: (featureKey: string, index: number, statKey: string, count: number) => void;
    toggleProficiencyPick: (featureKey: string, skill: string, count: number) => void;
    proficiencyPicks: (featureKey: string) => string[];
    statLabels: Record<string, string>;
}

export const FeaturesCard:Component<props> = (props) => {
    const d = createMemo(() => props.derived());
    const STAT_LABELS = createMemo(() => props.statLabels);

    const [result, setResult] = createSignal<FeatureDetail[]>([]);

    return <SectionCard icon={Badge} title="Features & Traits">

      <div class={`${styles.searchBar}`}>
        <SearchBar dataSource={props.allFeatures} setResults={setResult} />
      </div>

      <div class={styles.featureList}>
        <For each={result()}>
          {(feature) => {
            const usage = featureUsage(feature, d().level);
            return (
              <FlatCard
                transparent
                header={
                  <div class={styles.featureHeaderRow}>
                    <span class={styles.featureName}>{feature.name}</span>
                    <Show when={feature.metadata?.category || usage}>
                      <span class={styles.featureCat}>
                        {feature.metadata?.category ?? ""}
                        {usage ? `${feature.metadata?.category ? " · " : ""}${usage.max} / ${usage.recharge}` : ""}
                      </span>
                    </Show>
                  </div>
                }
              >
                <div class={styles.featureBody}>
                  <Markdown text={feature.description} />

                  <FeatureChoices 
                    derived={d}
                    currentCharacter={props.currentCharacter}
                    displayCharacter={props.displayCharacter}
                    allFeatures={props.allFeatures}
                    chooseStatAt={props.chooseStatAt}
                    toggleProficiencyPick={props.toggleProficiencyPick}
                    proficiencyPicks={props.proficiencyPicks}
                    statLabels={STAT_LABELS} 
                    feature={feature} />
                </div>
              </FlatCard>
            );
          }}
        </For>
      </div>
    </SectionCard>
}
