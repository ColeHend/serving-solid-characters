import { SetStoreFunction } from "solid-js/store";
import { StartingEquipment, Description, Feature } from "../../../../../../models/core.model";
import { LevelEntity, Subclass } from "../../../../../../models/class.model";
import { CastingStat } from "../../../../../../shared/models/stats";
import { Choice } from "../../../../../../models/core.model"
import { DnDClass, Item } from "../../../../../../models";
import { SpellsKnown } from "../../subclasses/subclasses";
import { Clone, getSpellSlots } from "../../../../../../shared";
import { Accessor, untrack } from "solid-js";

export function useGetClassSetters(
  currentClass: DnDClass, 
  setCurrentClass: SetStoreFunction<DnDClass>,
  setCurrentColumns: SetStoreFunction<string[]>,
  casterType: Accessor<string>,
  spellCalc: Accessor<string>
) {
  const setName = (name: string) => setCurrentClass((prev)=>Clone({...prev, name}));
  const setHitDie = (hitDie: number) => setCurrentClass((prev)=>Clone({...prev, hitDie}));
  const setProficiencies = (proficiencies: string[]) => setCurrentClass((prev)=>Clone({...prev, proficiencies}));
  const setProficiencyChoices = (proficiencyChoices: Choice<string>[]) => setCurrentClass((prev)=>Clone({...prev, proficiencyChoices}));
  const setSavingThrows = (savingThrows: string[]) => setCurrentClass((prev)=>Clone({...prev, savingThrows}));
  const setStartingEquipment = (startingEquipment: StartingEquipment) => setCurrentClass((prev)=>Clone({...prev, startingEquipment}));
  const setStartingEquipChoice = (choiceNum: number, choice: Choice<Item>[]) => {
    
    switch (choiceNum) {
    case 1:
      setCurrentClass((prev)=>(({ 
        startingEquipment: {...prev.startingEquipment, choice1: choice}
      } as DnDClass)));
      break;
    case 2:
      setCurrentClass((prev)=>(({
        startingEquipment: {...prev.startingEquipment, choice2: choice}
      } as DnDClass)));
      break;
    case 3:
      setCurrentClass((prev)=>(({
        startingEquipment: {...prev.startingEquipment, choice3: choice}
      } as DnDClass)));
      break;
    case 4:
      setCurrentClass((prev)=>(({ 
        startingEquipment: {...prev.startingEquipment, choice4: choice}
      } as DnDClass)));
      break;	
    default:
      setCurrentClass((prev)=>(({
        startingEquipment: {...prev.startingEquipment, choice1: choice}
      } as DnDClass)));
      break;
    }
  };

  const setClassLevels = (classLevels: LevelEntity[]) => setCurrentClass((prev)=>({ classLevels}));
  const setSubclasses = (subclasses: Subclass[]) => setCurrentClass((prev)=>({ subclasses}));
  const setSubclassLevels = (subclassLevels: number[]) => setCurrentClass((prev)=>({ classMetadata: {...prev.classMetadata, subclassLevels}}));
  // - spellcasting
  const setSpellKnown = (known: SpellsKnown, roundUp: boolean = false) => setCurrentClass((prev)=>({ 
    spellcasting: {
      level: 0,
      name: prev.spellcasting?.name ?? "",
      spellsKnownCalc: SpellsKnown[known] as string,
      spellcastingAbility: prev.spellcasting?.spellcastingAbility ?? "INT",
      casterType: prev.spellcasting?.casterType ?? "full",
      info: prev.spellcasting?.info ?? [],
      spellsKnownRoundup: roundUp
    }
  }));

  const setSpellCastingAbility = (ability: CastingStat) => setCurrentClass((prev)=>({ 
    spellcasting: {
      level: 0,
      name: prev.spellcasting?.name ?? "",
      spellsKnownCalc: prev.spellcasting?.spellsKnownCalc ?? "Level",
      spellcastingAbility: CastingStat[ability],
      casterType: prev.spellcasting?.casterType ?? "full",
      info: prev.spellcasting?.info ?? []
    }
  }));

  const setSpellCasterClass = (casterClass: string) => setCurrentClass((prev)=>({ 
    spellcasting: {
      level: 0,
      name: casterClass ?? "",
      spellsKnownCalc: prev.spellcasting?.spellsKnownCalc ?? "Level",
      spellcastingAbility: prev.spellcasting?.spellcastingAbility ?? "INT",
      casterType: prev.spellcasting?.casterType ?? "full",
      info: prev.spellcasting?.info ?? []
    }
  }));

  const setSpellCastingInfo = (info: Description[]) => setCurrentClass((prev)=>({ 
    spellcasting: {
      level: 0,
      name: prev.spellcasting?.name ?? "",
      spellsKnownCalc: prev.spellcasting?.spellsKnownCalc ?? "Level",
      spellcastingAbility: prev.spellcasting?.spellcastingAbility ?? "INT",
      casterType: prev.spellcasting?.casterType ?? "full",
      info
    }
  }));

  // ---

  const addClassSpecificAll = (feature: string) => {
    const newClassLevels = currentClass.classLevels.map((x, i)=>({...x, classSpecific: {...x.classSpecific, [feature]: '0'}}));
    setCurrentClass((old)=>({classLevels: newClassLevels}))
  };

  const removeClassSpecific = (feature: string) => {
    setCurrentClass((old)=>{
      const newOld = Clone(old);
      Array.from({length: 20}, (_, i)=>i+1).forEach((level)=>{
        const levelEntries = Object.entries(old.classLevels[level-1].classSpecific)
        const removeIndex = levelEntries.findIndex(([key, value])=>key === feature);
        if (removeIndex !== -1) levelEntries.splice(removeIndex, 1);
        newOld.classLevels[level-1].classSpecific = Object.fromEntries(levelEntries);
      });
      return {classLevels: newOld.classLevels};
    });
    setCurrentColumns((old)=>old.filter((x)=>x !== feature));
  };

  const addFeature = (level: number, feature: Feature<string, string>) => {
    setCurrentClass(old=> {
      const newClass = Clone(old);
      newClass.classLevels[(level - 1)].features.push(feature);
      return newClass;
    });
  };
  const replaceFeature = (level: number, index: number, feature: Feature<string, string>) => {
    setCurrentClass((old)=>{
      const newClass = Clone(old);
      newClass.classLevels[(level - 1)].features[index] = feature;
      return newClass;
    }
    );
  };
  const removeFeature = (level: number, name: string) => {
    setCurrentClass((old)=>{
      const newClass = Clone(old);
      const index = newClass.classLevels[(level - 1)].features.findIndex((x)=>x.name === name);
      newClass.classLevels[(level - 1)].features.splice(index, 1);
      return newClass;
    });
  };
	
  function getSpellSlot(level: number, slotLevel: number) {
    return getSpellSlots(level, slotLevel, untrack(casterType) ?? '');
  }
  const setSpellCantrips = (level: number, cantrips: number) => {
    const newClassLevels = currentClass.classLevels.map((x, i)=>i === level - 1 ? {...x, spellcasting: {...x.spellcasting, cantrips_known: cantrips}} : x);
    setClassLevels(newClassLevels);
  }
  const setSpellSlot = (level: number, slotLevel: number, slots: number) => {
    const newClassLevels = currentClass.classLevels.map((x, i)=>i === level - 1 && !!slots ? {...x, spellcasting: {...x.spellcasting, [`spell_slots_level_${slotLevel}`]: slots}} : x);
    setClassLevels(newClassLevels);
  }
  function setSpellSlots(casterType: string) {
    setCurrentClass((prev)=>({ 
      classLevels: Array.from({length: 20}, (_, i)=>i+1).map((level)=>{
        const classLevel = prev.classLevels[level-1];
        const otherKeys = Object.entries(classLevel.spellcasting ?? {}).filter((x)=>!x.includes('spell_slots_level'));
        classLevel.spellcasting = {};
        if (otherKeys.length) otherKeys.forEach(([key, value])=> classLevel.spellcasting![key] = value);
        Array.from({length: 9}, (_, i)=>i+1).forEach((slotLevel)=>{
          const slotValue = getSpellSlots(level, slotLevel, casterType);
          if (slotValue !== '-') classLevel.spellcasting![`spell_slots_level_${slotLevel}`] = slotValue;
        });
        return Clone(classLevel);
      }), 
      spellcasting: {
        level: 0,
        name: prev.spellcasting?.name ?? "",
        spellsKnownCalc: prev.spellcasting?.spellsKnownCalc ?? "Level",
        spellcastingAbility: prev.spellcasting?.spellcastingAbility ?? "INT",
        casterType: casterType,
        info: prev.spellcasting?.info ?? []
      }
    }));
  }
  function setSpellsKnown(level: number, known: number) {
    const newClassLevels = currentClass.classLevels.map((x, i)=>i === level - 1 ? {...x, spellcasting: {...x.spellcasting, spells_known: known}} : x);
    setClassLevels(newClassLevels);
  }
	
  function clearSpellSlots() {
    setCurrentClass((old)=>Clone<DnDClass>({...old,
      classLevels: old.classLevels.map((x, i)=>({...x, 
        spellcasting: {
          ['spells_known']: (x?.spellcasting?.['spells_known'] ?? ++i)
        }
      })),
      spellcasting: {
        level: 0,
        name: old.spellcasting?.name ?? "",
        spellsKnownCalc: old.spellcasting?.spellsKnownCalc ?? "Level",
        spellcastingAbility: old.spellcasting?.spellcastingAbility ?? "INT",
        casterType: old.spellcasting?.casterType ?? "full",
        info: old.spellcasting?.info ?? []
      }
			
    }) as DnDClass);
    if (spellCalc() === 'Other') {
      return 'spellsKnown'
    }
  }

  return {
    setName,
    setHitDie,
    setProficiencies,
    setProficiencyChoices,
    setSavingThrows,
    setStartingEquipment,
    setStartingEquipChoice,
    setClassLevels,
    setSubclasses,
    setSubclassLevels,
    setSpellKnown,
    setSpellCastingAbility,
    setSpellCasterClass,
    setSpellCastingInfo,
    addClassSpecificAll,
    removeClassSpecific,
    addFeature,
    replaceFeature,
    removeFeature,
    getSpellSlot,
    setSpellCantrips,
    setSpellSlot,
    setSpellSlots,
    setSpellsKnown,
    clearSpellSlots
  };
}