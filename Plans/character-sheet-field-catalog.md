# Reference — Character → Sheet Field Catalog

Companion to [character-sheet-mapper-plan.md](character-sheet-mapper-plan.md). This is the verified enumeration of every bindable source field, its access path from a `Character` instance, and whether it is **stored** or **derived**. It is the input for:
- `SHEET_FIELD_DEFS` (palette) in `characterFields.ts`,
- `characterToSheetValues()` (the pure value mapper),
- the Phase 7 default-mapping coverage checklist.

Canonical type (from `src/models/character.model.ts`); `Stats` from `src/shared/customHooks/dndInfo/useCharacters.ts`.

## Helpers (import by DIRECT path — not exported from the shared barrel)

| Helper | Source | Formula / note |
|---|---|---|
| `getAbilityModifier(score)` | `shared/customHooks/utility/tools/dndMath.ts` | `Math.floor((score-10)/2)` |
| `getProficiencyBonus(level)` | `shared/customHooks/utility/tools/dndMath.ts` | `Math.ceil(level/4)+1` |
| `useExportFullStats(char)` | `shared/customHooks/dndInfo/useGetFullStats.ts` | `Accessor<Stats>` — base `char.stats` + racial `abilityBonuses` (subrace TODO). **Effective scores; use these for the sheet**, not raw `char.stats`. Compute in-component, pass plain `Stats` to the mapper. |
| `getSpellAndCasterLevel(class5e,'caster',level)` | `shared/customHooks/utility/tools/getSpellAndCasterLevel.ts` | effective caster level (Full/Half/Third) to index slot tables |
| `characterManager` | `shared/customHooks/dndInfo/useCharacters.ts` | `.characters(): Character[]`, `.getCharacter(name): Character\|undefined` |

`char.level` is a **getter** = `char.levels.length` (read-only).

## Identity / header (all STORED scalar reads)

| Field key | Access path | Notes |
|---|---|---|
| `name` | `char.name` | |
| `className` | `char.className` | |
| `level` | `char.level` | derived getter = `levels.length` |
| `classAndLevel` | `` `${char.className} ${char.level}` `` | convenience composite |
| `subclass` | `char.subclass.join(', ')` | `string[]` |
| `background` | `char.background` | |
| `alignment` | `char.alignment` | |
| `species` | `char.race.species` | |
| `subrace` | `char.race.subrace` | optional |
| `size` | `char.race.size` | optional |
| `age` | `char.race.age` | optional |
| `xp` | — | not stored; leave blank / user text |
| `inspiration` | — | not stored; leave blank / dot glyph |

## Ability scores & modifiers

| Field key | Access / derivation |
|---|---|
| `str`/`dex`/`con`/`int`/`wis`/`cha` (score) | `fullStats[ability]` (effective) — raw base is `char.stats[ability]` |
| `strMod`…`chaMod` | `getAbilityModifier(fullStats[ability])` — **NOT stored** |
| `proficiencyBonus` | `getProficiencyBonus(char.level)` — **NOT stored** |

## Skills (18; STORED flags at `char.proficiencies.skills[name]`)

Each entry: `{ stat: keyof Stats, value, proficient, expertise }`. **Skill modifier (derived):**
`getAbilityModifier(fullStats[skill.stat]) + (proficient?pb:0) + (expertise?pb:0)`.

⚠ **Casing inconsistency:** the proficiency map uses `'Sleight Of Hand'` (capital O) — canonicalize to one form in the mapper. Also emit a **proficient/expertise dot** value per skill for the default sheet.

`Acrobatics`(dex) `Animal Handling`(wis) `Arcana`(int) `Athletics`(str) `Deception`(cha) `History`(int) `Insight`(wis) `Intimidation`(cha) `Investigation`(int) `Medicine`(wis) `Nature`(int) `Perception`(wis) `Performance`(cha) `Persuasion`(cha) `Religion`(int) `Sleight Of Hand`(dex) `Stealth`(dex) `Survival`(wis)

