/**
 * Display label for an entity's provenance: the stamped `source` ("SRD 5.1", "SRD 5.2",
 * a user-supplied sourcebook), falling back to "Homebrew" when absent — the same
 * undefined-means-homebrew convention the wizards' version labels use.
 */
export const sourceLabel = (entity: { source?: string } | undefined): string =>
  entity?.source?.trim() || 'Homebrew';
