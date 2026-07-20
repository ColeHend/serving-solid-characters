/** Stable unique selector key for an entity in a merged SRD+homebrew list: the SRD id when
 *  present, else a name-derived key (homebrew entities are Dexie-keyed by name and may lack an id). */
export const entitySelectorKey = (entity: { id?: string | number; name: string }): string =>
  entity.id != null && `${entity.id}` !== '' ? `${entity.id}` : `hb:${entity.name}`;

/** Selector key of a feat — its display name lives in details, not at the top level. */
export const featSelectorKey = (feat: { id?: string; details?: { name?: string } }): string =>
  entitySelectorKey({ id: feat.id, name: feat.details?.name ?? '' });

/** Display name for an unresolvable selector key: strips the homebrew prefix, ids pass through. */
export const selectorKeyDisplayName = (key: string): string => key.replace(/^hb:/, '');
