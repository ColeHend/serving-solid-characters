import { DEFAULT_AI_NUM_CTX } from "../../../models/userSettings";
import { buildProvider } from "../providerFactory";
import { AiMessage } from "../types";
import { HomebrewPreview } from "../toolDispatcher";
import { balanceFacts } from "./balanceFacts";
import { REPORT_REVIEW_TOOL } from "./reviewTool";
import { buildReviewSystemPrompt, ReviewPassSpec } from "./reviewSystemPrompt";
import { ReviewContext, ReviewIssue, ReviewSeverity, ReviewVerdict, severityRank } from "./types";

// Small defensive coercers — the model's tool args are untrusted (mirrors toolDispatcher's coercers).
const str = (v: unknown): string => (typeof v === "string" ? v : v == null ? "" : String(v));
const coerceSeverity = (v: unknown): ReviewSeverity | null =>
    v === "info" || v === "warning" || v === "error" ? v : null;

/** Cap a model-reported severity at the pass's allowed maximum (custom agents limit how loud they get). */
function capSeverity(reported: ReviewSeverity, cap: ReviewSeverity | undefined): ReviewSeverity {
    if (!cap) return reported;
    return severityRank(reported) > severityRank(cap) ? cap : reported;
}

function buildUserMessage(preview: HomebrewPreview, facts: string): string {
    const json = JSON.stringify(preview.entity);
    let msg = `Review this homebrew ${preview.kind.replace("_", " ")} named "${preview.title}".\n\nEntity (JSON):\n${json}`;
    if (facts) msg += `\n\nReference figures (computed, advisory):\n${facts}`;
    msg += "\n\nCall report_review with your verdict.";
    return msg;
}

/** Pull the report_review verdict out of the accumulated tool-call args, or null if none parsed. */
function parseVerdict(spec: ReviewPassSpec, acc: Map<number, { args: string }>): ReviewVerdict | null {
    for (const a of acc.values()) {
        if (!a.args.trim()) continue;
        let input: Record<string, unknown>;
        try { input = JSON.parse(a.args); } catch { continue; }

        const reported = coerceSeverity(input.severity) ?? "warning";
        const severity = capSeverity(reported, spec.severity);
        const rawIssues = Array.isArray(input.issues) ? input.issues : [];
        const issues: ReviewIssue[] = rawIssues
            .map((r) => {
                const o = (r ?? {}) as Record<string, unknown>;
                return { severity, message: str(o.message), field: str(o.field) || undefined, suggestedFix: str(o.suggestedFix) || undefined };
            })
            .filter((i) => i.message.trim().length > 0);

        // pass=false with no detail → synthesize one so the finding isn't silently dropped.
        if (input.pass !== true && issues.length === 0) {
            issues.push({ severity, message: `The ${spec.label.toLowerCase()} review flagged a problem but gave no detail.` });
        }
        return { passId: spec.passId, label: spec.label, pass: issues.length === 0, issues };
    }
    return null;
}

/**
 * Run ONE LLM review pass over a preview and return its verdict. Forces structured output via
 * report_review, consumes the stream like a homebrew turn, and FAILS OPEN (pass, no issues) on any
 * problem — abort, network error, refusal, or a model that didn't call the tool — so a flaky reviewer
 * never blocks the user. Uses the reviewer model when configured, else the primary model.
 */
export async function runLlmReview(spec: ReviewPassSpec, preview: HomebrewPreview, ctx: ReviewContext): Promise<ReviewVerdict> {
    const { ai, dndSystem, signal } = ctx;
    const failOpen: ReviewVerdict = { passId: spec.passId, label: spec.label, pass: true, issues: [] };
    try {
        const provider = buildProvider(ai);
        const model = ai.review?.reviewerMode === "separate" && ai.review.reviewerModel?.trim()
            ? ai.review.reviewerModel.trim()
            : ai.model;
        const system = buildReviewSystemPrompt(spec, preview.kind, dndSystem);
        const facts = spec.passId === "balance" ? balanceFacts(preview) : "";
        const messages: AiMessage[] = [{ role: "user", text: buildUserMessage(preview, facts) }];

        const acc = new Map<number, { args: string }>();
        for await (const ev of provider.streamChat(messages, [REPORT_REVIEW_TOOL], {
            model,
            system,
            maxTokens: 512,                                       // a verdict is short
            numCtx: ai.review?.reviewerNumCtx ?? ai.numCtx ?? DEFAULT_AI_NUM_CTX,
            think: false,                                          // reasoning would burn the tiny budget before the tool call
            signal,
        })) {
            switch (ev.type) {
                case "tool_call_start": acc.set(ev.index, { args: "" }); break;
                case "tool_call_delta": { const a = acc.get(ev.index); if (a) a.args += ev.argsDelta; break; }
                case "error": return failOpen;
                case "message_done": return parseVerdict(spec, acc) ?? failOpen;
            }
        }
        return parseVerdict(spec, acc) ?? failOpen;
    } catch {
        return failOpen;
    }
}
