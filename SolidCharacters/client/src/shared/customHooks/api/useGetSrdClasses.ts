import { CasterType, FeatureDetail, Spellcasting, StartingEquipment, Subclass, Class5E, Proficiencies, SpellKnownType } from "../../../models/generated";
import { of, forkJoin, Observable } from 'rxjs';
import { switchMap, map } from 'rxjs/operators';
import { ajax } from 'rxjs/ajax';
import HttpClient$ from "../utility/tools/httpClientObs";
import { createNewId } from "../utility/tools/idGen";
/* ------------------------------------------------------------------
   Helper types for the remote API
------------------------------------------------------------------ */
interface APIReference { index: string; name: string; url: string }
const httpConfig = { nocors: true };
interface APIClassRoot { count: number; results: APIReference[] }

interface APIClassLevelsItem {
  level: number;
  features: APIReference[];
}

interface APIClassDetail {
  index: string;
  name: string;
  hit_die: number;
  saving_throws: APIReference[];
  starting_equipment: APIReference | null;
  proficiency_choices: unknown[];
  proficiencies: APIReference[];
  subclasses: APIReference[];
  class_levels: string;        // e.g. '/api/classes/barbarian/levels'
  spellcasting?: APIReference;
}

/* ------------------------------------------------------------------
   Constants
------------------------------------------------------------------ */
const BASE_URL = 'https://www.dnd5eapi.co';

/* ------------------------------------------------------------------
   Public entry-point
------------------------------------------------------------------ */

/**
 * Fetch **every** D&D 5e class with the richest detail the open API exposes.
 * @returns Observable that emits an array of fully-mapped `Class5E` objects.
 */
export function useGetSRDClasses$(): Observable<Class5E[]> {
  return HttpClient$.get<APIClassRoot>(`${BASE_URL}/api/classes`, httpConfig).pipe(
    switchMap(({ results }) =>
      results.length
        ? forkJoin(results.map(({ index }) => fetchClassDetail$(index)))
        : of([]),
    ),
  );
}

/* ------------------------------------------------------------------
   Implementation helpers
------------------------------------------------------------------ */

/**
 * Fetch a single class, its subclasses, spellcasting, equipment & features.
 */
function fetchClassDetail$(classIndex: string): Observable<Class5E> {
  return HttpClient$.get<APIClassDetail>(`${BASE_URL}/api/classes/${classIndex}`, httpConfig)
    .pipe(
      switchMap((cls) => {
        // Parallel fetches ───────────────
        const spellcasting$ = cls?.spellcasting?.url
          ? HttpClient$.get<any>(BASE_URL + cls.spellcasting.url, httpConfig)
          : of(undefined);

        const startingEq$ = cls?.starting_equipment?.url
          ? HttpClient$.get<any>(BASE_URL + cls.starting_equipment.url, httpConfig)
          : of([]);

        const profDetails$ = cls.proficiencies.length
          ? forkJoin(cls.proficiencies.filter(x=>!!x?.url).map((p) => HttpClient$.get<any>(BASE_URL + p.url, httpConfig)))
          : of([]);

        const features$ = fetchFeaturesFromLevels$(cls.class_levels);
        const subclasses$ = fetchSubclassesForClass$(cls.subclasses);

        // Combine ────────────────────────
        return forkJoin({ spellcasting$, startingEq$, profDetails$, features$, subclasses$ }).pipe(
          map(({ spellcasting$, startingEq$, profDetails$, features$, subclasses$ }) => ({
            id: createNewId(), // do i need to create a new id here?
            name: cls.name,
            hitDie: String(cls.hit_die),
            primaryAbility: '',                    // not in API
            savingThrows: cls.saving_throws.map((st) => st.name),
            startingEquipment: startingEq$ as StartingEquipment[],
            proficiencies: mapProficienciesArray(profDetails$),
            spellcasting: spellcasting$ ? mapSpellcasting(spellcasting$) : undefined,
            features: features$,
            startChoices: {},
            choices: {},                            // could be enriched further
            // subclasses added for caller convenience
            // (not in original interface but harmless)
            subclasses: subclasses$,
          })),
        );
      }),
    );
}

/**
 * Convert API proficiency array to your flattened `Proficiencies` shape.
 */
function mapProficienciesArray(api: any[]): Proficiencies {
  const byType: Record<string, string[]> = {};
  api.forEach((p) => {
    (byType[p.type] ||= []).push(p.name);
  });
  return {
    armor: byType.armor || [],
    weapons: byType.weapons || [],
    tools: byType.tool || [],
    skills: byType.skill || [],
  };
}

/**
 * Reshape API spellcasting block into your `Spellcasting` type.
 * Only minimal mapping is included; expand as desired.
 */
function mapSpellcasting(api: any): Spellcasting {
  return {
    metadata: {
      slots: {},                    // D&D 5e API doesn’t expose slot tables per class
      casterType: CasterType.Full,  // crude default
    },
    knownType: SpellKnownType.Number,
    spellsKnown: {},
    learnedSpells: {},
  };
}

/**
 * Pull every feature detail referenced by the `/levels` endpoint.
 */
function fetchFeaturesFromLevels$(levelsPath: string): Observable<Record<number, FeatureDetail[]>> {
  if (!levelsPath) return of({});
  return HttpClient$.get<APIClassLevelsItem[]>(BASE_URL + levelsPath, httpConfig).pipe(
    switchMap((levels) => {
      if (!Array.isArray(levels) || levels.length === 0) {
        return of({});
      }
      const featureRefs = levels.flatMap((lvl) =>
        (lvl.features || []).map((ref) => ({ level: lvl.level, ref })),
      );

      if (featureRefs.length === 0) return of({});

      return forkJoin(
        featureRefs.map(({ level, ref }) =>
          HttpClient$.get<any>(BASE_URL + ref.url, httpConfig)
            .pipe(map((detail) => ({ level, detail }))),
        ),
      ).pipe(
        map((pairs) =>
          pairs.reduce<Record<number, FeatureDetail[]>>((acc, { level, detail }) => {
            (acc[level] ||= []).push({
              name: detail.name,
              description: detail.desc,
            });
            return acc;
          }, {}),
        ),
      );
    }),
  );
}

/**
 * Fetch full details (and features) for each subclass of a given class.
 */
function fetchSubclassesForClass$(refs: APIReference[]): Observable<Subclass[]> {
  if (!refs.length) return of([]);

  return forkJoin(
    refs.map((sub) =>
      HttpClient$.get<any>(BASE_URL + sub.url, httpConfig).pipe(
        switchMap((subDetail) =>
          subDetail.subclass_levels
            ? fetchFeaturesFromLevels$(subDetail.subclass_levels).pipe(
                map((features) => ({ subDetail, features })),
              )
            : of({ subDetail, features: {} }),
        ),
        map(({ subDetail, features }) => ({
          id: createNewId(), // do i need to create a new id here?
          name: subDetail.name,
          parentClass: subDetail.class?.name || '',
          description: (subDetail.desc as string[])?.join('\n') || '',
          features,
        })),
      ),
    ),
  );
}