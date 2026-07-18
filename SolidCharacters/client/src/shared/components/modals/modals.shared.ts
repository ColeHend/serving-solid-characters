import { homebrewManager } from '../../customHooks/homebrewManager';
import { isHomebrewMarked } from '../../customHooks/dndInfo/info/provenance';

/** Entity kinds sourceLabel can resolve homebrew membership for. */
export type SourceLabelKind =
  | 'class' | 'subclass' | 'race' | 'subrace' | 'spell' | 'feat' | 'background' | 'item';

interface SourceLabelEntity {
  id?: string | number;
  source?: string;
  legacy?: boolean;
  name?: string;
  parentClass?: string;
  parentClassId?: string;
  details?: { name?: string };
  /** Merge-time provenance marker — see dndInfo/info/provenance.ts. */
  __homebrew?: boolean;
}

/** The stamped SRD provenance strings; on a homebrew row they can only be clone-inherited. */
const SRD_LABEL = /^SRD 5\.[12]$/i;

const norm = (s: unknown): string => (typeof s === 'string' ? s : '').trim().toLowerCase();

/** Entity id as a comparable string; '' when absent (homebrew classes/subclasses and older
 *  feats/spells persist without one — SRD rows always carry one). */
const idOf = (e: SourceLabelEntity): string => (e.id != null && `${e.id}` !== '' ? `${e.id}` : '');

const rowsForKind = (kind: SourceLabelKind): SourceLabelEntity[] => {
  switch (kind) {
    case 'class': return homebrewManager.classes() as SourceLabelEntity[];
    case 'subclass': return homebrewManager.subclasses() as SourceLabelEntity[];
    case 'race': return homebrewManager.races() as SourceLabelEntity[];
    case 'subrace': return homebrewManager.subraces() as SourceLabelEntity[];
    case 'spell': return homebrewManager.spells() as SourceLabelEntity[];
    case 'feat': return homebrewManager.feats() as unknown as SourceLabelEntity[];
    case 'background': return homebrewManager.backgrounds() as SourceLabelEntity[];
    // ItemModal can be handed either a mundane or a magic item; check both stores.
    case 'item': return [
      ...(homebrewManager.items() as SourceLabelEntity[]),
      ...(homebrewManager.magicItems() as SourceLabelEntity[]),
    ];
  }
};

/**
 * True when this entity exists in the homebrew store — the only reliable homebrew signal
 * (homebrew rows carry no marker field and may even carry `legacy` when cloned from SRD data).
 * Matches by id; an entity WITH an id only ever matches an exact id (so a same-named homebrew
 * row can't mislabel an SRD entity), while an id-less entity falls back to name matching since
 * id-less rows can't be SRD. Reads homebrewManager's live signals, so JSX callers re-run on changes.
 */
function isHomebrew(kind: SourceLabelKind, entity: SourceLabelEntity): boolean {
  const id = idOf(entity);
  const name = norm(entity.name ?? entity.details?.name);
  if (!id && !name) return false;
  return rowsForKind(kind).some(row => {
    if (id) return idOf(row) === id;
    const rowName = norm(row.name ?? row.details?.name);
    if (rowName !== name) return false;
    // Subclasses are stored per parent (storage_key = parentClass__name); require the parent
    // to match too so same-named subclasses of different classes stay distinct. Prefer the
    // id-based ref when both rows carry one (exact across renamed/same-named parents).
    if (kind === 'subclass') {
      if (entity.parentClassId && row.parentClassId) return entity.parentClassId === row.parentClassId;
      const parent = norm(entity.parentClass);
      return !parent || norm(row.parentClass) === parent;
    }
    return true;
  });
}

/**
 * Display label for an entity's provenance, layered by reliability:
 * 1. Merge-time homebrew marker (aggregator-fed rows): a user-typed sourcebook shows
 *    verbatim, but a clone-inherited "SRD 5.x" is overridden with "Homebrew" — clones copy
 *    the SRD's `id`/`legacy`/`source`, so those fields can't be trusted on marked rows.
 * 2. Explicit `source` ("SRD 5.1", "SRD 5.2", a custom sourcebook) — immune to id
 *    collisions with clones, so SRD originals always label correctly.
 * 3. Homebrew-store membership, for entities that never pass through the aggregators
 *    (character-sheet views, live homebrewManager re-merges) — only source-less
 *    entities can reach this layer.
 * 4. Ruleset flag: legacy true → SRD 5.1, false/undefined → SRD 5.2 (also covers
 *    stale Dexie rows seeded before `source` was stamped).
 */
export const sourceLabel = (entity: SourceLabelEntity | undefined, kind: SourceLabelKind): string => {
  const explicit = entity?.source?.trim();
  if (entity && isHomebrewMarked(entity)) {
    return explicit && !SRD_LABEL.test(explicit) ? explicit : 'Homebrew';
  }
  if (explicit) return explicit;
  if (entity && isHomebrew(kind, entity)) return 'Homebrew';
  return entity?.legacy === true ? 'SRD 5.1' : 'SRD 5.2';
};
