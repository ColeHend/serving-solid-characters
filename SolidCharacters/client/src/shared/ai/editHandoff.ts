import type { HomebrewKind, HomebrewPreview } from "./tools/toolDispatcher";

/**
 * One-shot in-memory handoff for the Grimoire assistant's "Edit manually" button. The generated entity
 * isn't saved yet, so a `?name=` lookup on the create page can't find it — instead the card stashes
 * the entity here right before navigating, and the matching create page consumes (and clears) it on
 * mount. Nothing is persisted until the user clicks Create/Update in the editor.
 */
let pending: { kind: HomebrewKind; entity: HomebrewPreview["entity"] } | null = null;

/** Stash a generated entity to hand off to its create page. Called just before navigating. */
export function setEditHandoff(preview: HomebrewPreview): void {
    pending = { kind: preview.kind, entity: preview.entity };
}

/**
 * Take the pending handoff for `kind`, clearing it. Returns null if there's none or the kind doesn't
 * match (so a stale handoff can never populate the wrong editor). Cast to the kind's concrete model.
 */
export function takeEditHandoff<T = HomebrewPreview["entity"]>(kind: HomebrewKind): T | null {
    if (!pending || pending.kind !== kind) return null;
    const entity = pending.entity as T;
    pending = null;
    return entity;
}
