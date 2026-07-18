export function createNewId(): string {
    // crypto.randomUUID only exists in secure contexts (it THROWS via undefined-call on
    // http LAN origins / some webviews) — and this feeds the destructive characters-table
    // re-key migration, so it must never throw.
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        return crypto.randomUUID();
    }
    // Fallback to a simple random string if crypto.randomUUID is not supported
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
