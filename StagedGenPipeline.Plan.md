# Staged Generation Pipeline — Implementation Plan

Companion to [`ComplexGenPipeline.md`](ComplexGenPipeline.md) (the design spec). This is the
concrete build plan for SolidCharacters: how to turn the spec into code, what to reuse, what to
add, and in what order.

> Source of truth for "current state" below is a code-grounded audit of `SolidCharacters/client/src/shared/ai/*`,
> `aiAssistant.ts`, the model/provider adapters, the readiness pipeline, and the data models.
> Line numbers are indicative (pre-change) and should be re-confirmed at edit time.

---

## 0. Decisions & assumptions

| Decision | Choice | Consequence |
|---|---|---|
| **Rollout** | **Replace one-shot.** The staged pipeline is the *only* generation path for classes (then characters). | The current "model fills a whole `create_class` in one turn → `buildPreview` card" entry is removed. The model call becomes a *seed* that hands off to the orchestrator. `buildPreview`/`validateEntity`/`toClass` are **kept and reused** by the pipeline (per-step + assemble + edit). |
| **Scope & order** | **Shared infra → Homebrew Class pipeline (A–G) → Character pipeline (1–7).** | Class extends an existing generated kind (reuses `toClass` + `homebrewManager5e`). Character is **net-new surface** — there is no AI character-generation tool today (`HOMEBREW_KINDS` = spell/item/magic_item/feat/background/race/subclass/class, no `character`). |
| **Primary model** | **Local gemma-12B via Ollama** (per project history), cloud (Opus 4.8) capable. | Lean on **decomposition + per-step repair**, not constrained decoding. `tool_choice:"required"` is a cloud-only reliability nicety (Ollama native ignores it). |
| **Structured output** | Keep **single-forced-tool + JSON.parse** (existing `runSubAgent` pattern). Defer real JSON-schema constrained decoding. | Matches spec §6 ("Ollama's support is thinner than vLLM's; revisit when you move to vLLM"). Reliability comes from small per-step schemas + repair, not inference-time constraints. |
| **Orchestration style** | **Standalone code-owned orchestrator** that calls the model per-step via the existing `runSubAgent` primitive — *not* woven into `runTurn`/`outstanding`. | Matches spec §7 ("plain functions over an agent framework… a function per step plus a loop"). The main chat turn only *triggers* the pipeline and *renders* its progress. |

---

## 1. Current state (what we build on)

**Orchestration** — `aiAssistant.ts` is a singleton: `send()` → `runTurn()` (streams) → `finishTurn()`
partitions tool calls by `toolCategory()` into compute/interactive/lookup/control/edit/homebrew →
`resolveToolCall()` gates continuation on an `outstanding` Set (when empty, re-runs `runTurn`).
Generation today is **one-shot**: `buildPreview(toolCall, dndSystem)` coerces a whole entity, validates,
and surfaces a `HomebrewPreview` card. Usage levels Low/Medium/High gate *post-generation* quality only.

**Per-step worker already exists** — `shared/ai/subAgent.ts`: `runSubAgent(spec, task, ai, signal?, execute?)`
runs an isolated, bounded (`MAX_ITERATIONS=4`) model turn in a fresh message array, returns `{text, toolCalls, ok}`.
Used today by the research delegate and command enrichment. **This is the pipeline's per-step primitive.**

**Validation/critic already exists** — `shared/ai/readiness/`: `assembleVerdicts(preview, ctx)` runs
deterministic gates (`schemaVerdict`, `brokenReferenceVerdict`, `linterVerdict`) then LLM passes
(balance, action_economy, exploit_loop, dominant_option) then a final schema check. Fail-open.
`setCustomAgentResolver()` allows custom passes per kind. `balanceFacts()` extracts dice/DC facts but
**only for spells/magic items today**.

