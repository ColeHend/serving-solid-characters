import { createSignal, createMemo, createEffect } from "solid-js";
import type { Feat, Prerequisite } from "../../../../../models/generated/SolidCharacters.Domain.DTO.Updated";
import { PrerequisiteType } from "../../../../../models/generated/SolidCharacters.Domain.DTO.Updated";
import { homebrewManager } from "../../../../../shared/";
import HomebrewManager from "../../../../../shared/customHooks/homebrewManager";
import { useDnDClasses } from "../../../../../shared/customHooks/dndInfo/info/all/classes";
import { useDnDFeats } from "../../../../../shared/customHooks/dndInfo/info/all/feats";
import { useDnDSubclasses } from "../../../../../shared/customHooks/dndInfo/info/all/subclasses";
import { useDnDRaces } from "../../../../../shared/customHooks/dndInfo/info/all/races";
import { useDnDItems } from "../../../../../shared/customHooks/dndInfo/info/all/items";

export { PrerequisiteType };

export function useFeatsForm() {
  const classes = useDnDClasses();
  const feats = useDnDFeats();
  const subclasses = useDnDSubclasses();
  const races = useDnDRaces();
  const items = useDnDItems();

  const [prerequisites, setPrerequisites] = createSignal<Prerequisite[]>([]);
  const [selectedType, setSelectedType] = createSignal<PrerequisiteType>(PrerequisiteType.Stat);
  const [featName, setFeatName] = createSignal("");
  const [keyName, setKeyName] = createSignal("str");
  const [keyValue, setKeyValue] = createSignal("0");
  const [featDescription, setFeatDescription] = createSignal("");
  const [classLevel, setClassLevel] = createSignal("");

  const clearFields = () => {
    setPrerequisites([]);
    setSelectedType(PrerequisiteType.Stat);
    setFeatName("");
    setKeyName("str");
    setKeyValue("0");
    setFeatDescription("");
    setClassLevel("");
  };

  const buildPrereqValue = (): string | null => {
    switch (selectedType()) {
      case PrerequisiteType.Stat:
        return `${keyName().toUpperCase()} ${keyValue()}`;
      case PrerequisiteType.Class: {
        const lvl = classLevel();
        const base = keyValue();
        return lvl && /^\d+$/.test(lvl) ? `${base} ${lvl}` : base;
      }
      case PrerequisiteType.String:
        return keyValue().trim() || null;
      default:
        return keyValue();
    }
  };

  const addPreReq = () => {
    const value = buildPrereqValue();
    if (value === null) return;
    setPrerequisites(old => [...old, { type: selectedType(), value }]);
  };

  const removePreReq = (index: number) => {
    setPrerequisites(old => old.filter((_, i) => i !== index));
  };

  const mapLegacyPreReqs = (preReqs: any[]): Prerequisite[] =>
    preReqs.map((f: any): Prerequisite => {
      const raw = (f?.value || f?.name || "").toString();
      if (/^(STR|DEX|CON|INT|WIS|CHA)\s+\d+$/i.test(raw))
        return { type: PrerequisiteType.Stat, value: raw.toUpperCase() };
      if (/^\d+$/.test(raw))
        return { type: PrerequisiteType.Level, value: raw };
      return { type: PrerequisiteType.Class, value: raw };
    });

  const fillFromFeat = (chosen: any) => {
    if (!chosen) return;
    if (Array.isArray(chosen.prerequisites)) {
      setPrerequisites(chosen.prerequisites);
    } else if (Array.isArray(chosen.preReqs)) {
      setPrerequisites(mapLegacyPreReqs(chosen.preReqs));
    } else {
      setPrerequisites([]);
    }
    setFeatDescription(
      chosen.details?.description ||
      (Array.isArray(chosen.desc) ? chosen.desc[0] : chosen.desc) ||
      ""
    );
  };

  const findFeatByName = (name: string) => {
    const match = (x: any) => x.details?.name === name || x.name === name;
    return HomebrewManager.feats().find(match) || feats().find(match);
  };

  const prefillFromQuery = (name: string) => {
    if (!name) return;
    const chosen: any = findFeatByName(name);
    if (!chosen) return;
    fillFromFeat(chosen);
    setFeatName(chosen.details?.name || chosen.name || "");
  };

  // Reset defaults when prerequisite type changes
  createEffect(() => {
    switch (selectedType()) {
      case PrerequisiteType.Stat:
        setKeyName("STR");
        setKeyValue("10");
        break;
      case PrerequisiteType.Class:
        setKeyName("Class");
        setKeyValue(classes()[0]?.name || "Barbarian");
        setClassLevel("");
        break;
      case PrerequisiteType.Level:
        setKeyName("Level");
        setKeyValue("1");
        break;
      case PrerequisiteType.Subclass: {
        const sc = subclasses()[0];
        setKeyName("Subclass");
        setKeyValue(sc ? `${sc.parentClass}:${sc.name}` : "");
        break;
      }
      case PrerequisiteType.Feat: {
        const f = feats()[0];
        setKeyName("Feat");
        setKeyValue(f ? (f as any).details?.name || (f as any).name || "" : "");
        break;
      }
      case PrerequisiteType.Race: {
        const r: any = races()[0];
        setKeyName("Race");
        setKeyValue(r ? r.name : "");
        break;
      }
      case PrerequisiteType.Item: {
        const it: any = items()[0];
        setKeyName("Item");
        setKeyValue(it ? it.name : "");
        break;
      }
      case PrerequisiteType.String:
        setKeyName("Text");
        setKeyValue("");
        break;
    }
  });

  const currentFeat = createMemo((): Feat => ({
    id: "",
    details: { name: featName(), description: featDescription() },
    prerequisites: prerequisites(),
    // Legacy root fields for Dexie schema compatibility
    name: featName(),
    desc: [featDescription()],
  } as Feat & { name: string; desc: string[] }));

  const featExists = createMemo(() =>
    HomebrewManager.feats().findIndex(
      (x) => (x as any).details?.name === featName() || x.name === featName()
    ) !== -1
  );

  const isValid = createMemo(() => featName()?.trim().length > 0);

  const saveFeat = () => {
    homebrewManager.addFeat(currentFeat() as any);
    clearFields();
  };

  const updateFeat = () => {
    homebrewManager.updateFeat(currentFeat() as any);
    clearFields();
  };

  return {
    classes, feats, subclasses, races, items,
    prerequisites, setPrerequisites,
    selectedType, setSelectedType,
    featName, setFeatName,
    keyName, setKeyName,
    keyValue, setKeyValue,
    featDescription, setFeatDescription,
    classLevel, setClassLevel,
    addPreReq, removePreReq,
    fillFromFeat, findFeatByName, prefillFromQuery,
    currentFeat, featExists, isValid,
    saveFeat, updateFeat,
  };
}

export type FeatsFormStore = ReturnType<typeof useFeatsForm>;
