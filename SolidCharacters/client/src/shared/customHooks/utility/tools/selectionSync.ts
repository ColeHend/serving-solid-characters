import { Accessor, createEffect, untrack } from "solid-js";

export interface SelectionSyncConfig<T> {
  /** URL-derived selection (the `?name=` lookup memo: `list.find(byName) || list[0]`). */
  selected: Accessor<T | undefined>;
  /** The merged list the lookup memo searches — needed to re-resolve the current
   *  entity's fresh copy when the list is rebuilt. */
  list: Accessor<readonly T[]>;
  /** The page's current-selection signal pair. Setter is `(value: T) => void` rather than
   *  `Setter<T>` so pages typed `Signal<X>` and `Signal<X | undefined>` both fit. */
  current: [Accessor<T | undefined>, (value: T) => void];
  /** Display name of an item (feats read `details?.name`, everything else `name`). */
  nameOf: (item: T) => string | undefined;
}

const norm = (s: string | undefined): string => (s ?? "").trim().toLowerCase();

/** The fields that distinguish same-named duplicates in the merged lists. */
type ProvenanceFields = { __homebrew?: boolean; legacy?: boolean; id?: string | number };

/**
 * Keeps a page's current selection in sync with its `?name=`-derived lookup WITHOUT
 * clobbering a precise click. The name lookup resolves to the FIRST same-named row in
 * the merged `[...srd2014, ...srd2024?, ...homebrew]` list, so re-assigning on every run
 * would silently swap a clicked 2024/homebrew row for its 2014 SRD duplicate (wrong
 * entity, wrong source label).
 *
 * When the derived name differs from the current selection (deep link, navigation,
 * list default change) the lookup result is applied. When the name matches, the current
 * entity is instead re-resolved against the live list: if a fresh copy of the SAME
 * entity exists (list rebuilt — e.g. a homebrew edit re-emitted new objects) the
 * selection is re-pointed at it so an open modal never renders stale data, and if the
 * entity left the list entirely (ruleset switch) the lookup result takes over.
 *
 * The current value is read through `untrack` so the effect depends only on
 * `selected`/`list`; tracking it would re-run the effect after its own setter call.
 */
export function createSelectionSync<T>(config: SelectionSyncConfig<T>): void {
  const [current, setCurrent] = config.current;
  const sameName = (a: T, b: T) => norm(config.nameOf(a)) === norm(config.nameOf(b));
  // Same entity = same name AND same copy (ruleset/store): the merged lists hold
  // same-named duplicates that differ only in these provenance fields.
  const sameEntity = (a: T, b: T) => {
    const pa = a as ProvenanceFields, pb = b as ProvenanceFields;
    return sameName(a, b)
      && !!pa.__homebrew === !!pb.__homebrew
      && pa.legacy === pb.legacy
      && `${pa.id ?? ''}` === `${pb.id ?? ''}`;
  };
  createEffect(() => {
    const sel = config.selected();
    if (!sel) return;
    const list = config.list();
    const cur = untrack(current);
    if (!cur || !sameName(cur, sel)) {
      setCurrent(sel);
      return;
    }
    const fresh = list.find(row => sameEntity(row, cur));
    if (!fresh) setCurrent(sel);
    else if (fresh !== cur) setCurrent(fresh);
  });
}
