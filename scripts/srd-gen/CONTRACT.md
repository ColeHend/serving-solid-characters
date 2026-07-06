# srd-gen parser contract

Every parser module converts markdown from `Docs/` into the on-disk JSON shapes in `types.ts`
(these mirror `SolidCharacters.Domain/Models/DTO/Class5e.cs`). Read this whole file before writing a parser.

## Ground rules

1. **Do not edit shared files** (`types.ts`, `md/*`, `lib/*`, `config.ts`). If a shared util doesn't cover a case,
   handle it locally in your parser and leave a `// NOTE:` comment.
2. Always run input through `normalizeMarkdown()` before parsing.
3. `id` fields: emit `""` (empty string). The id-stability pass fills them afterwards. Same for every nested
   `FeatureDetail.id` / trait `Feat.id`.
4. `metadata.mads`: never emit — the MADS pass owns it. You MAY emit `metadata.uses`/`recharge`
   (recharge values: `"long"` | `"short"`, matching existing data) when the text states a use count, and
   `metadata.category` (feats: their category line; class features granted by choice mechanics).
5. Descriptions: the feature/spell/trait body text, markdown mostly intact (keep `- ` bullets and pipe tables,
   strip heading markers), whitespace-collapsed via `cleanWhitespace`. Do NOT summarize, do NOT truncate.
6. Before inventing a convention, open the existing JSON in `SolidCharacters.Repository/data/srd/<ruleset>/`
   and match it (key naming, value formats, e.g. `classSpecific` keys `rage`, `rage_damage`, `weapon_mastery`).
7. Counts must satisfy `COUNT_GATES` in `config.ts`. Run your module with
   `npx tsx <yourtest>.ts` from `scripts/srd-gen/` and print counts + 1-2 sample entities to verify.
8. Test scripts go in `scripts/srd-gen/selftest/` (they are not part of the pipeline).
9. `legacy`: never emit — the central stamp pass (`emit/stampLegacy.ts`) owns it
   (2014 → `true`, 2024 → `false`) and `validateLegacy` hard-gates it before write.

## Ruleset conventions

| Field | 2014 | 2024 |
|---|---|---|
| `hit_die` | `"12"` (digits only) | `"d12"` |
| `primary_ability` | `"STR"` (abbrev; from Multiclassing.md prerequisites; constant fallback ok) | `"Strength"` (from Core Traits table) |
| `saving_throws` | `["STR","CON"]` | `["Strength","Constitution"]` |
| spell `level` | number (`0` for cantrips) | number (`0` for cantrips) |
| items | three files: items/weapons/armor | one merged items.json (`type` 0-3) |

Ability name → abbrev: Strength→STR, Dexterity→DEX, Constitution→CON, Intelligence→INT, Wisdom→WIS, Charisma→CHA.
Ability enum (StatBonus.stat): STR=0, DEX=1, CON=2, INT=3, WIS=4, CHA=5.

## Classes

- `features`: `{ "<level>": FeatureDetail[] }` for ALL 20 levels present in the progression table (a level with no
  features gets `[]` — every level key 1..20 must exist, matching existing 2024 data).
- Feature names come from the progression-table Features column (split on commas — but NOT commas inside parens).
  Feature description = the body of the matching feature section:
  - 5.1: `### <Name>` sections after the class table (name match is case-insensitive, ignore parenthetical
    suffixes like "Brutal Critical (1 die)" → section "Brutal Critical").
  - 5.2: `#### Level N: <Name>` (sometimes `###`) — match on the `Level N:` pattern, not hash depth.
  - Placeholder rows: "Path feature"/"Subclass feature"/"Bonus Proficiency" etc. with no matching section get
    description `"See your subclass."` or the closest matching text.
  - "Ability Score Improvement" / "Epic Boon" get the description from their section (5.2 has one; for 5.1 use the
    Beyond_1st_Level/ASI text if present, else a standard sentence).
- Extra numeric columns → `classSpecific` snake_case (match existing keys: `rage`, `rage_damage`, `sneak_attack`,
  `martial_arts`, `ki_points`, `sorcery_points`, `invocations_known`, `cantrips_known` only when NOT part of
  spellcasting, `weapon_mastery`...). Values are the raw cell strings.
