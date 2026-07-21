import { FlatCard, Button } from "coles-solid-library";
import { DirectionsRun } from "coles-solid-library/icons";
import { createMemo, Show, Accessor, Component, Setter, For } from "solid-js";
import { 
    grantedActionUsage, 
    actionUsesKey, 
    LONG_REST 
} from "../../../../../../shared/customHooks/mads/commands/useUsesFeature";
import UsesTracker from "../../../usesTracker/usesTracker";
import { SheetDerived } from "../../useSheetDerived";
import styles from "../../sheet.module.scss";
import { FeatureDetail} from "../../../../../../shared";
import { ActionType, Character } from "../../../../../../models/character.model";

interface props {
    derived: Accessor<SheetDerived>;
    activeEconomy: [Accessor<ActionType>, Setter<ActionType>];
    allFeatures: Accessor<FeatureDetail[]>;
    currentCharacter: Accessor<Character | undefined>;
    displayCharacter: Accessor<Character | undefined>;
    spendUses: (name: string, spent: number) => void;
    generricActions: Record<ActionType, { name: string; desc: string }[]>;
}

export const ActionsCard:Component<props> = (props) => {

    const d = createMemo(() => props.derived());
    const GENERIC_ACTIONS = createMemo(() => props.generricActions)

    const [activeEconomy, setActiveEconomy] = props.activeEconomy;

    const economyRows = createMemo(() => {
        const granted = (props.displayCharacter()?.grantedActions ?? [])
        .filter((a) => a.actionType === activeEconomy())
        .map((a) => ({ name: a.name, desc: a.description ?? "", granted: a }));
        
        return [...GENERIC_ACTIONS()[activeEconomy()].map((a) => ({ ...a, granted: undefined })), ...granted];
    });

    return <FlatCard icon={DirectionsRun} header={<span class={styles.cardTitle}>Actions</span>} transparent>
      <div class={styles.segmented}>
        <Button transparent borderTheme={activeEconomy() === "action" ? "primary" : "none"} onClick={() => setActiveEconomy("action")}>Actions</Button>
        <Button transparent borderTheme={activeEconomy() === "bonusAction" ? "primary" : "none"} onClick={() => setActiveEconomy("bonusAction")}>Bonus</Button>
        <Button transparent borderTheme={activeEconomy() === "reaction" ? "primary" : "none"} onClick={() => setActiveEconomy("reaction")}>Reactions</Button>
      </div>
      <For each={economyRows()}>
        {(row) => {
          const usage = createMemo(() => {
            const g = row.granted;
            return g ? grantedActionUsage(g, props.allFeatures(), d().level) : null;
          });

          const poolKey = () => (row.granted ? actionUsesKey(row.granted!) : "");
          
          return <div class={styles.featureBody}>
            <div class={styles.featureHeaderRow}><span class={styles.featureName}>{row.name}</span></div>
            <p>{row.desc}</p>
            <Show when={usage()}>
                <UsesTracker
                    featureName={row.name}
                    max={usage()?.max ?? 0}
                    recharge={usage()?.recharge ?? LONG_REST}
                    spent={props.currentCharacter()?.featureUses?.[poolKey()] ?? 0}
                    onChange={(spent) => props.spendUses(poolKey(), spent)}
                />
            </Show>
          </div>

        }}
      </For>
    </FlatCard>
}