**Deterministic compute already exists** — `dndMath.ts` (`getAbilityModifier`, `getProficiencyBonus`, DPR),
`spellSlots.ts` (`buildSlotTable`/`buildSpellcasting` by caster type), `characterToSheetValues.*`
(spell save DC `8+pb+mod`, attack `pb+mod`, skills, passive perception), `coerce.ts` (str/num/boolean/list).
**Missing: AC and HP computation** (stored directly on `Character` today).

**Providers** — streaming only; 3 adapters (Ollama native, Local OpenAI-compat, Proxy/.NET cloud).
**No** `format`/`json_schema`/`response_format` knob anywhere. Tool forcing = single tool in array +
`tool_choice:"auto"`.

**Persistence** — `chatHistoryDB.ts::SavedConversation` stores `history`/`messages`/`pendingPreviews`
only; `sanitizePreviewsForStore()` + `balancedHistory()` deliberately strip in-flight state.
**No partial object / step index is persisted.**

**UI** — `SparkSidebar` → `ChatMessageList` renders `HomebrewPreviewCard`, `InteractionCard`
(`ask_user` + `propose_plan` — **`propose_plan` already maps to a ratification checkpoint**),
`ReviewVerdicts`, `StatusTicker` (`activePhase()`), `UsageLevelMenu`, `ModeMenu`, `DecisionLog`.

**⚠️ Two `Class5E` types exist** — the AI path produces & persists `models/generated/…DTO.Updated.ts`
`Class5E` (`id: string`, **required** `startChoices`); the homebrew-editor UI form path uses
`models/data/classes.ts` `Class5E` (`id: number`, optional `startChoices`). They do **not** converge.
**The pipeline's assemble step must emit the `models/generated` DTO** (what `homebrewManager5e.addClass` accepts).

---

## 2. Target architecture

A new module `shared/ai/genPipeline/` owns the state machine. The model is a per-step worker invoked
through `runSubAgent`. The orchestrator reads/writes one **working object** (the source of truth),
computes derived values in code between steps, validates+repairs per step, checkpoints after each step,
and runs a critic pass at the end.

```
shared/ai/genPipeline/
  types.ts              ConceptBrief, WorkingClass, WorkingCharacter, PhaseSpec,
                        StepResult, PipelineRun, PipelineCheckpoint, PipelinePhase enum
  orchestrator.ts       run(spec, seed): drives phases, checkpoints each, emits progress,
                        handles ratification gates, returns assembled entity
  stepWorker.ts         runStep(brief, summary, scopedHomebrew, stepTask, stepTool):
                        builds neutral system prompt + brief + summary, forces ONE tool via
                        runSubAgent, coerces output, runs per-step gate, repairs (step-scoped cap)
  conceptBrief.ts       Phase 1/A: produce + validate ConceptBrief (motifs must be concrete nouns)
  carryForward.ts       summarize(working): compact digest of decided-so-far (spec §5.2)
  validate.ts           per-step structural + semantic + consistency gates (wraps validateEntity/
                        assessCompleteness/coerce + new cross-step checks)
  compute.ts            codeless steps: modifiers, prof bonus, slots, AC, HP, save DCs, attack
  critic.ts             wrap assembled entity as synthetic HomebrewPreview -> assembleVerdicts;
                        + balanceFacts class extension; returns flagged pieces to regenerate
  classPipeline.ts      Phases A-G
  characterPipeline.ts  Phases 1-7
  checkpoint/
    checkpointDB.ts             new Dexie table `pipelineCheckpoints`
    pipelineCheckpointManager.ts  load/save/discard (pattern of homebrewManager5e)
```

### 2.1 The per-step contract (spec §6) — `stepWorker.runStep`

```
INPUT  = neutral-persona identity + ruleset
       + ConceptBrief (every step, "serve this concept; weave in motifs: …")
       + carry-forward summary (compact digest of prior decisions)
       + scoped homebrew (ONLY the defs this step needs — transcribe, don't reason)
       + step task (fill THESE 5-10 fields)
OUTPUT = step's small field set + a `fits_concept` one-liner
GATE   = structural (required fields present; coerced types legal)
       + semantic (values legal for rules context)
       + consistency (agrees with working object so far)
       on fail -> re-run THIS step with error appended; step-scoped cap; then surface to user
```

