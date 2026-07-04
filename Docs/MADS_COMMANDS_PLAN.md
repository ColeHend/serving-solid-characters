# New Mads Commands: ClassFeature, Advantage, Attacks, Uses (+ view support)

## Context

The mads system (`Add<Category>`/`Remove<Category>` commands stored on `feature.metadata.mads[]`) needs new commands to cover:
1. Adding class-specific picks (eldritch invocations, fighting styles, weapon masteries, etc.) to `character.features`
2. Add/remove advantage or disadvantage on rolls — saving throws (optionally per-stat, per-condition like "against being frightened"), weapon attacks, spell attacks, initiative
3. Extra attacks per Action
4. Speed increase — **already covered** by existing `AddSpeed`/`RemoveSpeed` (`useSpeedFeature.ts`); nothing new needed
5. Tracking limited-use features (Rage, Action Surge) with interactive spend/reset UI

User decisions: full scope; generic free-text command for class picks (no new data files/endpoints); advantage stored on the model **and** shown as badges in the character view; interactive use-tracking pips with rest reset.

### Verified load-bearing facts

- **`useMadCharacters` has ZERO call sites** — mads are authored/validated but never applied to a viewed character. Wiring it into the view (Step 8) is mandatory or nothing (new or existing commands) is visible.
- **`view.tsx:420` renders only `levels.flatMap(x => x.features)`** — top-level `character.features` (where `AddFeatures`/new `AddClassFeature` push) and `race.features` never render. Must fix.
- **Characters are client-only** (Dexie/IndexedDB, indexed only by `name`; no character API endpoint). No .NET changes, no Dexie version bump. Old rows lack new fields → every read must default (`?? []`, `?? 1`, `?? {}`).
- `coerceCommand` hardcodes `type: MadType.Character` (madCommandCatalog.ts:295) — needs a per-spec override for the Info-type `Uses` command.
- `commandChipLabel` (madCommandCatalog.ts:359) joins ALL value strings — would dump whole descriptions for ClassFeature chips; needs `labelKeys`.
- Handlers mutate the character in place — the view must apply mads to a `Clone`, never the signal's object.
- Homebrew features routinely have `id: ""` → key spent-uses by **feature name**, not id.

## Design

### New categories (4)

| Category | Add value bag | Remove value bag | Effect |
|---|---|---|---|
| `ClassFeature` | `name` (req), `description`, `category` (e.g. "Eldritch Invocation") | `name` (req) | Push/filter `FeatureDetail` on `character.features`, dedupe by name |
| `Advantage` | `rollType` (req), `mode` (req), `stat`, `condition` | same | Push/filter `character.rollAdvantages` |
| `Attacks` | `amount` (req, number) | `amount` (req) | `attacksPerAction = (?? 1) + amount`; remove floors at 1 |
| `Uses` | `amount` (req, number), `recharge` ("Short Rest"/"Long Rest") | `amount` | `MadType.Info` — no-op on character; read by view via `featureUsage()` helper |

Key semantics: **disadvantage is `AddAdvantage` with `mode: "disadvantage"`** — `RemoveAdvantage` strictly removes a granted entry (hint must say this or the AI will misuse it). One `Advantage` category (not five) — one handler/sub-editor/catalog row; rollType is a field: `SavingThrow | WeaponAttack | SpellAttack | Initiative | AbilityCheck`.

### New Character fields (`src/models/character.model.ts`)

```ts
export type AdvantageMode = "advantage" | "disadvantage";
export type AdvantageRollType = "SavingThrow" | "WeaponAttack" | "SpellAttack" | "Initiative" | "AbilityCheck";
export interface RollAdvantage {
  rollType: AdvantageRollType;
  mode: AdvantageMode;
  stat?: keyof Stats;      // SavingThrow/AbilityCheck only; absent = all
  condition?: string;      // e.g. "against being frightened"
  source?: string;         // granting feature name (badge tooltips)
}
// in class Character:
public rollAdvantages: RollAdvantage[] = [];
public attacksPerAction: number = 1;
public featureUses: Record<string, number> = {};  // SPENT counts, keyed by feature name
```
Add the three fields to the `halfCharacter` Omit list (line 119).

## Steps (each independently verifiable)

### 1. Character model + literal fixes
- `src/models/character.model.ts` — fields/types above + Omit entries.
- `src/shared/customHooks/dndInfo/useCharacters.ts` (~106-128) — `updateCharSpell` object literal typed `Character` won't compile with new fields; replace with `this.updateCharacter({ ...character, spells })`. Add optional `silent` param to `updateCharacter`/`updateCharInDB` suppressing the success snackbar (pip clicks would toast per tap).
- `src/components/characters/create/characterMapper.ts` — `createCharacter({...})` call literal needs the new defaults.
- Verify: `npx tsc --noEmit`, `npm test` green.

