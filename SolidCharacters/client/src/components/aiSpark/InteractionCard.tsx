import { Component, For, Match, Show, Switch, createSignal } from "solid-js";
import { Button, Container, Icon, Input, Radio, RadioGroup } from "coles-solid-library";
import { AltRoute, Assignment, Check, Close, Edit, Help, Send } from "coles-solid-library/icons";
import { Markdown } from "../../shared/components/MarkDown/MarkDown";
import { aiAssistant } from "../../shared/customHooks/aiAssistant";
import type { PendingInteraction } from "../../shared/ai/interactions";
import styles from "./SparkSidebar.module.scss";

/**
 * An interactive card the model raised via ask_user / propose_plan. It WAITS for the user, whose
 * response is fed back as the tool_result (aiAssistant.answerInteraction) to continue the turn. Mirrors
 * HomebrewPreviewCard's surface styling. Nothing happens until the user clicks an action.
 */
const InteractionCard: Component<{ interaction: PendingInteraction }> = (props) => {
    const it = () => props.interaction;
    const busy = () => aiAssistant.status() === "streaming";

    // ----- ask state -----
    const [selected, setSelected] = createSignal<string>("");
    const [freeText, setFreeText] = createSignal("");
    // Typed text takes precedence over a selected option (a deliberate override); otherwise use the option.
    const canSend = () => freeText().trim().length > 0 || selected().length > 0;
    const sendAsk = () => {
        const text = freeText().trim();
        if (text) { aiAssistant.answerInteraction(it().interactionId, { type: "freeText", text }); return; }
        const opt = it().options?.find(o => o.id === selected());
        if (opt) aiAssistant.answerInteraction(it().interactionId, { type: "option", optionId: opt.id, label: opt.label });
    };

    // ----- plan state -----
    const [refining, setRefining] = createSignal(false);
    const [refineText, setRefineText] = createSignal("");
    const approve = () => aiAssistant.answerInteraction(it().interactionId, { type: "plan_accept" });
    const reject = () => aiAssistant.answerInteraction(it().interactionId, { type: "plan_reject" });
    const sendRefine = () => {
        const text = refineText().trim();
        if (text) aiAssistant.answerInteraction(it().interactionId, { type: "plan_refine", text });
    };

    const dismiss = () => aiAssistant.answerInteraction(it().interactionId, { type: "dismiss" });

    return (
        <Container theme="surface" class={styles.previewCard}>
            <Switch>
                {/* ----- ask_user: a question or a set of directions ----- */}
                <Match when={it().kind === "ask"}>
                    <div class={styles.previewHeader}>
                        <div>
                            <strong>{it().title}</strong>
                            <div class={styles.previewSubtitle}>
                                {it().style === "directions" ? "Choose a direction" : "Spark has a question"}
                            </div>
                        </div>
                        <Icon icon={it().style === "directions" ? AltRoute : Help} size="small" />
                    </div>
                    <Show when={it().body}>
                        <div class={styles.previewBody}><Markdown text={it().body ?? ""} /></div>
                    </Show>
                    <Show when={(it().options?.length ?? 0) > 0}>
                        <RadioGroup value={selected()} onChange={(v) => setSelected(String(v))}>
                            <For each={it().options}>{(o) => (
                                <Radio
                                    value={o.id}
                                    label={
                                        <span class={styles.optionLabel}>
                                            <span>{o.label}</span>
                                            <Show when={o.detail}><span class={styles.optionDetail}>{o.detail}</span></Show>
                                        </span>
                                    }
                                />
                            )}</For>
                        </RadioGroup>
                    </Show>
                    <Show when={it().allowFreeText}>
                        <Input
                            placeholder={(it().options?.length ?? 0) > 0 ? "…or type your own answer" : "Type your answer"}
                            value={freeText()}
                            onInput={(e) => setFreeText(e.currentTarget.value)}
                        />
                    </Show>
                    <div class={styles.previewActions}>
                        <Button theme="primary" disabled={!canSend() || busy()} onClick={sendAsk}>
                            <Icon icon={Send} size="small" /> Send
                        </Button>
                        <Button transparent title="Skip this question" onClick={dismiss}>
                            <Icon icon={Close} size="small" /> Dismiss
                        </Button>
                    </div>
                </Match>

                {/* ----- propose_plan: design goal + steps, awaiting approval ----- */}
                <Match when={it().kind === "plan"}>
                    <div class={styles.previewHeader}>
                        <div>
                            <strong>{it().title}</strong>
                            <div class={styles.previewSubtitle}>Proposed plan</div>
                        </div>
                        <Icon icon={Assignment} size="small" />
                    </div>
                    <Show when={it().body}>
                        <div class={styles.previewBody}><Markdown text={it().body ?? ""} /></div>
                    </Show>
                    <Show when={(it().steps?.length ?? 0) > 0}>
                        <ol class={styles.planSteps}>
                            <For each={it().steps}>{(s) => <li>{s}</li>}</For>
                        </ol>
                    </Show>
                    <Show when={(it().constraints?.length ?? 0) > 0}>
                        <div class={styles.planConstraints}>
                            <For each={it().constraints}>{(c) => <span class={styles.constraintChip}>{c}</span>}</For>
                        </div>
                    </Show>
                    <Show when={refining()}>
                        <Input
                            placeholder="What should change?"
                            value={refineText()}
                            onInput={(e) => setRefineText(e.currentTarget.value)}
                        />
                    </Show>
                    <div class={styles.previewActions}>
                        <Show when={refining()} fallback={
                            <>
                                <Button theme="primary" disabled={busy()} title="Approve and let Spark proceed" onClick={approve}>
                                    <Icon icon={Check} size="small" /> Approve
                                </Button>
                                <Button transparent title="Ask Spark to adjust the plan" onClick={() => setRefining(true)}>
                                    <Icon icon={Edit} size="small" /> Refine
                                </Button>
                                <Button transparent title="Reject this plan" onClick={reject}>
                                    <Icon icon={Close} size="small" /> Reject
                                </Button>
                            </>
                        }>
                            <Button theme="primary" disabled={!refineText().trim() || busy()} onClick={sendRefine}>
                                <Icon icon={Send} size="small" /> Send changes
                            </Button>
                            <Button transparent onClick={() => { setRefining(false); setRefineText(""); }}>
                                Cancel
                            </Button>
                        </Show>
                    </div>
                </Match>
            </Switch>
        </Container>
    );
};

export default InteractionCard;
