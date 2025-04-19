import { createMemo, createSignal } from "solid-js";
import useDnDClasses from "../dndInfo/srdinfo/useDnDClasses";
import HomebrewManager from "../homebrewManager";
import HttpClient$ from "../utility/httpClientObs";
import { DnDClass } from "../../../models";
import { ClassesList, SRDClass, SRDClassLevel, SRDFeature, SRDSubLevel, SRDSubclass } from "../../../models/srd/classes";
import httpClient from "../utility/httpClient";
import { BehaviorSubject, combineLatest, concatMap, last, map, of, skip, take, tap } from "rxjs";
import { LevelEntity, Subclass } from "../../../models/class.model";
import { Feature, FeatureTypes } from "../../../models/core.model";
import { APIReference } from "../../../models/srd/core";

type SrdCacheEntry = {
  srdClass?: SRDClass;
  srdSubclasses?: SRDSubclass[];
  apiRefs?: APIReference[];
  levels?: (SRDSubLevel | SRDClassLevel)[];
};

const useGetClasses = () => {
  const dndSrdClasses = useDnDClasses();

  const allClasses = createMemo(() => [...dndSrdClasses(), ...HomebrewManager.classes()]);
  return allClasses;
}

const useGetSRDClasses = () => {
  const newClasses: DnDClass[] = [];
  const base = "https://www.dnd5eapi.co";
  const [srdCache, setSrdCache] = createSignal<Record<string, SrdCacheEntry>>({});
  const nextClasses = new BehaviorSubject<DnDClass[]>([]);
  
  HttpClient$.get<ClassesList>(base + "/api/classes").pipe(
    tap((classesList) => {
      setSrdCache((prev) => {
        return {
          ...prev,
          '/api/classes': {
            apiRefs: classesList.results
          }
        }
      });
    }),
    concatMap((classesList) => {
      return combineLatest(classesList.results.map((classRef) => {
        return HttpClient$.get<SRDClass>(base + classRef.url).pipe(
          tap((classData) => {
            setSrdCache((prev) => {
              return {
                ...prev,
                [classRef.url]: {
                  srdClass: classData
                }
              }
            });
          })
        )
      }));
    }),
    concatMap((classes) => {
      return combineLatest(classes.map((classData) => {
        return combineLatest([
          of(classData),
          combineLatest(classData.subclasses.map((subclassRef) => {
            return HttpClient$.get<SRDSubclass>(base + subclassRef.url).pipe(
              tap((subclassData) => {
                setSrdCache((prev) => {
                  return {
                    ...prev,
                    [subclassRef.url]: {
                      srdSubclasses: [subclassData]
                    }
                  }
                });
              })
            )
          }))
        ]).pipe(
          map(([classData, subclasses]) => {
            const newClass: DnDClass = {
              id: parseInt(classData.index.replace(/\D/g, '')) || classes.indexOf(classData) + 1,
              name: classData.name,
              hitDie: classData.hit_die,
              proficiencies: classData.proficiencies.map((prof) => prof.name),
              proficiencyChoices: classData.proficiency_choices.map((choice) => {
                return {
                  choose: choice.choose,
                  type: FeatureTypes.Class,
                  choices: choice.from.options.map(o => o?.item?.name)
                }
              }),
              savingThrows: classData.saving_throws.map((savingThrow) => savingThrow.name),
              classLevels: [],
              startingEquipment: {
                class: classData.name,
                quantity: 0,
                choice1: [],
                choice2: [],
                choice3: [],
                choice4: []
              },
              subclasses: [...subclasses.map((subclass, index) => {
                return {
                  id: Number(subclass.index.replace(/\D/g, '')) || index + 1,
                  name: subclass.name,
                  desc: subclass.desc,
                  features: [],
                  class: classData.name,
                  spells: [],
                } as Subclass;
              })],
              classMetadata: {
                subclassLevels: [],
                subclassType: '',
                subclassTypePosition: 'before'
              }
            };
            return [newClass, {
              srdClass: classData,
              srdSubclasses: subclasses
            }] as [DnDClass, { srdClass: SRDClass, srdSubclasses: SRDSubclass[] }];
          })
        );
      }))
    }),
    tap((classes) => {
      // Update the nextClasses BehaviorSubject with the initial class data
      nextClasses.next(classes.map(([classData,]) => classData));
    }),
    concatMap((classes) => {
      const classStore = classes.map(([classData, srdData]) => classData);
      return combineLatest(
        classes.map(([classDat, srdData]) => {
          // Fetch class levels
          return HttpClient$.get<SRDClassLevel[]>(base + `/api/classes/${srdData.srdClass.index}/levels`).pipe(
            tap((levels) => {
              setSrdCache((prev) => {
                return {
                  ...prev,
                  [`/api/classes/${srdData.srdClass.index}/levels`]: {
                    levels
                  }
                }
              });
            }),
            map((levels) => {
              const classData = classStore.find((c) => c.name === classDat.name);
              if (!classData) {
                throw new Error(`Class ${classDat.name} not found`);
              }
              
              // Map levels to our LevelEntity structure
              classData.classLevels = levels.map((level) => {
                const aLevel: LevelEntity = {
                  level: Number(level.level),
                  info: {
                    className: classData.name,
                    subclassName: "",
                    level: level.level,
                    type: FeatureTypes.Class,
                    other: ""
                  },
                  profBonus: level.prof_bonus,
                  features: level.features.map(feature => ({
                    name: feature.name || feature.index,
                    type: FeatureTypes.Class,
                    info: {
                      className: classData.name,
                      subclassName: "",
                      level: level.level,
                      type: FeatureTypes.Class,
                      other: ""
                    },
                    metadata: { changes: [] },
                    value: feature.index
                  })),
                  classSpecific: level.class_specific ? 
                    { ...Object.fromEntries(Object.entries(level.class_specific).map(([key, value]) => [key.replaceAll('_', " "), value])) } : 
                    {},
                  spellcasting: {
                    ...level.spellcasting
                  }
                };
                return aLevel;
              });
              
              return classData;
            }),
            concatMap((classData) => {
              // Process subclass levels
              return combineLatest(
                srdData.srdSubclasses.map(subclass => {
                  return HttpClient$.get<SRDSubLevel[]>(base + `/api/subclasses/${subclass.index}/levels`).pipe(
                    tap((levels) => {
                      setSrdCache((prev) => {
                        return {
                          ...prev,
                          [`/api/subclasses/${subclass.index}/levels`]: {
                            levels
                          }
                        }
                      });
                    }),
                    map(levels => ({ subclass, levels }))
                  );
                })
              ).pipe(
                map(subclassLevelsData => {
                  // Update subclass data with levels information
                  subclassLevelsData.forEach(({ subclass, levels }) => {
                    const subclassIndex = classData.subclasses.findIndex(sc => sc.name === subclass.name);
                    if (subclassIndex !== -1) {
                      // Find the minimum level at which this subclass becomes available
                      const minLevel = Math.min(...levels.map(l => parseInt(l.level)));
                      if (!classData.classMetadata.subclassLevels.includes(minLevel)) {
                        classData.classMetadata.subclassLevels.push(minLevel);
                      }
                      
                      // Update the subclass features
                      classData.subclasses[subclassIndex].features = levels.flatMap(level => 
                        level.features.map(feature => ({
                          name: feature.name || feature.index,
                          type: FeatureTypes.Subclass,
                          info: {
                            className: classData.name,
                            subclassName: subclass.name,
                            level: parseInt(level.level),
                            type: FeatureTypes.Subclass,
                            other: ""
                          },
                          metadata: { changes: [] },
                          value: feature.index
                        }))
                      );
                    }
                  });
                  
                  // Sort subclass levels
                  classData.classMetadata.subclassLevels.sort((a, b) => a - b);
                  
                  // Set subclass type information
                  if (classData.subclasses.length > 0) {
                    classData.classMetadata.subclassType = 'Archetype';
                    switch (classData.name.toLowerCase()) {
                      case 'barbarian': classData.classMetadata.subclassType = 'Primal Path'; break;
                      case 'bard': classData.classMetadata.subclassType = 'College'; break;
                      case 'cleric': classData.classMetadata.subclassType = 'Divine Domain'; break;
                      case 'druid': classData.classMetadata.subclassType = 'Circle'; break;
                      case 'fighter': classData.classMetadata.subclassType = 'Martial Archetype'; break;
                      case 'monk': classData.classMetadata.subclassType = 'Monastic Tradition'; break;
                      case 'paladin': classData.classMetadata.subclassType = 'Sacred Oath'; break;
                      case 'ranger': classData.classMetadata.subclassType = 'Ranger Archetype'; break;
                      case 'rogue': classData.classMetadata.subclassType = 'Roguish Archetype'; break;
                      case 'sorcerer': classData.classMetadata.subclassType = 'Sorcerous Origin'; break;
                      case 'warlock': classData.classMetadata.subclassType = 'Otherworldly Patron'; break;
                      case 'wizard': classData.classMetadata.subclassType = 'Arcane Tradition'; break;
                    }
                  }
                  
                  return classData;
                })
              );
            })
          );
        })
      );
    }),
    concatMap((classes) => {
      return getAllFeatures$().pipe(
        map(allFeatures => {
          return classes.map((classData) => {
            classData.classLevels = classData.classLevels.map(level => {
              level.features = level.features.map(feature => {
                const featureData = allFeatures.find(f => f.index === feature.value);
                if (featureData) {
                  feature.value = featureData.desc.join('\n');
                }
                return feature;
              });
              return level;
            });
            classData.subclasses = classData.subclasses.map(subclass => {
              subclass.features = subclass.features.map(feature => {
                const featureData = allFeatures.find(f => f.index === feature.value);
                if (featureData) {
                  feature.value = featureData.desc.join('\n');
                }
                return feature;
              });
              return subclass;
            });
            return classData;
          });
        })
      )
    }),
    last(),
    tap((classes) => {
      nextClasses.next(classes);
    })
  ).subscribe();
  
  return nextClasses.asObservable();
}
const [allFeatures, setAllFeatures] = createSignal<SRDFeature[]>([]);
const getAllFeatures$ = () => {
  if (allFeatures().length > 0) {
    return of(allFeatures());
  }
  const base = "https://www.dnd5eapi.co";
  const features$ = HttpClient$.get<ClassesList>(base + "/api/features").pipe(
    concatMap((featuresList) => {
      return combineLatest(featuresList.results.map((featureRef) => {
        return HttpClient$.get<SRDFeature>(base + featureRef.url)
      }));
    }),
    tap((features => {
      setAllFeatures(features);
    })
  ));
  return features$;
}

export { useGetClasses, useGetSRDClasses };
export default useGetClasses;