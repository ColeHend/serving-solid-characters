# SolidCharacters — Staged Generation Pipeline Spec

A design spec for generating complex content (full characters, homebrew classes) reliably with a local model, by treating the model as a **per-step worker** inside a pipeline your code controls — rather than asking it to produce a whole structure in one shot.

Written to be model-agnostic: it makes `gemma4:12b` genuinely capable at full-character generation, and a stronger model (Qwen, a 27B) just raises the success rate per step on the same scaffold.

---

## 1. Core principles

These cut across every pipeline. If you only take five things from this doc, take these.

1. **Code owns the plan, the model fills slots.** The sequence of steps is a state machine in your code. The model never decides *what* to do next or *whether* a section is done — so it structurally cannot skip a step or forget a section.
2. **Decompose the schema.** Never request a whole character/class in one call. Each step fills a handful of related fields. A 12B reliably nails 8 fields even when it would drop fields from an 80-field monolith.
3. **State lives in your app, not the conversation.** After each step, write the result into a structured object you own (the partial character/class). Feed the model only what the *next* step needs plus a compact summary of what's decided — never rely on chat history to carry the growing structure.
4. **Compute derived values in code.** The model supplies inputs (scores, class, level, equipment). Your code computes AC, modifiers, proficiency bonus, spell slots, HP. D&D math is deterministic; this deletes an entire error class.
5. **Validate and repair per step.** After each step, check it server-side. On failure, re-run *just that step* with the error fed back — never the whole pipeline.

Two supporting rules:

- **Scope homebrew per step.** Inject a homebrew definition only at the step that needs it (lineage at the foundation step, custom spells at the spell step). Don't dump all homebrew into every call.
- **Frame homebrew as transcription, not reasoning.** When homebrew is in context, instruct the model to *transcribe the supplied definition into the schema*, not to reason about or "improve" it — this counters the 12B's habit of normalizing unusual mechanics toward the official rule it pattern-matches.

---

## 2. The Concept Brief (the keystone)

Produced first, injected into **every** subsequent step. This single artifact is what keeps a build from becoming coherent-parts / incoherent-whole. Keep it small and structured.

```jsonc
ConceptBrief {
  concept:      string   // one-line "fantasy" of this thing
  tone:         string   // e.g. "grim, grounded, no flashy effects"
  power_tier:   string   // e.g. "standard", "mid", "high"
  motifs:       string[] // 4–6 concrete recurring images: ["ash","memory","slow burn","binding"]
  themes:       string[] // abstract throughlines: ["loss","obsession"]
  naming_style: string   // e.g. "Adjective Noun; flavor in grim 2nd-person voice"
  constraints:  string[] // hard rules: ["no fire spells", "must use the Ember resource"]
}
```

Every later step receives this brief plus an instruction to make its output **serve the concept and weave in the motifs**. "Weave in `ash, memory, slow burn`" produces consistency; "be thematic" does not.

---

## 3. Character pipeline (known structure → fixed phases)

A character always has the same shape, so you don't need the model to plan — the "plan" is your schema, decomposed into ordered phases. Each phase below lists: **type** (model call vs code), **gets** (context injected), **produces**, **homebrew**, **validates**.

### Phase 1 — Concept anchor
- **type:** model
- **gets:** user's seed input (prompt, picks, vibe)
- **produces:** the `ConceptBrief` (§2)
- **validates:** all required brief fields present; motifs are concrete nouns, not adjectives

### Phase 2 — Mechanical foundation
- **type:** model
- **gets:** brief
- **produces:** class, lineage/species, level, background, ability-score priority order
- **homebrew:** inject homebrew lineage/class definitions **here**
- **validates:** class/lineage exist (official or supplied homebrew); level in range; priorities cover all six abilities
- *Grouped because these are interdependent and load-bearing — every later phase reads from them.*

### Phase 3 — Trained-in
- **type:** model → then code
- **gets:** brief, foundation
- **produces:** ability scores (model, per the priority order + method) → **code computes** modifiers + proficiency bonus → skills, saves, proficiencies (model)
- **validates:** scores legal for the chosen generation method; skill/save counts match class+background; picks reflect concept (a scholar takes Arcana, not Athletics)

### Phase 4 — Capabilities
- **type:** model
- **gets:** brief, foundation, Phase 3 summary
- **produces:** class/lineage features for the level; spells if a caster
- **homebrew:** inject homebrew features/spell lists
- **validates:** feature/spell counts match class+level; spell levels ≤ accessible; picks themed to brief

### Phase 5 — Loadout
- **type:** model
- **gets:** brief, foundation, Phase 3 proficiencies
- **produces:** equipment, weapons, armor, items
- **validates:** items mechanically legal (proficiencies/strength); on-theme

### Phase 6 — Narrative
- **type:** model
- **gets:** brief + a compact summary of **all** mechanical choices so far
- **produces:** backstory, bonds/ideals/flaws, name, appearance
- **validates:** references the mechanics (backstory explains the homebrew lineage; a flaw ties to the dump stat); naming follows `naming_style`
- *Deliberately last — now narrative can justify the mechanics instead of contradicting them.*

### Phase 7 — Compute & validate
- **type:** code only
- **produces:** all derived stats (AC, HP, initiative, save DCs, attack bonuses, slots)
- **validates:** structural (required fields present, types/enums legal) + consistency (numbers agree across fields) → then the **critic pass** (§5.5)

---

## 4. Homebrew class pipeline (novel structure → plan-then-execute)

A homebrew class's structure is the *point* of novelty, so here the model first proposes the shape and you ratify it before any bulk generation.

### Phase A — Design brief
- **type:** model
- **produces:** `ConceptBrief` tuned for a class — fantasy, power source, role (tank/striker/support/controller), power tier
- **validates:** brief complete

