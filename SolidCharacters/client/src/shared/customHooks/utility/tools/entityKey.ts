/** Stable unique selector key for an entity in a merged SRD+homebrew list: the SRD id when
 *  present, else a name-derived key (homebrew entities are Dexie-keyed by name and may lack an id). */
export const entitySelectorKey = (entity: { id?: string | number; name: string }): string =>
  entity.id != null && `${entity.id}` !== '' ? `${entity.id}` : `hb:${entity.name}`;
