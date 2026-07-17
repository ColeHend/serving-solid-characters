import { batch, createEffect, createMemo, createSignal } from 'solid-js';
import type { FormGroup } from 'coles-solid-library';
import { homebrewManager } from '../../../../../../shared/customHooks/homebrewManager';
import { useDnDClasses } from '../../../../../../shared/customHooks/dndInfo/info/all/classes';
import { useDnDSubclasses } from '../../../../../../shared/customHooks/dndInfo/info/all/subclasses';
import { useDnDRaces } from '../../../../../../shared/customHooks/dndInfo/info/all/races';
import { useDnDItems } from '../../../../../../shared/customHooks/dndInfo/info/all/items';
import { useDnDFeats } from '../../../../../../shared/customHooks/dndInfo/info/all/feats';
import {
  FeatForm,
  MAX_PREREQS,
  PrereqCatalogs,
  PrerequisiteType,
  buildPrereqValue,
  defaultsForType,
} from './wizard.shared';
import type { Prerequisite } from '../../../../../../models/generated';

/**
 * Ephemeral state for composing ONE prerequisite (the old PrerequisiteSelector's
 * signals). Only the committed prerequisites live in the FormGroup — this builder
 * mounts and dies with the Prerequisites step, and that's fine: a half-entered
 * requirement isn't data yet.
 */
export function createPrereqBuilder() {
  const classes = useDnDClasses();
  const subclasses = useDnDSubclasses();
  const races = useDnDRaces();
  const items = useDnDItems();
  const feats = useDnDFeats();

  const entityName = (entity: unknown): string =>
    ((entity as { details?: { name?: string } })?.details?.name
      ?? (entity as { name?: string })?.name ?? '');

  const classOptions = createMemo(() => classes().map(c => c.name).filter(Boolean));
  const subclassOptions = createMemo(() => subclasses().map(sc => `${sc.parentClass}:${sc.name}`));
  // The useDnD* homebrew snapshot never sees in-session saves — merge the live
  // homebrewManager list so a feat published moments ago is offerable as a prereq.
  const featOptions = createMemo(() => {
    const names = new Set<string>();
    homebrewManager.feats().forEach(f => { const n = entityName(f); if (n) names.add(n); });
    feats().forEach(f => { const n = entityName(f); if (n) names.add(n); });
    return [...names];
  });
  const raceOptions = createMemo(() => races().map(r => (r as { name?: string }).name ?? '').filter(Boolean));
  const itemOptions = createMemo(() => items().map(i => (i as { name?: string }).name ?? '').filter(Boolean));

  const catalogs = createMemo<PrereqCatalogs>(() => ({
    classes: classOptions(),
    subclasses: subclassOptions(),
    feats: featOptions(),
    races: raceOptions(),
    items: itemOptions(),
  }));

  const EMPTY_CATALOGS: PrereqCatalogs = { classes: [], subclasses: [], feats: [], races: [], items: [] };

  const initial = defaultsForType(PrerequisiteType.Stat, EMPTY_CATALOGS);
  const [selectedType, setSelectedType] = createSignal<PrerequisiteType>(PrerequisiteType.Stat);
  const [keyName, setKeyName] = createSignal(initial.keyName);
  const [keyValue, setKeyValue] = createSignal(initial.keyValue);
  const [classLevel, setClassLevel] = createSignal(initial.classLevel);

  // Reset the value inputs whenever the requirement type changes. Each type reads only
  // the catalog its default depends on — fixed-default types (Stat/Level/Text) read
  // none — so an async catalog landing late never clobbers an in-progress entry of an
  // unrelated type. Catalog-dependent types still refresh their default pick when
  // their own catalog loads (the old selector's per-branch tracking, exactly).
  createEffect(() => {
    const type = selectedType();
    const slice: PrereqCatalogs = { ...EMPTY_CATALOGS };
    switch (type) {
    case PrerequisiteType.Class: slice.classes = classOptions(); break;
    case PrerequisiteType.Subclass: slice.subclasses = subclassOptions(); break;
    case PrerequisiteType.Feat: slice.feats = featOptions(); break;
    case PrerequisiteType.Race: slice.races = raceOptions(); break;
    case PrerequisiteType.Item: slice.items = itemOptions(); break;
    default: break;
    }
    const defaults = defaultsForType(type, slice);
    batch(() => {
      setKeyName(defaults.keyName);
      setKeyValue(defaults.keyValue);
      setClassLevel(defaults.classLevel);
    });
  });

  const committed = (fg: FormGroup<FeatForm>): Prerequisite[] =>
    (fg.get('prerequisites') as Prerequisite[]) ?? [];

  const addPrereq = (fg: FormGroup<FeatForm>) => {
    const current = committed(fg);
    if (current.length >= MAX_PREREQS) return;
    const value = buildPrereqValue(selectedType(), {
      keyName: keyName(), keyValue: keyValue(), classLevel: classLevel(),
    });
    if (value === null) return;
    fg.set('prerequisites', [...current, { type: selectedType(), value }]);
  };

  const removePrereq = (fg: FormGroup<FeatForm>, index: number) => {
    fg.set('prerequisites', committed(fg).filter((_, i) => i !== index));
  };

  return {
    catalogs,
    selectedType, setSelectedType,
    keyName, setKeyName,
    keyValue, setKeyValue,
    classLevel, setClassLevel,
    addPrereq, removePrereq,
  };
}

export type PrereqBuilder = ReturnType<typeof createPrereqBuilder>;
