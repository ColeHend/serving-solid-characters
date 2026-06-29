import { LocalApiKind } from "../../models/userSettings";

/**
 * Diagnostics for the user-configured local AI Base URL. Local models are called DIRECTLY from the
 * browser (the .NET proxy can't reach the user's LAN — see localAdapter), so the two things that
 * silently break a direct call have to be detected and explained here rather than surfaced as a
 * vague "is it running?":
 *   - mixed content: an HTTPS page cannot fetch an HTTP cross-origin URL (browser policy), and
 *   - CORS: the local server only answers browser origins it allows (Ollama's OLLAMA_ORIGINS).
 * None of this can MAKE an HTTPS page reach an HTTP endpoint — that's enforced by the browser. It
 * only names the cause and points at the fix.
 */

export type EndpointDiagnosis =
    | { kind: "ok" }              // protocols compatible; worth attempting the real request
    | { kind: "empty" }           // no base url set
    | { kind: "invalid-url" }     // can't parse even after normalization
    | { kind: "mixed-content" };  // https page → http cross-origin target (browser will block)

export type ProbeResult =
    | EndpointDiagnosis
    | { kind: "reachable" }       // got a CORS-permitted response — server up, CORS ok
    | { kind: "blocked-cors" }    // server is up but the browser blocked the real (CORS) request
    | { kind: "down" };           // no response at all — wrong host/port, or server not running

function currentLocation(): Location | undefined {
    return typeof window !== "undefined" ? window.location : undefined;
}

/** The current page origin, or a readable fallback when there's no window (SSR/tests). */
export function currentOrigin(): string {
    const loc = currentLocation();
    return loc ? loc.origin : "this site";
}

/**
 * Normalize a user-typed Base URL so `${base}/api/chat` is always an ABSOLUTE URL:
 *  - trims whitespace,
 *  - if there's no scheme, assumes http:// (a bare `192.168.1.50:11434` would otherwise be parsed
 *    as a path relative to the site origin), and
 *  - strips trailing slashes.
 * Returns "" for empty input.
 */
export function normalizeBaseUrl(raw: string): string {
    const trimmed = (raw ?? "").trim();
    if (!trimmed) return "";
    const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `http://${trimmed}`;
    return withScheme.replace(/\/+$/, "");
}

/**
 * Sync classification of the configured endpoint against the current page origin. The only
 * guaranteed-fail case knowable without a network call is mixed content: an HTTPS page cannot fetch
 * an HTTP cross-origin URL. Everything else is "ok" (worth attempting) — a real up/CORS/down verdict
 * needs {@link probeLocalEndpoint}.
 */
export function diagnoseLocalEndpoint(
    rawBaseUrl: string,
    loc: Location | undefined = currentLocation(),
): EndpointDiagnosis {
    const base = normalizeBaseUrl(rawBaseUrl);
    if (!base) return { kind: "empty" };
    let url: URL;
    try { url = new URL(base); } catch { return { kind: "invalid-url" }; }
    // Mixed content only when the page is HTTPS and the target is HTTP on a NON-loopback host.
    // localhost/127.0.0.1/::1 are trustworthy, so the browser allows them — don't flag those.
    if (loc && loc.protocol === "https:" && url.protocol === "http:" && !isLoopbackHost(url.hostname)) {
        return { kind: "mixed-content" };
    }
    return { kind: "ok" };
}

/**
 * Loopback hosts are "potentially trustworthy" (W3C Secure Contexts), so browsers do NOT apply
 * mixed-content blocking when the TARGET is localhost / 127.0.0.0/8 / ::1 — an HTTPS page can call
 * http://localhost:11434 just fine. A routable LAN IP (192.168.x.x, 10.x.x.x, …) is NOT trustworthy,
 * so that one IS blocked.
 */
function isLoopbackHost(hostname: string): boolean {
    const h = hostname.toLowerCase().replace(/^\[|\]$/g, "");
    return h === "localhost" || h.endsWith(".localhost") || h === "::1" || /^127\./.test(h);
}

/** Path whose reachability mirrors what the real chat request will hit, per local API flavor. */
function probePath(localApi: LocalApiKind): string {
    return localApi === "openai" ? "/v1/models" : "/api/version";
}

/**
 * Active probe for "Test connection". Distinguishes reachable / blocked / down:
 *  1. sync diagnosis first — a mixed-content/invalid/empty URL can't be probed (even no-cors can't
 *     bypass mixed content), so report it directly without a doomed fetch;
 *  2. a normal `cors` GET — if it resolves the browser got a CORS-permitted response → reachable;
 *  3. on failure, a `no-cors` GET — it suppresses the CORS *rejection* but still performs the
 *     network round-trip, so it RESOLVES only when the host is actually up. Resolve → blocked-cors
 *     (server up, origin not allowed), throw → down.
 */
export async function probeLocalEndpoint(
    rawBaseUrl: string,
    opts: { localApi: LocalApiKind; signal?: AbortSignal },
): Promise<ProbeResult> {
    const diagnosis = diagnoseLocalEndpoint(rawBaseUrl);
    if (diagnosis.kind !== "ok") return diagnosis;

    const url = `${normalizeBaseUrl(rawBaseUrl)}${probePath(opts.localApi)}`;
    try {
        // Any resolved cors response (even a 404/401) means we reached the server AND CORS passed.
        await fetch(url, { method: "GET", mode: "cors", cache: "no-store", signal: opts.signal });
        return { kind: "reachable" };
    } catch {
        if (opts.signal?.aborted) return { kind: "down" };
        try {
            // Opaque response: status 0, body unreadable. We only care that it RESOLVED at all.
            await fetch(url, { method: "GET", mode: "no-cors", cache: "no-store", signal: opts.signal });
            return { kind: "blocked-cors" };
        } catch {
            return { kind: "down" };
        }
    }
}

/** Shared one-liner naming the mixed-content cause + fix, embedded in adapter error events. */
export function mixedContentHint(origin: string): string {
    return `This AI endpoint is HTTP on a LAN address, but the site is HTTPS — so the browser blocks the call `
        + `(mixed content). If the model runs on THIS machine, use http://localhost:11434 instead (localhost is exempt). `
        + `Otherwise allow "Insecure content" for this site, or serve the model over HTTPS — and set OLLAMA_ORIGINS to `
        + `allow ${origin}. See AI settings for the full note.`;
}
