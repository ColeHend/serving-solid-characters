import { Bolt } from "coles-solid-library/icons";
import { Show, For, Accessor, Component, createMemo } from "solid-js";
import UsesTracker from "../../../usesTracker/usesTracker";
import { SectionCard } from "../SectionCard/SectionCard";
import { FeatureDetail } from "../../../../../../models/generated";
import { FeatureUsage } from "../../../../../../shared/customHooks/mads/commands/useUsesFeature";
import { Character } from "../../../../../../models/character.model";
import styles from "../../sheet.module.scss";

type limitedFeature = {
    feature: FeatureDetail;
    usage: FeatureUsage;
};

interface props {
    limitedFeatures: Accessor<limitedFeature[]>;
    currentCharacter: Accessor<Character | undefined>;
}

export const ResourcesCard:Component<props> = (props) => {

    const limitedFeatures = createMemo(() => props.limitedFeatures());

    return <Show when={limitedFeatures().length}>
      <SectionCard icon={Bolt} title="Resources">
        {/* Index (position-keyed) so spending a use updates in place instead of tearing down
            and rebuilding the row — a reference-keyed <For> here reflowed the whole page. */}
        <For each={limitedFeatures()}>
          {(item) => (
            <div class={styles.deathRow}>
              <span class={styles.featureName}>{item.feature.name}</span>
              <UsesTracker
                featureName={item.feature.name}
                max={item.usage.max}
                recharge={item.usage.recharge}
                spent={props.currentCharacter()?.featureUses?.[item.feature.name] ?? 0}
                // onChange={(spent) => props.spendUses(item.feature.name, spent)}
              />
            </div>
          )}
        </For>
      </SectionCard>
    </Show>
}