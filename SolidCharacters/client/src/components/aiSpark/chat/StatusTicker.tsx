import { Component, Show, createEffect, createSignal, onCleanup } from "solid-js";
import { AiPhase, aiAssistant } from "../../../shared/customHooks/aiAssistant";
import styles from "../SparkSidebar.module.scss";

/**
 * The default "Grimoire is working" indicator: a single flavor line whose trailing dots cycle
 * `.` → `..` → `...` and that swaps to a new message after each full dot cycle. The message pool is
 * chosen from what the assistant is actually doing right now ({@link AiPhase}), so the flavor fits the
 * work. Shown in place of the raw "Thinking…" reasoning unless the user opts into seeing thoughts.
 */
const PHASE_MESSAGES: Record<AiPhase, string[]> = {
    thinking: ["Pondering the question", "Consulting my index", "Turning the pages", "Gathering my thoughts", "Tracing the runes"],
    lookup: ["Scouring the tomes", "Cross-referencing the SRD", "Checking the rules", "Searching the stacks"],
    research: ["Sending out a familiar", "Dispatching an apprentice", "Combing distant libraries", "Summoning sources"],
    compute: ["Running the numbers", "Tallying modifiers", "Rolling the math", "Casting arithmetic"],
    homebrew: ["Inscribing the entry", "Brewing something new", "Mixing the ink", "Drawing up a draft"],
    editing: ["Revising the manuscript", "Amending the entry", "Re-inking the page"],
    idle: ["Thinking"],
};

const TICK_MS = 1000;            // dot cadence: . .. ... loop
const DOT_STEPS = 3;            // dots cycle 1 → 2 → 3
const CYCLES_PER_MESSAGE = 1;   // full 1→3 dot cycles shown before the message swaps (tune to taste)

const StatusTicker: Component = () => {
    const reduced = typeof window !== "undefined" && !!window.matchMedia
        && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const [tick, setTick] = createSignal(0);
    const [msgIndex, setMsgIndex] = createSignal(0);
    const [msgBase, setMsgBase] = createSignal(0);

    // Re-seed and restart whenever the phase changes so the new pool opens on a fresh (random) line.
    createEffect(() => {
        aiAssistant.activePhase();
        setTick(0);
        setMsgIndex(0);
        setMsgBase(Math.floor(Math.random() * 1000));
    });

    if (!reduced && typeof window !== "undefined") {
        const id = window.setInterval(() => {
            setTick((t) => {
                const next = t + 1;
                if (next % (DOT_STEPS * CYCLES_PER_MESSAGE) === 0) setMsgIndex((i) => i + 1);
                return next;
            });
        }, TICK_MS);
        onCleanup(() => window.clearInterval(id));
    }

    const dotCount = () => (tick() % DOT_STEPS) + 1;
    const message = () => {
        const pool = PHASE_MESSAGES[aiAssistant.activePhase()] ?? PHASE_MESSAGES.idle;
        return pool[(msgBase() + msgIndex()) % pool.length];
    };

    // The list is already an aria-live log; expose one stable label and hide the rotating text/dots
    // from screen readers so they don't announce every swap.
    return (
        <div class={`${styles.thinking} ${styles.statusTicker}`} aria-label="Grimoire is working…">
            <span aria-hidden="true">
                {message()}
                <Show when={!reduced} fallback={<span>…</span>}>
                    <span class={styles.statusDots}>
                        <span classList={{ [styles.dotHidden]: dotCount() < 1 }}>.</span>
                        <span classList={{ [styles.dotHidden]: dotCount() < 2 }}>.</span>
                        <span classList={{ [styles.dotHidden]: dotCount() < 3 }}>.</span>
                    </span>
                </Show>
            </span>
        </div>
    );
};

export default StatusTicker;