- Slot columns (`1st`..`9th`, `Cantrips Known`, plus Warlock's pact table) → `spellcasting`:
  - `metadata.slots`: `{ "<charLevel>": { cantrips_known?, spell_slots_level_1.. } }` — only non-zero/non-dash cells.
  - `metadata.casterType`: Full=3 (Bard/Cleric/Druid/Sorcerer/Wizard), Half=2 (Paladin/Ranger), Pact=4 (Warlock).
  - Warlock: the pact table gives "Spell Slots" + "Slot Level" → `{ spell_slots_level_<slotLevel>: <count> }` per level.
  - Known casters (table has Spells Known column): `known_type: "number"`, `spells_known: { "<lvl>": n }`.
  - Prepared casters: `known_type: "calc"`, `spells_known_calc: { stat: "INT"|"WIS"|"CHA", level: "full"|"half" }`
    (2024 classes with a "Prepared Spells" column are `known_type:"number"` with that column, matching existing 2024 files — verify against existing wizard).
  - Non-casters: omit `spellcasting` entirely.
- Proficiencies/equipment:
  - 5.1: `#### Proficiencies` `**Armor:**` etc. Skills line "Choose two from A, B, and C" → `choices.skills =
    { options:[...], amount: 2 }`, `proficiencies.skills: []`. `#### Equipment` bullet list: `(*a*) X or (*b*) Y`
    options become `choices.start_<n>` entries + `starting_equipment` `{ optionKeys: [...] }` rows; fixed bullets
    become `{ items: [...] }`. Follow the existing 2014 files' key style (`start_main_weapon` etc. — check them).
  - 5.2: Core Traits key/value table (`keyValueRecord`): Saving Throw Proficiencies, Skill Proficiencies
    ("Choose 2: ..." → `choices.skills`), Weapon Proficiencies, Armor Training, Starting Equipment
    ("Choose A or B: (A) ...; or (B) ..." → `choices.equipment = { options: [A-text, B-text], amount: 1 }`).
  - `start_choices`: map of category → choice key, e.g. 2024 `{ skills: "skills", equipment: "equipment" }`;
    2014 per existing files (weapon/armor/tools categories where applicable).

## Subclasses (one per class in both SRDs)

- 5.1: under the class file — `## <Class> Paths/Domains/...` → `### <Subclass Name>` → `#### <Feature>`s.
  Feature level parsed from text ("Starting when you choose this path at 3rd level", "At 6th level", "Beginning at 10th level").
- 5.2: `### <Class> Subclass: <Name>` (H3) inside the class file → `#### Level N: <Feature>`.
- `parent_class` = class name ("Barbarian"). `description` = the intro/tagline text.
- Domain/Circle spell tables (e.g. Cleric Life Domain) → `metadata.spells: [names]` on the level-1 (or granting) feature.
- Subclass spellcasting (5.1 Eldritch Knight-style doesn't exist in SRD; leave `spellcasting` null/omit).

## Races / species

- 5.1 (`01_Races/Races_Each/*.md`): H1 = race. `***Trait***.` runs via `parseBoldItalicRuns`.
  - `Ability Score Increase` → `abilityBonuses` / `abilityBonusChoice { amount, choices:[{stat,value}] }`
    ("two other ability scores of your choice increase by 1" → choice among the OTHER five).
  - `Speed` → int; `Size` → "Medium"/"Small" + `descriptions.sizeDescription`; `Age`/`Alignment` → `descriptions`;
    `Languages` → `languages` array (named ones) + `languageChoice` when "one extra language of your choice"
    (`{ options: [], amount: 1 }` with empty options = free choice, match existing 2014 Human if present).
  - All OTHER runs → `traits[]` as `{ details: { name, description, id: "" }, prerequisites: [], id: "" }`.
  - Subraces: H2 sections in the same file → `subraces.json` rows; `parentRace` filled with the parent's id by the
    id pass — emit the parent race NAME in `parentRace` and the id pass swaps it.
  - `descriptions.description` = the race's intro prose.
- 5.2 (`04_CharacterOrigins.md`, `## Character Species` → species headings, mostly H4): fields from
  `labeledFields` (Creature Type/Size/Speed), traits from `**Trait.**` bold runs (`parseBoldRuns`).
  `abilityBonuses: []` always. Lineage/ancestry tables stay inside the relevant trait description as a pipe table.

## Backgrounds

- 2014 (`03_Characterization/Backgrounds.md`): H2 per background. Skip personality/ideal/bond/flaw tables entirely.
  `languages` → ChoiceDetail `{ options: [...], amount: n }` (fix: existing file used `choose` — use `amount`).
  Feature: `### Feature: <Name>` → `features[0]`.
- 2024 (`04_CharacterOrigins.md`, `## Character Backgrounds`): H4 per background (tolerate `## **Soldier**`).
  `**Ability Scores:**` → `abilityOptions` (full names). `**Feat:**` → `feat` (strip "(see \"Feats\")").
  Skill/Tool proficiency lines → `proficiencies`. `**Equipment:**` A/B → `startEquipment` with optionKeys ["A"]/["B"].
  `desc` = the background's intro prose (first paragraph).

## Spells

- 2014: one file per spell in `07_Spells/Spells_Each/*.md` (H3 name). Italic line `*3rd-level evocation*` /
  `*Evocation cantrip*` / `*2nd-level abjuration (ritual)*` → `level` (int, cantrip=0), `school` (Capitalized),
  `is_ritual`. `**Casting Time/Range/Components/Duration:**` fields.
  `***At Higher Levels***.` run → `higherLevel` (and KEEP it out of `description`).
  Class lists: `07_Spells/Spell_Lists.md` (H2 "<Class> Spells" → H4 level → bullets) → `classes: []` sorted.
  `subclasses: []` (SRD 5.1 lists are class-only).
- 2024 (`07_Spells.md` under `## Spell Descriptions`): H4 spell (tolerate `#### **Name**`).
  Italic line `*Level 2 Evocation (Sorcerer, Wizard)*` / `*Evocation Cantrip (Sorcerer, Wizard)*` → level, school, classes.
  `**_Using a Higher-Level Spell Slot._**` / `**_Cantrip Upgrade._**` bold-italic run → `higherLevel`.
- Both: `components` = raw "V, S, M (...)" string; `is_verbal/is_somatic/is_material` derived;
  `materials_needed` = the M(...) content or omit; `is_concentration` = Duration contains "Concentration";
  `duration` keeps the raw text minus "Concentration, up to" prefix? — NO: keep raw duration text exactly (existing files do).
  `damage_type` = the damage type of the spell's primary damage roll ("8d6 fire damage" → "Fire"), else `""`.
  `page` = `""`. `description` = body text.

## Items / equipment

- 2014: `04_Equipment/Weapons.md` table (embedded category rows → `properties.Category` "Simple"/"Martial",
  `properties.WeaponRange` "Melee"/"Ranged", damage cell → `properties.Damage`, props cell split → `properties.Properties`
  string[]; range "(range 20/60)" → `RangeNormal`/`RangeLong`). Match existing `2014/weapons.json` property keys exactly.
  `Armor.md` table → `properties.{ArmorCategory,AC,Stealth,StrengthReq}`. `Adventuring_Gear.md` + `Tools.md` tables →
  items.json with `properties.category` (e.g. "AdventuringGear", "Tools" — match existing).
  Weight "1 lb." → number in lb (fractions like "1/2 lb." → 0.5; "—" → 0).
- 2024 (`06_Equipment.md`): four weapon tables (+ Mastery column → `properties.Mastery` = mastery NAME only),
  armor table, tools table, adventuring gear table → ONE items.json with `type`: Weapon=0/Armor=1/Tool=2/Item=3.
- Costs: keep raw cell text ("15 GP" / "2 gp" as written).

## Weapon masteries (2024 only)

`weapon_masteries.json` is per-WEAPON (36 rows, matching existing): `{ id:"", name: <weapon>, damage, properties: [...],
mastery: "<MasteryName> - <property definition text>" }`. Definitions come from `### Mastery Properties` H4 sections;
each weapon row joins its mastery name with that definition.

## Magic items

- 2024: `10_MagicItems.md` — every H4 under the item-listing sections. Italic type line `*Armor (Any Medium or Heavy), Uncommon*`
  → `category` (text before first comma), `rarity` (after last comma; keep compound rarities verbatim),
  `properties.attunement` ("Requires Attunement..." text when present). Body → `desc` (first paragraph) +
  `properties.effect` (rest, incl. sub-tables) — or all in `desc` if short; keep existing file style where sensible.
  `cost`: from the rarity→value table (`## Magic Item Rarity`) as "X GP" if stated per rarity, else `""`. `weight`: `""` unless stated.
- 2014: `09_Magic_Items/Magic_Items_Each/*.md` (per-file, H3 name) + `Artifacts.md` items. Same italic-line parsing
  (`*Wondrous item, rare (requires attunement)*`). `cost`/`weight` `""` unless stated.

## Feats

- 2014 (`05_Feats/Feats.md`): H2 per feat. `*Prerequisite: ...*` italic → `prerequisites` (see enum below). Body → `details.description`.
- 2024 (`05_Feats.md`): H3 category sections, H4 feats. Italic line `*General Feat (Prerequisite: Level 4+, Strength or Dexterity 13+)*`
  → `details.metadata.category` = "Origin Feat"/"General Feat"/"Fighting Style Feat"/"Epic Boon Feat", `prerequisites`.
  Benefits (`**X.**` runs) stay in the description text.
- `Prerequisite.type` uses the C# `PrerequisiteType` enum — read `SolidCharacters.Domain/Models/enums.cs` and map
  (ability score / level / feature / other → the right member; value = the human text, matching existing 2024 feats.json).