### 2. MadCommands union
`src/shared/customHooks/mads/madModels.ts` — append `AddRemove<'ClassFeature'> | AddRemove<'Advantage'> | AddRemove<'Attacks'> | AddRemove<'Uses'>` after line 34.

### 3. Handlers (4 new files in `src/shared/customHooks/mads/commands/`)
Mirror `useResistanceFeature.ts` defensiveness (missing key → `DebugConsole.error` + return character unchanged):
- `useClassFeature.ts` — `addClassFeature`/`removeClassFeature`: push `{ id: "", name, description: value['description'] ?? "", metadata: { category } }` onto `character.features` deduped by name (like `useFeatures.ts:22`); remove filters by lowercased name.
- `useAdvantageFeature.ts` — validate rollType/mode; `character.rollAdvantages = character.rollAdvantages ?? []` (old DB rows); dedupe on (rollType, mode, stat, condition); remove filters on match.
- `useAttacksFeature.ts` — `Number.isFinite` guard; add/subtract with `Math.max(1, ...)` on remove.
- `useUsesFeature.ts` — documented no-op add/remove (Info type). Also export pure helpers:
  - `featureUsage(feature): { max, recharge } | null` — scan `metadata.mads` for `AddUses`, fall back to `metadata.uses`/`recharge`; default recharge "Long Rest".
  - `resetFeatureUses(character, rest, limitedFeatures)` — Long Rest clears all `featureUses`; Short Rest clears only "Short Rest" features.

### 4. Dispatcher + collector — `src/shared/customHooks/mads/useMadCharacters.ts`
- 8 new `case`s before `default` (import handler pairs at top).
- New export (the missing application entry point):
```ts
export function collectMadFeatures(character: Character): MadFeature[] {
    const feats = [
        ...(character.levels ?? []).flatMap(l => l.features ?? []),
        ...(character.race?.features ?? []),
        ...(character.features ?? []),
    ];
    return feats.flatMap(f => (f.metadata?.mads ?? []) as MadFeature[])
                .filter(m => m.type === MadType.Character);
}
```

### 5. Handler unit tests — new `src/shared/customHooks/mads/useMadCharacters.test.ts`
Vitest, follow `commandAgent.test.ts` mocking pattern (mock IndexedDB-touching imports). Cases: ClassFeature push/dedupe/missing-name; Advantage on old-shape character (no `rollAdvantages`) initializes; Attacks defaults + floor; Uses no-op; `featureUsage` mads-then-metadata fallback; `collectMadFeatures` gathers all 3 sources + filters Info; applying same list to fresh `Clone` twice is idempotent.

### 6. Catalog — `src/shared/ai/commands/madCommandCatalog.ts` (stays leaf/pure — no model imports)
- New const option sets: `ROLL_TYPES`, `ADV_MODES`, `RECHARGE_TYPES`; new `FieldType`s `rollType`/`advMode`/`recharge` with coercers (alias maps: "saves"→SavingThrow, "dis"→disadvantage, "dawn"→Long Rest, etc.).
- `CommandSpec` gains `madType?: MadType` and `labelKeys?: string[]`.
- 4 `COMMAND_CATALOG` entries (all `idBased: false`; `Uses` gets `madType: MadType.Info`; `ClassFeature` gets `labelKeys: ["name","category"]`); hints must state: Advantage — "disadvantage is still an ADD"; Uses — "marks THIS feature as limited-use".
- `MAD_CATEGORIES` += 4; `CATEGORY_ALIASES` += (advantage/disadvantage, attack/extraattack, use/limiteduse, invocation/fightingstyle/mastery→ClassFeature).
- `coerceCommand:295` → `type: spec.madType ?? MadType.Character`; `commandChipLabel` honors `labelKeys`.
- `ATTACH_COMMANDS_TOOL`/`validateMads`/`validateStoredCommand` pick everything up automatically.
- Extend `commandAgent.test.ts` (coercion/aliasing, Uses→Info, chip label) and `validateMads.test.ts` (bad rollType flagged).

### 7. AI pipeline prompts — `src/shared/ai/commands/commandAgent.ts`
- `KEYWORD_CATEGORIES` (~160): rows for `/advantage|disadvantage/→Advantage` (**required** — "advantage on saving throws" currently keyword-matches only `SavingThrows` and would mis-emit a proficiency), `/extra attack|attack twice|additional attack/→Attacks`, `/invocation|fighting style|weapon mastery|maneuver|metamagic/→ClassFeature`, `/\buses?\b|per (short|long) rest|expended/→Uses`.
- `MECHANICAL_RE` (~408): add `extra attack`, `per (short|long) rest`, `invocation`, `fighting style`, `weapon mastery`.
- `SINGLE_FEATURE_EXAMPLES` (~185): two few-shots (frightened-save advantage; "use twice per long rest" → Uses).