## Saving throws (STORED **sparsely** at `char.savingThrows`)

`char.savingThrows: { stat: keyof Stats, proficient: boolean }[]` — **only present entries exist; absence ⇒ not proficient.** Mapper must **iterate all 6 abilities** and default missing to non-proficient. Save mod = `getAbilityModifier(fullStats[stat]) + (proficient?pb:0)`. Emit a proficiency-dot value per save for the default sheet.

## Combat / vitals

| Field key | Access / derivation |
|---|---|
| `armorClass` | `char.ArmorClass` — **stored but currently always 0** (mapper drops it). Read live form value or blank. |
| `speed` | `char.Speed` (also 0) or `char.race.speed` string like `'30ft'`. Read live form value or blank. |
| `initiative` | `getAbilityModifier(fullStats.dex)` — **NOT in code** |
| `passivePerception` | `10 + Perception skill modifier` — **NOT in code** |
| `hpMax` / `hpCurrent` / `hpTemp` | `char.health.max` / `.current` / `.temp` |
| `hitDice` | group `char.levels` by `levels[i].hitDie` → `"Nd8"` strings (`hitDie` is a number; 0 if class unmapped) |
| `attacks` | **No field exists** — `view.tsx` uses hardcoded placeholders. Out of scope; leave blank. |

## Spellcasting

| Field key | Access / derivation |
|---|---|
| `spellSaveDC` | `8 + pb + spellcastingAbilityMod` — **NOT in code** |
| `spellAttack` | `pb + spellcastingAbilityMod` — **NOT in code** |
| `spellSlotsLevelN` (1–9) | `Class5E.spellcasting.metadata.slots[casterLevel]` where `casterLevel = getSpellAndCasterLevel(class5e,'caster',char.level)`. **Single-class only**; multiclass blank. |
| `spellsKnown` | `char.spells.map(s=>s.name)` (all entries) |
| `spellsPrepared` | `char.spells.filter(s=>s.prepared).map(s=>s.name)` |
| spell level grouping | join names to `Spell` objects via `useDnDSpells()`; group by `+spell.level` (cantrips=0) — see `view.tsx sortSpellsByLevel` |

## Features, languages, defenses, equipment, currency (all STORED)

| Field key | Access path |
|---|---|
| `features` | concat names of `char.features[]` + `char.race.features[]` + each `char.levels[i].features[]` (`FeatureDetail{name,description}`) |
| `languages` | `char.languages` (`string[]`; mapper prepends `'Common'`) |
| `resistances` | `char.resistances.filter(d=>d.value).map(d=>d.type)` (`DamageAffinity{type,value}`) |
| `vulnerabilities` | `char.vulnerabilities` (same shape) |
| `immunities` | `char.immunities` (same shape) |
| `otherProficiencies` | `char.proficiencies.other: Record<string,boolean>` (tools/armor/weapons) |
| `inventory` | `char.items.inventory: string[]` (item names; detail via `useDnDItems()`) |
| `equipped` | `char.items.equipped: string[]` |
| `attuned` | `char.items.attuned: string[]` |
| `currencyPP/GP/EP/SP/CP` | `char.items.currency.{platinumPieces, goldPieces, electrumPieces, sliverPieces, copperPieces}` — ⚠ **`sliverPieces`** is a typo'd key (silver); read it exactly |

## Coverage gotchas (must be reflected in tests + default mappings)

- Derived-only fields (no storage anywhere): ability modifiers, proficiency bonus, initiative, passive perception, spell save DC, spell attack, spell slots, hit-dice aggregation.
- `char.ArmorClass` / `char.Speed` are always `0` from the stored Character → source from live form/signal or render blank.
- Sparse `char.savingThrows` → default all 6.
- `'Sleight Of Hand'` casing → canonicalize.
- `sliverPieces` typo key → exact read.
- Multiclass spell slots → out of scope v1 (blank).
- Attacks table → no model data; out of scope.
