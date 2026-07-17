/**
 * Helpers for the "both editions" ruleset: merged 2014+2024 lists render side by side
 * (legacy rows badged, nothing hidden), and species↔background picks are kept on the
 * same edition side — a legacy species pairs with legacy backgrounds and vice versa,
 * because the two editions grant ability increases through different halves of that pair.
 *
 * "Side" is a boolean: true = legacy (2014), false = current (2024). Homebrew rows carry
 * no `legacy` flag and count as current — a legacy anchor therefore hides homebrew
 * counterparts (documented simplification).
 */

export interface Legacyish {
  legacy?: boolean;
}

export const isLegacy = (entity: Legacyish | undefined): boolean => entity?.legacy === true;

const defaultNameOf = <T,>(row: T): string | undefined => (row as { name?: string }).name;

/** Of several same-named rows, the current (non-legacy) one wins; else the first. */
export function preferCurrent<T extends Legacyish>(matches: T[]): T | undefined {
  return matches.find((m) => !isLegacy(m)) ?? matches[0];
}

/**
 * The edition side a picked name anchors: true when every matching row is legacy,
 * false when every matching row is current. A name that exists on both sides (or
 * matches nothing) anchors nothing — it is compatible with either side.
 */
export function editionSideOf<T extends Legacyish>(
  rows: T[],
  name: string,
  nameOf: (row: T) => string | undefined = defaultNameOf,
): boolean | undefined {
  if (!name) return undefined;
  const variants = rows.filter((row) => (nameOf(row) ?? "").toLowerCase() === name.toLowerCase());
  if (variants.length === 0) return undefined;
  const hasLegacy = variants.some(isLegacy);
  const hasCurrent = variants.some((v) => !isLegacy(v));
  if (hasLegacy && hasCurrent) return undefined;
  return hasLegacy;
}

/** True when `name` has a variant on the given side (undefined side accepts anything). */
export function hasVariantOnSide<T extends Legacyish>(
  rows: T[],
  name: string,
  side: boolean | undefined,
  nameOf: (row: T) => string | undefined = defaultNameOf,
): boolean {
  if (side === undefined) return true;
  return rows.some(
    (row) => (nameOf(row) ?? "").toLowerCase() === name.toLowerCase() && isLegacy(row) === side,
  );
}

/** A merged list narrowed to one edition side; undefined side keeps everything. */
export function filterPool<T extends Legacyish>(rows: T[], side: boolean | undefined): T[] {
  if (side === undefined) return rows;
  return rows.filter((row) => isLegacy(row) === side);
}

/**
 * Prepend the pairing-resolved variant so name-keyed `find` lookups (the pure mapper)
 * hit the edition-correct row before the default one.
 */
export function withVariantFirst<T>(rows: T[], variant: T | undefined): T[] {
  return variant ? [variant, ...rows] : rows;
}

/**
 * Resolve a picked name to the edition-correct row: with an anchored side, prefer the
 * variant on that side (so a legacy species surfaces the 2014 Acolyte, not the 2024 one);
 * otherwise the current-edition variant wins.
 */
export function resolveVariant<T extends Legacyish>(
  rows: T[],
  name: string,
  side: boolean | undefined,
  nameOf: (row: T) => string | undefined = defaultNameOf,
): T | undefined {
  if (!name) return undefined;
  const matches = rows.filter((row) => (nameOf(row) ?? "").toLowerCase() === name.toLowerCase());
  if (side !== undefined) {
    const sided = matches.find((row) => isLegacy(row) === side);
    if (sided) return sided;
  }
  return preferCurrent(matches);
}