### Phase B — Skeleton plan  ⟵ **ratification checkpoint**
- **type:** model proposes → **you / the user approve or edit**
- **produces:** primary ability, hit die, the core resource/mechanic, a progression map (which levels grant features), subclass count + unlock level, intended power curve
- **validates:** every level 1–20 accounted for; no dead levels unless intentional; one clearly-defined core mechanic
- *This is the highest-leverage checkpoint in the whole spec — approve the **shape** before anything generates 40 fields off a wrong premise.*

### Phase C — Chassis
- **type:** model → code
- **gets:** brief, ratified skeleton
- **produces:** proficiencies, HP rules, saving throws, starting equipment, the core mechanic's full rules
- **validates:** against the skeleton; mechanic rules are self-consistent

### Phase D — Features (looped, one feature per call)
- **type:** model, once per feature in the progression map
- **gets:** brief, core mechanic, **every feature already defined**
- **produces:** one feature (name, level, rules text, any resource interaction)
- **validates:** doesn't duplicate/contradict existing features; scales with the power curve; name follows `naming_style`
- *Seeing the already-defined set is what makes each new feature an extension rather than a contradiction.*

### Phase E — Subclasses (looped)
- **type:** model
- **gets:** brief, base class summary
- **produces:** per subclass — a mini-brief ("how does this one specialize the base?"), then its own §D-style feature loop
- **validates:** reads as a *variation* on the class, not a different class; feature levels match the subclass unlock map

### Phase F — Balance & consistency pass
- **type:** model (critic) + code
- **produces:** a review of the whole assembled class against the brief and power curve
- **validates:** power curve monotonic; no level both dead and unintended; tone consistent; flag outliers to regenerate

### Phase G — Validate & assemble
- **type:** code
- **produces:** final assembled class object
- **validates:** full structural + cross-reference check

---

## 5. Thematic-consistency mechanisms

Consistency is mechanism, not vibes. Levers roughly most- to least-impactful:

### 5.1 The anchor brief, everywhere
The §2 brief is injected into every call with "serve this concept." This is the spine; nothing else matters as much.

### 5.2 Carry-forward summary
Every step also receives a compact record of what's already decided, so choices compound. A spell step that knows "fire-and-control themed, already has Burning Hands + Fireball" picks complements, not randoms. Keep this a summarized digest, not raw prior outputs.

### 5.3 Motif keywords
The brief's `motifs` (4–6 concrete images) are explicitly referenced in each step's instruction. Concrete nouns >> abstract "be thematic."

### 5.4 `fits_concept` field on every output
Make each generated piece return a one-line justification of why it belongs. Forces a self-check, and gives your validator (or the user) a concrete handle to reject + regenerate a specific piece.

### 5.5 The critic pass
One end-of-pipeline call reviews the whole assembled thing against the brief: "anything tonally off or clashing?" Flag outliers, regenerate only those. Cheap, and catches drift that individual steps can't see.

### 5.6 Themed pools over open generation
Where possible, filter the option set **in code** (spells/feats narrowed to the theme) and let the model pick from the pool. Narrowing the space is a consistency *guarantee*, not a hope.

### 5.7 Naming / voice convention
A short `naming_style` rule in the brief keeps feature/item names reading like a family ("`Adjective Noun`, grim 2nd-person flavor").

### 5.8 Power/tone guardrails
State tier and tone in the brief up front so no single feature drifts loud or silly — thematic *and* balance consistency in one.

---

## 6. The per-step contract

Every model step, regardless of pipeline, follows the same shape:

```
INPUT  = ConceptBrief + carry-forward summary + (scoped homebrew, if any) + step task
OUTPUT = the step's small field set + a fits_concept justification
GATE   = validate(output):
           structural  — required fields present, types/enums legal
           semantic    — values legal for the rules context
           consistency — agrees with prior decisions
         on fail → re-run THIS step with the error appended (cap retries, then surface to user)
```

Constrained decoding (JSON-schema enforcement) can guarantee the output's *shape* so required fields can't be structurally dropped — but note it can trade omission for hallucination (forced to emit a value, the model may invent one), so keep the semantic/consistency gates regardless. Ollama's support for this is thinner than vLLM's; worth revisiting if/when you move the serve to vLLM.

---

## 7. Implementation notes

- **Plain functions over an agent framework.** The whole value here is that *you* control the flow. A function per step plus a loop is the right primitive; a heavyweight orchestrator fights the design. Add a light orchestration layer only later, when you want retries/branching/observability as first-class features.
- **The partial object is the source of truth.** Each step reads from and writes to one structured `Character` / `HomebrewClass` object your code owns. This is what enables resume, single-step edit, and branching without regenerating everything.
- **Separate planning from execution** (class pipeline). A model asked to plan *and* execute at once does both worse. Phase B is its own call with a human/code checkpoint before Phases C–G.
- **Computation steps are first-class, codeless steps.** "Compute derived stats" is a literal pipeline step that makes no model call. Treat it like any other node.
- **Model-agnostic by design.** Build the scaffold once. Swapping `gemma4:12b` for Qwen or a 27B raises per-step hit rate without changing the pipeline. Conversely, even a frontier model wants this structure for something this field-heavy and rules-bound — so the architecture, not the model, is the real lever.

---

## 8. Quick reference — phase maps

**Character:** concept brief → mechanical foundation *(+homebrew)* → trained-in *(scores→code→skills)* → capabilities *(+homebrew)* → loadout → narrative → compute & validate *(+critic)*

**Homebrew class:** design brief → **skeleton plan (ratify)** → chassis → features *(loop)* → subclasses *(loop)* → balance pass → validate & assemble

**Consistency stack (every step):** anchor brief + carry-forward summary + motif keywords + `fits_concept` self-check; **end:** critic pass + code validation.