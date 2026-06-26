import { Component, For, Show } from "solid-js";
import { Chip } from "coles-solid-library";
import { HomebrewPreview } from "../aiSpark.shared";
import { featuresOf } from "../../../shared/ai/commands/commandAgent";
import { commandChipLabel } from "../../../shared/ai/commands/madCommandCatalog";
import styles from "../SparkSidebar.module.scss";

/**
 * Read-only chips for the mechanical "mads" commands the command sub-agent attached to a generated
 * entity's features (e.g. "Add Resistances: Fire", "Add Stats: con, 1"). Lets the user see/trust the
 * effects before saving; editing is done via "Edit manually". Shows an "Adding mechanics…" note while
 * the enrichment pass is still running.
 */
const HomebrewCommands: Component<{ preview: HomebrewPreview }> = (props) => {
    const labels = (): string[] =>
        featuresOf(props.preview.kind, props.preview.entity)
            .flatMap(f => f.metadata?.mads ?? [])
            .map(commandChipLabel)
            .filter(Boolean);

    return (
        <Show when={props.preview.enriching || labels().length}>
            <div class={styles.commandsRow}>
                <Show when={props.preview.enriching}>
                    <span class={`${styles.commandsPending} ${styles.pulse}`}>⚡ Adding mechanics…</span>
                </Show>
                <For each={labels()}>{(label) => <Chip value={label} />}</For>
            </div>
        </Show>
    );
};

export default HomebrewCommands;
