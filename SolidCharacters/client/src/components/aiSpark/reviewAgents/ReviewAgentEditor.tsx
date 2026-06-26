import { Component, For, Show, createSignal } from "solid-js";
import { Button, Checkbox, Input, Option, Select, TextArea, addSnackbar } from "coles-solid-library";
import { ReviewSeverity } from "../../../models/userSettings";
import { HOMEBREW_KINDS, HOMEBREW_KIND_LABELS, HomebrewKind } from "../../../shared/ai/refs/homebrewKind";
import { ReviewAgentDef } from "../../../shared/customHooks/utility/localDB/reviewAgentDB";
import { deleteReviewAgent, saveReviewAgent } from "../../../shared/customHooks/reviewAgentManager";

const hint = { opacity: 0.6, "font-size": "var(--font-size-small)" } as const;
const row = { "margin-top": "var(--spacing-2)" } as const;

/**
 * Create/edit form for a single custom review agent ("readiness subagent"). Plugs into the High-mode
 * pipeline via reviewAgentManager — its criteria shape WHAT it judges, never the verdict contract
 * (every agent reports through the same report_review tool), so the pipeline can always parse it.
 */
const ReviewAgentEditor: Component<{ agent?: ReviewAgentDef; onDone: () => void }> = (props) => {
    const [name, setName] = createSignal(props.agent?.name ?? "");
    const [enabled, setEnabled] = createSignal(props.agent?.enabled ?? true);
    const [applies, setApplies] = createSignal<HomebrewKind[]>(props.agent?.appliesTo ?? []);
    const [criteria, setCriteria] = createSignal(props.agent?.criteria ?? "");
    const [rubric, setRubric] = createSignal(props.agent?.rubric ?? "");
    const [severity, setSeverity] = createSignal<ReviewSeverity>(props.agent?.severity ?? "warning");
    const [busy, setBusy] = createSignal(false);

    const toggleKind = (kind: HomebrewKind, on: boolean) =>
        setApplies(prev => on ? [...prev, kind] : prev.filter(k => k !== kind));

    const save = async () => {
        if (!name().trim() || !criteria().trim()) {
            addSnackbar({ message: "Give the agent a name and review criteria.", severity: "error" });
            return;
        }
        setBusy(true);
        try {
            await saveReviewAgent({
                id: props.agent?.id,
                createdAt: props.agent?.createdAt,
                name: name().trim(),
                enabled: enabled(),
                appliesTo: applies(),
                criteria: criteria().trim(),
                rubric: rubric().trim() || undefined,
                severity: severity(),
            });
            addSnackbar({ message: `Review agent "${name().trim()}" saved.`, severity: "success" });
            props.onDone();
        } catch (e) {
            addSnackbar({ message: `Could not save agent: ${String(e)}`, severity: "error" });
        } finally {
            setBusy(false);
        }
    };

    const remove = async () => {
        if (!props.agent) return;
        setBusy(true);
        await deleteReviewAgent(props.agent.id);
        addSnackbar({ message: "Review agent deleted.", severity: "success" });
        setBusy(false);
        props.onDone();
    };

    return (
        <div>
            <div style={row}>
                <label for="ra-name">Name</label>
                <Input id="ra-name" value={name()} placeholder="e.g. Lore Consistency Critic" onInput={(e) => setName(e.currentTarget.value)} />
            </div>

            <div style={row}>
                <Checkbox label="Enabled" checked={enabled()} onChange={setEnabled} />
            </div>

            <div style={row}>
                <label>Applies to</label>
                <div style={hint}>Leave all unchecked to review every content type.</div>
                <div style={{ display: "grid", "grid-template-columns": "1fr 1fr", gap: "var(--spacing-1)", "margin-top": "var(--spacing-1)" }}>
                    <For each={HOMEBREW_KINDS}>{(kind) => (
                        <Checkbox label={HOMEBREW_KIND_LABELS[kind]} checked={applies().includes(kind)} onChange={(c) => toggleKind(kind, c)} />
                    )}</For>
                </div>
            </div>

            <div style={row}>
                <label for="ra-criteria">Review criteria</label>
                <TextArea text={criteria} setText={setCriteria} placeholder="What should this agent check? e.g. 'Flag content that contradicts established Forgotten Realms lore.'" />
            </div>

            <div style={row}>
                <label for="ra-rubric">Pass/fail rubric (optional)</label>
                <TextArea text={rubric} setText={setRubric} placeholder="When should it fail vs. pass? e.g. 'Fail only for direct contradictions, not omissions.'" />
            </div>

            <div style={row}>
                <label>Max severity</label>
                <Select<string> value={severity()} onSelect={(e) => setSeverity(e as ReviewSeverity)}>
                    <Option value="info">Info — note only, never blocks</Option>
                    <Option value="warning">Warning — flags but doesn't block</Option>
                    <Option value="error">Error — can block Save</Option>
                </Select>
            </div>

            <div style={{ ...row, display: "flex", gap: "var(--spacing-1)" }}>
                <Button theme="primary" disabled={busy()} onClick={save}>Save agent</Button>
                <Button transparent disabled={busy()} onClick={props.onDone}>Cancel</Button>
                <Show when={props.agent}>
                    <Button transparent disabled={busy()} onClick={remove}>Delete</Button>
                </Show>
            </div>
        </div>
    );
};

export default ReviewAgentEditor;