### 8. Wire mads into the character view — `src/components/characters/view/view.tsx` (the linchpin)
```ts
const displayCharacter = createMemo(() => {
    const base = currentCharacter();
    if (!base) return base;
    const clone = Clone(base);   // handlers mutate in place
    return useMadCharacters(clone, collectMadFeatures(clone));
});
```
- Features section (417-429): render from `displayCharacter()` over **all three** sources `[...levels.flatMap(f), ...race.features, ...features]`; show `metadata.category` as a `Chip` next to the name.
- Verify manually: homebrew class feature carrying `AddClassFeature`/`AddResistances` → appears on sheet with chip.

### 9. Advantage badges + attacks count
- `view.tsx`: chips (`Chip` from coles-solid-library, "ADV"/"DIS" + condition) next to the Initiative box (191-195) for `Initiative` entries; "Attacks per Action: N" + WeaponAttack/SpellAttack chips above the actions table (`<h2>Main</h2>`, 263).
- `view/stat-bar/statBar.tsx` + `stat/stat.tsx`: new optional props threading filtered `RollAdvantage[]` (rollType SavingThrow/AbilityCheck, stat match) to render chips on the "X Saving Throw:" line (stat.tsx:67). Missing prop → renders nothing.

### 10. Uses tracker + rest buttons
- New `src/components/characters/view/usesTracker/usesTracker.tsx` — props `{ featureName, max, recharge, spent, onChange }`; `max` pips as `Checkbox` row (checked = spent).
- In the features section, where `featureUsage(feature)` non-null: `<UsesTracker spent={currentCharacter()?.featureUses?.[feature.name] ?? 0} .../>`. `onChange` clones the **base** character (never persist the mad-applied clone), sets `featureUses[name]`, calls `updateCharacter(updated, /*silent*/ true)`.
- "Short Rest"/"Long Rest" `Button`s in the features box header → `resetFeatureUses` on base clone → persist.
- Verify: 2-use Rage feature → spend one → **page reload** (Dexie round-trip) still spent → Short Rest no-op → Long Rest resets.

### 11. Manual editor — `featuresPopup.tsx` + 4 new sub-editors under `featuresPopup/parts/`
- Add `'ClassFeature', 'Advantage', 'Attacks', 'Uses'` to the local `MadCommands` array (183-200).
- New sub-editors following `speedFeature.tsx`/`savingThrow.tsx` (local signals + Set button → `props.toggleValue`):
  - `parts/classFeature/` — name `Input`, description `TextArea`, category `Select` (+free text)
  - `parts/advantageFeature/` — mode/rollType `Select`s, conditional stat `Select`, condition `Input`
  - `parts/attacksFeature/` — amount `Input`
  - `parts/usesFeature/` — amount `Input`, recharge `Select`; on set also `setMadFeature("type", i(), MadType.Info)`
- 4 `<Match>` blocks in the `<Switch>` (after ~710), wired like the AddSpeed Match (660-675).
- Verify: author each command, save, re-open (`fillForm`) — values round-trip.

### 12. Full verification
- `npm test`, `npx tsc --noEmit` / `npm run build`, `npm run lint` (in `SolidCharacters/client/`).
- Manual E2E: homebrew class with a level-1 feature carrying all four commands → create character → view shows: granted class feature + category chip, save/initiative/attack advantage badges, "Attacks per Action: 2", use pips + rest resets + reload persistence.
- AI smoke: generate homebrew with "You have advantage on Dexterity saving throws" → `AddAdvantage` chip on preview card.

## Risks / gotchas

1. Apply mads only to a `Clone` — handlers mutate in place; memo re-runs would double-apply.
2. Old Dexie rows bypass the class constructor — default every new-field read.
3. Dual `FeatureDetail` definitions — import from `src/models/generated`, not `src/models/data/features.ts`.
4. `characterMapper.createCharacter()` silently drops top-level `features` (pre-existing) — verify Step 8 via class-level features, not creation-time top-level ones.
5. `featureUses` keyed by name: same-named features share a pool (matches existing name-as-identity convention); renames orphan counts harmlessly.
6. `featuresPopup.save()` hardcodes `metadata: { uses: 0, recharge: "" }` — harmless since `featureUsage()` prefers the mads command; don't "fix" without checking the AI path.
7. No backend changes — verified no character controller; homebrew metadata round-trips opaquely.
