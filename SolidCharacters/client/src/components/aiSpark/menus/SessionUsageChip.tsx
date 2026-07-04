import { Component, Show, createEffect, createSignal, onCleanup, onMount } from "solid-js";
import { Button, Icon } from "coles-solid-library";
import { Bolt, Close, Refresh } from "coles-solid-library/icons";
import useClickOutside from "solid-click-outside";
import getUserSettings from "../../../shared/customHooks/userSettings";
import { DEFAULT_AI_TOKEN_CAP } from "../../../models/userSettings";
import { sessionUsage } from "../../../shared/ai/usage";
import {
    capStatus, combinedUsed, ensureOverallUsageLoaded, overallUsage, resetOverall,
} from "../../../shared/ai/overallUsage";
import { fmtExact, fmtTokens } from "../aiSpark.shared";
import styles from "../SparkSidebar.module.scss";

/**
 * Compact token readout in the Grimoire header. The trigger shows THIS chat's running total (the
 * per-conversation "entire chat session" figure the user asked for); when a budget cap is set it instead
 * shows the persistent OVERALL "used / cap" — the number the soft-block is enforced against — and turns
 * amber near the cap / red at it. Clicking opens an in-sidebar popover with the full breakdown (this chat's
 * in/out/requests, the overall used vs cap, and a Reset button that zeroes the overall total and clears any
 * block). Hand-rolled popover (NOT coles Menu, which portals to <body> behind the z-1200 sidebar — same
 * reason DecisionLog avoids Modal).
 */
const SessionUsageChip: Component = () => {
    const [show, setShow] = createSignal(false);
    const [rootRef, setRootRef] = createSignal<HTMLDivElement>();
    let dialog: HTMLDivElement | undefined;

    const [settings] = getUserSettings();
    const cap = () => settings().ai?.tokenCap ?? DEFAULT_AI_TOKEN_CAP;
    const hasCap = () => cap() > 0;
    const session = () => sessionUsage();
    const overall = () => overallUsage();
    const overallUsed = () => combinedUsed(overall());
    const sessionUsed = () => combinedUsed(session());
    const state = () => capStatus(overallUsed(), cap());   // "unlimited" | "ok" | "warn" | "over"

    // Keep the header uncluttered until there's something to show: nothing spent this chat AND no cap set.
    const visible = () => session().requestCount > 0 || sessionUsed() > 0 || hasCap();
    const estimated = () => (hasCap() ? overall().estimated : session().estimated);

    // Trigger label: a set cap shows the budget "used / cap"; otherwise this chat's total.
    const label = () => hasCap()
        ? `${overall().estimated ? "~" : ""}${fmtTokens(overallUsed())} / ${fmtTokens(cap())}`
        : `${session().estimated ? "~" : ""}${fmtTokens(sessionUsed())}`;

    onMount(() => { void ensureOverallUsageLoaded(); });
    useClickOutside(rootRef, () => setShow(false));

    createEffect(() => {
        if (!show()) return;
        queueMicrotask(() => dialog?.focus());
        const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setShow(false); };
        document.addEventListener("keydown", onKey);
        onCleanup(() => document.removeEventListener("keydown", onKey));
    });

    return (
        <Show when={visible()}>
            <div class={styles.usageMenu} ref={setRootRef}>
                <Show when={show()}>
                    <div ref={dialog} tabindex={-1} class={styles.usagePopover} role="dialog" aria-label="Token usage">
                        <div class={styles.logPopoverHead}>
                            <strong>Token usage</strong>
                            <Button transparent title="Close token usage" aria-label="Close token usage" onClick={() => setShow(false)}>
                                <Icon icon={Close} size="small" />
                            </Button>
                        </div>
                        <div class={styles.usageBreakdown}>
                            <div class={styles.usageRow}><span>This chat</span><span>{session().estimated ? "~" : ""}{fmtExact(sessionUsed())} tok</span></div>
                            <div class={styles.usageSub}>{fmtExact(session().inputTokens)} in · {fmtExact(session().outputTokens)} out · {session().requestCount} request{session().requestCount === 1 ? "" : "s"}</div>
                            <div class={styles.usageRow}>
                                <span>Overall used</span>
                                <span>{overall().estimated ? "~" : ""}{fmtExact(overallUsed())}{hasCap() ? ` / ${fmtExact(cap())}` : ""}</span>
                            </div>
                            <div class={styles.usageSub}>
                                {hasCap()
                                    ? (state() === "over"
                                        ? "Budget reached — new turns are blocked until you Reset or raise the cap."
                                        : "Counts every model call across all chats.")
                                    : "No budget cap set (0 = unlimited). Set one in AI settings."}
                            </div>
                            <Button transparent classList={{ [styles.usageReset]: true }} title="Reset the overall token total to zero" onClick={() => resetOverall()}>
                                <Icon icon={Refresh} size="small" /> Reset overall
                            </Button>
                        </div>
                        <Show when={estimated()}>
                            <div class={styles.usageNote}>~ figures are estimated (the model server didn't report exact token counts).</div>
                        </Show>
                    </div>
                </Show>
                <Button
                    transparent
                    classList={{ [styles.usageWarn]: state() === "warn", [styles.usageOver]: state() === "over" }}
                    title="Token usage for this chat"
                    aria-label={`Tokens ${hasCap() ? `${fmtExact(overallUsed())} of ${fmtExact(cap())} budget` : `${fmtExact(sessionUsed())} this chat`}`}
                    aria-haspopup="dialog"
                    aria-expanded={show()}
                    onClick={() => setShow(v => !v)}
                >
                    <Icon icon={Bolt} size="small" />
                    <span class={styles.usageCount}>{label()}</span>
                </Button>
            </div>
        </Show>
    );
};

export default SessionUsageChip;
