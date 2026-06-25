import { Component, For, Show, createSignal, onMount } from "solid-js";
import { Button } from "coles-solid-library";
import { FlatCard } from "../../../shared/components/flatCard/flatCard";
import { HOMEBREW_KIND_LABELS } from "../../../shared/ai/homebrewKind";
import { ReviewAgentDef } from "../../../shared/customHooks/utility/localDB/reviewAgentDB";
import { ensureReviewAgentsLoaded, reviewAgents } from "../../../shared/customHooks/reviewAgentManager";
import ReviewAgentEditor from "./ReviewAgentEditor";

/**
 * Manage the user's custom review agents: list existing ones (each in a FlatCard with an inline editor)
 * and add new ones. Backed by reviewAgentManager so the High-mode pipeline sees changes immediately.
 */
const ReviewAgentList: Component = () => {
    const [adding, setAdding] = createSignal(false);
    onMount(() => { void ensureReviewAgentsLoaded(); });

    const appliesLabel = (a: ReviewAgentDef) =>
        a.appliesTo.length === 0 ? "all content" : a.appliesTo.map(k => HOMEBREW_KIND_LABELS[k]).join(", ");

    return (
        <div>
            <label>Custom review agents</label>
            <div style={{ opacity: 0.6, "font-size": "var(--font-size-small)" }}>
                Define your own readiness checks. Each runs as an extra review pass (an LLM call) on the
                content types you choose, during High mode.
            </div>

            <div style={{ "margin-top": "var(--spacing-2)" }}>
                <For each={reviewAgents()} fallback={<div style={{ opacity: 0.6, "font-size": "var(--font-size-small)" }}>No custom agents yet.</div>}>
                    {(agent) => (
                        <FlatCard
                            transparent
                            startOpen={false}
                            headerName={
                                <span>
                                    {agent.enabled ? "" : "(disabled) "}{agent.name}
                                    <span style={{ opacity: 0.6, "font-size": "var(--font-size-small)" }}> — {appliesLabel(agent)}</span>
                                </span>
                            }
                        >
                            <ReviewAgentEditor agent={agent} onDone={() => { /* manager refresh re-renders the list */ }} />
                        </FlatCard>
                    )}
                </For>
            </div>

            <div style={{ "margin-top": "var(--spacing-2)" }}>
                <Show
                    when={adding()}
                    fallback={<Button transparent onClick={() => setAdding(true)}>+ Add review agent</Button>}
                >
                    <FlatCard transparent startOpen headerName={<span>New review agent</span>}>
                        <ReviewAgentEditor onDone={() => setAdding(false)} />
                    </FlatCard>
                </Show>
            </div>
        </div>
    );
};

export default ReviewAgentList;
