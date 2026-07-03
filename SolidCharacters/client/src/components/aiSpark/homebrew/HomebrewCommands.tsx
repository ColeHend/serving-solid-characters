import { Component, For, Show } from "solid-js";
import { Button, Chip } from "coles-solid-library";
import { HomebrewPreview } from "../aiSpark.shared";
import { aiAssistant } from "../../../shared/customHooks/aiAssistant";
import { featuresOf } from "../../../shared/ai/commands/commandAgent";
import { commandChipLabel } from "../../../shared/ai/commands/madCommandCatalog";
import styles from "../SparkSidebar.module.scss";

/**
 * Read-only chips for the mechanical "mads" commands the command sub-agent attached to a generated
 * entity's features (e.g. "Add Resistances: Fire", "Add Stats: con, 1"). Lets the user see/trust the
 * effects before saving; editing is done via "Edit manually". Shows an "Adding mechanics…" note while
 * the enrichment pass is still running, and — once it has run — a "no sheet effect" warning for
 * mechanical features that got no command, with a "Generate commands" repair that re-runs the focused
 * per-feature pass (no chat turn, no repair budget).
 */
const HomebrewCommands: Component<{ preview: HomebrewPreview }> = (props) => {
    const labels = (): string[] =>
        featuresOf(props.preview.kind, props.preview.entity)
            .flatMap(f => f.metadata?.mads ?? [])
            .map(commandChipLabel)
            .filter(Boolean);
    const inert = (): string[] => props.preview.inertFeatures ?? [];

    return (
        <Show when={props.preview.enriching || labels().length || inert().length}>
            <div class={styles.commandsRow}>
                <Show when={props.preview.enriching}>
                    <span class={`${styles.commandsPending} ${styles.pulse}`}>⚡ Adding mechanics…</span>
                </Show>
                <For each={labels()}>{(label) => <Chip value={label} />}</For>
                <Show when={!props.preview.enriching && inert().length}>
                    <span class={styles.commandsPending} title={inert().join(", ")}>
                        ⚠ {inert().length} feature{inert().length === 1 ? " has" : "s have"} no sheet effect
                    </span>
                    <Button
                        transparent
                        title="Re-run the mechanics pass on the flagged features"
                        onClick={() => void aiAssistant.regenerateCommands(props.preview.previewId)}
                    >
                        Generate commands
                    </Button>
                </Show>
            </div>
        </Show>
    );
};

export default HomebrewCommands;