`runStep` is a thin wrapper over `runSubAgent` with a `SubAgentSpec` containing exactly one tool
(the step's schema). Output parse reuses the existing accumulate-then-`JSON.parse` pattern from
`commandAgent.generateCommands` / `llmReview.runLlmReview`, and coercion reuses `coerce.ts`.

### 2.2 Why a standalone orchestrator (not the `outstanding` gate)

The existing `runTurn`/`finishTurn`/`outstanding` machinery is built for *"model emits N tool calls,
code resolves them, continue."* A pipeline where **code decides what to ask next** fits better as its
own driver that *calls* the model. So:

- Model's `generate_class` / `generate_character` tool call (or a UI button) **triggers** the orchestrator.
- `finishTurn` resolves that trigger tool call immediately with a `"generation started"` tool_result
  (so the chat turn doesn't hang on `outstanding`), then kicks off `pipeline.run(...)` async.
- The orchestrator runs `runSubAgent` per step, updates a new reactive `pipelineRun` signal, persists a
  checkpoint after each step, and surfaces ratification gates via `InteractionCard`.
- On completion it saves via `homebrewManager5e.addClass` (class) / `CharacterManager` (character) and
  emits a final preview card.

This keeps the complex `finishTurn` partition untouched and matches spec §7.

---

## 3. Reuse map (existing → pipeline role)

| Existing symbol / file | Pipeline role |
|---|---|
| `subAgent.ts::runSubAgent`, `SubAgentSpec` | Per-step worker runtime (§2.1) — **the** primitive. |
| `commandAgent.generateCommands` / `llmReview.runLlmReview` | Templates for "force one tool, accumulate, JSON.parse". Copy into `stepWorker`. |
| `coerce.ts` (`str/num/boolean/list/strList`) | Coerce every step's untrusted output. |
| `toolDispatcher.ts::toClass/toRace/toSpell/...`, `validateEntity`, `assessCompleteness` | Coerce partial → typed entity; structural/semantic gates per step + assemble. |
| `toolDispatcher.ts::buildPreview`, `HomebrewPreview` | Build per-step preview + final card + the synthetic preview the critic wraps. |
| `dndMath.ts` (`getAbilityModifier`, `getProficiencyBonus`, DPR fns) | Code-computed derived values (Phase 3/C/7). |
| `spellSlots.ts::buildSlotTable/buildSpellcasting`, `parseCasterType` | Stamp working slot table on casters. |
| `characterToSheetValues.*` (spell DC/attack, skills, passive, initiative) | Phase 7 derived-stat compute & validate. |
| `readiness/pipeline.ts::assembleVerdicts`, `setCustomAgentResolver` | Critic pass (Phase F / Phase 7) over a synthetic whole-entity preview. |
| `readiness/balanceFacts.ts` | Extend with a `kind==="class"` branch (hit die, primary ability, features/level, power-curve). |
| `readiness/reviewSystemPrompt.ts::ReviewPassSpec` + custom-agent resolver | Register a `class_balance_consistency` critic pass targeting `kind:"class"`. |
| `interactions.ts::PROPOSE_PLAN_TOOL` + `InteractionCard` + `answerInteraction` | **Skeleton ratification (Phase B)** and any mid-pipeline ask. |
| `ReviewVerdicts.tsx` | Render per-step + critic verdicts. |
| `StatusTicker.tsx` / `activePhase()` | Show current phase ("Phase 3 of 7 — Trained-in"). |
| `homebrewManager5e.ts::addClass` (generated DTO `Class5E`) | Assemble-step save (class). |
| `useCharacters.ts::CharacterManager`, `Character`, `Stats` | Assemble-step save (character). |
| `chatHistoryDB`/`balancedHistory`/`sanitizePreviewsForStore` | **Leave unchanged** — checkpoint state gets its own table. |

---

## 4. New code to add

**Shared infra**
- `genPipeline/types.ts`:
  - `ConceptBrief { concept, tone, power_tier, motifs:string[], themes:string[], naming_style, constraints:string[] }`
  - `WorkingClass` / `WorkingCharacter` (mutable partials; assemble to `models/generated` `Class5E` / `Character`)
  - `PipelinePhase` enum; `PhaseSpec { id, kind:'model'|'code'|'gate', run() }`
  - `PipelineRun` (reactive: phaseIndex, totalPhases, status, currentPreview, verdicts, error)
  - `PipelineCheckpoint { id, conversationId, pipelineType, currentPhaseIndex, working, conceptBrief, createdAt, updatedAt }`
- `genPipeline/conceptBrief.ts`: brief tool schema + producer + validator (motifs = concrete nouns, all fields present).
- `genPipeline/carryForward.ts`: `summarize(working): string` — e.g. *"L5 Barbarian; STR16/CON15; features: Rage, Unarmored Defense"*.
- `genPipeline/stepWorker.ts`: `runStep(...)` (§2.1) with **step-scoped** repair budget.
- `genPipeline/validate.ts`: cross-step consistency checks (e.g. ability-mods match scores; skill/save counts match class+background; spell level ≤ accessible).
- `genPipeline/compute.ts`:
  - **`computeAC(dexMod, armor?, shield?)`** — base 10+dex; light/medium/heavy rules. *(gap — does not exist)*
  - **`computeHP(level, hitDie, conMod)`** — avg-per-level + con, min 1/level. *(gap — does not exist)*
  - thin wrappers re-exporting `dndMath`/`spellSlots`/`characterToSheetValues` derivations for the pipeline.
- `genPipeline/critic.ts`: build synthetic `HomebrewPreview` → `assembleVerdicts`; class `balanceFacts` extension; map blocking verdicts → "regenerate piece X".
- `genPipeline/orchestrator.ts` + `classPipeline.ts` + `characterPipeline.ts`.
- `genPipeline/checkpoint/checkpointDB.ts` + `pipelineCheckpointManager.ts`.

**Tools**
- `tools/toolSchemas.ts`: add slim **seed** tools `generate_class` / `generate_character` (concept + any hard user picks). Add per-step tool schemas (small field sets), or generate them by slicing the existing `create_*` schemas.
- `tools/toolCategory.ts`: route `generate_*` to a new `"pipeline"` category.

**Settings**
- `userSettings.ts`: reinterpret `usageLevel` for the pipeline (see §8). Optional `genPipeline` sub-config (feature-loop batching, critic on/off at Low).

---

## 5. Files to modify (existing)

| File | Change |
|---|---|
| `aiAssistant.ts` | `finishTurn`: route `generate_*` seed calls to `pipeline.start(seed)`, resolve the trigger immediately. Add reactive `pipelineRun()` + actions (`ratifySkeleton`, `regenerateStep`, `abortPipeline`, `restartPipeline`). On `loadConversation`, query checkpoint table → offer resume. |
| `tools/toolSchemas.ts`, `tools/toolCategory.ts` | New seed tools + `"pipeline"` category; **remove** `create_class` (and later `create_character`) as a *direct* one-shot generation entry (kept internally for the assemble/edit path). |
| `prompt/systemPrompt.ts` | *(optional)* add `conceptBrief?`, `carryForwardSummary?` params if any pipeline step reuses `buildSystemPrompt`. The step worker builds its own neutral prompt, so this may be unnecessary. |
| `readiness/balanceFacts.ts` | Add `kind==="class"` extraction (hit die, primary ability, features/level distribution, core-mechanic summary). |
| `readiness/reviewSystemPrompt.ts` / custom-agent resolver | Register `class_balance_consistency` pass (power curve monotonic, no unintended dead levels, tone vs brief). |
| `providers/localAdapter.ts` + `Services/Ai/AiChatService.cs` (×2) | *(optional, cloud nicety)* `tool_choice:"auto"` → `"required"` for forced single-tool steps. Ollama native unchanged. |
| `homebrewManager5e.ts` | Confirm `addClass` accepts assembled generated-DTO `Class5E` (no change expected). |
| Tests: `toolDispatcher.test.ts`, `aiAssistant.orchestration.test.ts`, `toolSchemas.test.ts`, `toolCategory.test.ts` | Migrate one-shot-generation expectations to the pipeline path; add new pipeline tests. |

---

## 6. Homebrew Class pipeline (Phases A–G)

State machine in `classPipeline.ts`. Working object = `WorkingClass` → assembles to `models/generated` `Class5E`.

| Phase | Type | Produces | Reuse / New | Validate | Checkpoint after |
|---|---|---|---|---|---|
| **A — Design brief** | model | `ConceptBrief` tuned for a class (fantasy, power source, role, tier) | `conceptBrief.ts` | all fields; motifs concrete | ✔ |
| **B — Skeleton plan** ⟵ **ratify** | model → **user** | primary ability, hit die, core resource/mechanic, progression map (levels→features), subclass count + unlock level, power curve | `PROPOSE_PLAN_TOOL` + `InteractionCard` + `answerInteraction` | every level 1–20 accounted; one clear core mechanic | ✔ (ratified shape) |
| **C — Chassis** | model → code | proficiencies, HP rules, saving throws, starting equipment, core-mechanic full rules | `toClass` (partial), `coerce`; `buildSpellcasting` if caster | against skeleton; `validateEntity` hard blockers | ✔ |
| **D — Features (loop)** | model ×N | one feature per call (name, level, rules text, resource interaction) — **gets every feature already defined** | `runStep` loop; `carryForward` of prior features | no dup/contradiction; scales with curve; name follows `naming_style` | ✔ each feature |
| **E — Subclasses (loop)** | model ×N | per subclass: mini-brief, then its own §D feature loop | `runStep` loop; `Subclass` type | reads as a variation; feature levels match unlock map | ✔ each subclass |
| **F — Balance & consistency** | model (critic) + code | review whole assembled class vs brief & curve | `critic.ts` (synthetic preview → `assembleVerdicts`); class `balanceFacts` | power curve monotonic; no unintended dead level; tone consistent → regenerate flagged only | ✔ |
| **G — Assemble & validate** | code | final `models/generated` `Class5E` | `toClass` final; `validateEntity`; `homebrewManager5e.addClass` | full structural + cross-reference | save + clear checkpoint |

Key behaviors:
- **Scoped homebrew** (spec §1, §7): inject custom lineage/mechanic defs only at C/D where needed; instruct "transcribe, don't normalize".
- **Feature loop carry-forward** is what makes each feature an extension, not a contradiction (spec §4.D).
- **Regenerate-only-flagged** at F: a blocking verdict re-enters D/E for just that piece, not the whole class.

---

## 7. Character pipeline (Phases 1–7) — built after Class

Net-new surface. Working object = `WorkingCharacter` → assembles to `Character`, saved via `CharacterManager`.

| Phase | Type | Produces | Reuse / New |
|---|---|---|---|
| **1 — Concept anchor** | model | `ConceptBrief` | `conceptBrief.ts` (shared) |
| **2 — Mechanical foundation** | model | class, lineage, level, background, ability priority order (**+ homebrew lineage/class injected here**) | scoped homebrew; `lookupTools` to confirm official options |
| **3 — Trained-in** | model → **code** → model | ability scores (model) → **code** computes modifiers + prof bonus (`dndMath`) → skills/saves/proficiencies (model) | `dndMath`; `validate.ts` counts vs class+background |
| **4 — Capabilities** | model | features for level; spells if caster (**+ homebrew features/spell lists**) | `buildSpellcasting`; spell-level-accessible check (new) |
| **5 — Loadout** | model | equipment, weapons, armor, items | proficiency-vs-stat checks (warn) |
| **6 — Narrative** | model | backstory, bonds/ideals/flaws, name, appearance | gets full carry-forward; must reference mechanics; naming per `naming_style` |
| **7 — Compute & validate** | code | AC, HP, initiative, save DCs, attack bonuses, slots | **`computeAC`/`computeHP` (new)** + `characterToSheetValues.*`; then **critic pass** (§5.5) |

---

## 8. Usage levels, remapped (because we replaced one-shot)

The pipeline always runs; Low/Med/High now tune *how much repair/critic*, reusing existing semantics:

- **Low** — run pipeline; **1 repair per step**; **skip** LLM critic (Phase F / Phase 7 critic); surface result.
- **Medium** — per-step repair + auto-retry failed steps once (reuse `mediumRetries`).
- **High** — per-step repair + **full critic pass** + auto-fix loop on blocking verdicts (reuse `maxSchemaRetries`/`reviewFixStreak` semantics, **re-scoped per step**).

**Repair budgets must become step-scoped.** Today `repairCounts` is keyed by entity title and
`mediumRetryStreak`/`schemaRetryStreak`/`reviewFixStreak` are per-request. Add a `currentStepId` and a
per-step budget record; reset on *step advance*, not on every `send()`.

---

## 9. Persistence & resume

- New Dexie table **`pipelineCheckpoints`** (own table, *not* a `SavedConversation` field — keeps the
  intentional conversation-sanitization untouched). `PipelineCheckpoint` per §4.
- `pipelineCheckpointManager` (pattern of `homebrewManager5e`): `save(checkpoint)` after each step,
  `get(conversationId)`, `discard(id)` on completion/abort.
- On `loadConversation`: if an in-flight checkpoint exists, render a **"Resume generation"** affordance
  in the sidebar; resume re-enters the orchestrator at `currentPhaseIndex` with the persisted `working` object.

---

## 10. UI

- **`GenPipelineCard.tsx`** (new): top of `ChatMessageList`. Shows "Phase X of Y — <name>", a step
  progress strip, the current step's preview/verdicts (reuse `ReviewVerdicts`), and actions:
  **Regenerate this step**, **Edit this step**, **Abort**, **Restart from step…**.
- **Ratification (Phase B)**: reuse `InteractionCard` (`propose_plan`) — already supports approve/refine/reject.
  Parameterize its title with the phase name ("Step B: Skeleton Plan").
- **`StatusTicker`**: extend `AiPhase` + `PHASE_MESSAGES` with pipeline phases
  (`design_brief`, `skeleton`, `chassis`, `features`, `subclasses`, `balance`, `assemble`; and
  `concept`, `foundation`, `trained_in`, `capabilities`, `loadout`, `narrative`, `compute`).
- **DecisionLog**: emit one entry per completed/ratified phase for observability.

---

## 11. Structured-output & local-model strategy

- Per step, pass **exactly one tool** to `runSubAgent` (already nudges the model to call it). Accumulate
  args, `JSON.parse`, `coerce`, gate, repair. This is the existing, proven pattern.
- **Cloud nicety**: flip `tool_choice` to `"required"` (`AiChatService.cs` ×2, `localAdapter.ts`) so
  cloud models cannot go text-only on a step. **Ollama native ignores this** — for local we rely on the
  single-tool nudge + repair loop. (1-line changes; low risk; optional.)
- **Defer** real JSON-schema constrained decoding (`response_format`/Ollama `format`) — revisit if/when the
  serve moves to vLLM (spec §6). The decomposition is the reliability lever, not the constraint.

---

## 12. Risks & open issues

1. **Two `Class5E` types** (`models/generated` vs `models/data/classes`) do not converge. The pipeline
   **must** emit the `models/generated` DTO (string `id`, required `startChoices`) for `homebrewManager5e.addClass`.
   *Recommend a follow-up consolidation task* — two incompatible schemas for one entity is a latent bug source.
2. **Latency.** A class is now ~20–40 model calls (concept + skeleton + chassis + ~13–18 features + subclasses + critic)
   vs 1. On gemma-12B this is minutes. Mitigations: feature-loop batching for trivial levels (config), run the
   critic only at High, show live progress so it doesn't feel hung. This is the core tradeoff of "replace one-shot."
3. **Replacing one-shot touches tests.** `toolDispatcher.test.ts` / `aiAssistant.orchestration.test.ts` /
   `toolSchemas.test.ts` / `toolCategory.test.ts` assume the one-shot entry. Migrate them and add pipeline tests.
4. **Ollama can't be forced** to emit a tool call — a step may return prose. The gate + repair loop must treat
   "no tool call" as a step failure (fail-closed for *that step*, then repair), unlike readiness which fails open.
5. **`balanceFacts` is spell/item-only** — needs the class branch (§5) before the critic is meaningful for classes.
6. **Character save path is unverified** — `CharacterManager` create/update + uniqueness strategy needs a short
   spike before Phase 7 (the data-model audit flagged Character has no obvious `id`).

---

## 13. Build order / milestones

Each milestone is independently demoable.

- **M0 — Shared infra.** `types.ts`, `conceptBrief.ts`, `carryForward.ts`, `stepWorker.ts`, `validate.ts`,
  `compute.ts` (incl. `computeAC`/`computeHP`), checkpoint table + manager. Unit-test the step worker against a
  stub provider and the compute fns against known D&D values.
  *Acceptance:* a throwaway 2-step stub pipeline runs, repairs a forced-bad step, and checkpoints.
- **M1 — Class thin slice (A–C).** Design brief → **skeleton ratify** (InteractionCard) → chassis, wired to
  `GenPipelineCard`, saving a minimal class via `homebrewManager5e.addClass`.
  *Acceptance:* generate a level-1-only class end-to-end with a working ratification gate.
- **M2 — Class features + subclasses (D–E).** Feature loop with carry-forward; subclass loop.
  *Acceptance:* a full 1–20 class whose features reference each other coherently.
- **M3 — Class critic + assemble (F–G).** `critic.ts` synthetic-preview pass + class `balanceFacts`;
  regenerate-flagged; final validate + save.
  *Acceptance:* critic flags an intentionally over-tuned feature and regenerates only that feature.
- **M4 — Replace one-shot.** Remove `create_class` direct entry; route `generate_class`; remap usage levels;
  migrate tests.
  *Acceptance:* all class generation flows through the pipeline; suite green.
- **M5 — Character pipeline (1–7).** Reuse all infra; add `generate_character`, `WorkingCharacter`,
  `CharacterManager` save, character compute (AC/HP/DCs).
  *Acceptance:* generate a coherent character whose narrative references its mechanics.
- **M6 — Polish.** Resume-on-reload, abort/restart, decision-log per step, settings, status flavor text.

---

## 14. Testing strategy

- **Pure functions first:** `computeAC`/`computeHP`/derived stats, `carryForward.summarize`, brief validation,
  per-step gates — table-driven unit tests (no model).
- **Step worker** against a scripted stub provider: success, malformed JSON, missing field → repair → success,
  budget-exhausted → surface.
- **Orchestrator** with all model steps stubbed: phase ordering, ratification pause/resume, checkpoint write/restore,
  regenerate-flagged.
- **Critic** with a stub reviewer: blocking verdict → targeted regeneration.
- **Integration (manual / gemma-12B):** the real reliability signal per spec — confirm a 12B completes a full class
  without dropping sections, which is the whole point of the decomposition.
