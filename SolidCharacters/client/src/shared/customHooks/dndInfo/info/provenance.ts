/**
 * Display-only provenance marker stamped onto homebrew rows where the SRD and homebrew
 * arrays are merged (the `all/*` aggregator hooks). Homebrew rows cloned from SRD data
 * carry the SRD's `id`, `legacy`, AND `source`, so no field heuristic can tell a clone
 * from its original — only the merge point knows which store a row came from.
 *
 * Lives in its own leaf so both the aggregators and modals.shared.ts can import it
 * without a customHooks → components cycle.
 */
export type WithProvenance<T> = T & { __homebrew?: boolean };

export const markHomebrew = <T,>(rows: readonly T[]): WithProvenance<T>[] =>
  rows.map(r => ({ ...r, __homebrew: true }));

export const isHomebrewMarked = (e: unknown): boolean =>
  !!(e as { __homebrew?: boolean } | null | undefined)?.__homebrew;
