import { HOMEBREW_KIND_LABELS, HomebrewKind } from "../refs/homebrewKind";
import { PersonaStrength } from "../../../models/userSettings";

export type AiMode = "chat" | "homebrew";
export type AiTier = "small" | "large";

/**
 * Persona is a thin VOICE layer that lives only in the streamed assistant prose. The user picks its
 * strength for ANY model (`personaStrength`); `personaFor(strength, tier)` resolves it, with "auto"
 * falling back to a tier-aware default. The core invariant: persona text appears ONLY in the system
 * prompt's prose and in app-authored UI copy — never in tool descriptions, the review/research/title
 * sub-agent prompts, or tool_result strings, which stay procedurally neutral. The lighter levels exist
 * because a 12B local model crowds its context window and bleeds stylistic priors into tool-call JSON,
 * so a heavy persona there can be a net loss — but the choice is the user's.
 */
export interface PersonaConfig {
  /** In-character name (also the product name after the Grimoire rename). */
  name: string;
  /** Opening identity sentence; ends with a period, no trailing space. Replaces the old base line. */
  identityLine: string;
  /** Optional voice-calibration clause inserted before "Keep replies concise…". No trailing space. */
  voiceClause?: string;
  /** Optional in-character decline sentence appended to the chat-mode out-of-scope guidance. */
  outOfScopeLine?: string;
  /** Optional flourish the model may add ALONGSIDE a homebrew tool call (never instead of, never waiting). */
  confirmFlourish?: string;
}

/**
 * The four persona presets form a monotonic ladder of footprint/flavor. The user picks the level
 * (`personaStrength`) for ANY model — it is no longer tied to tier — so they own the accuracy-vs-flavor
 * trade on their own hardware. "auto" (resolved in `personaFor`) keeps the old smart default: a light
 * persona on small local models, full on cloud.
 */

/** off — the assistant keeps its name but drops all flavor. The kill switch. */
export const NEUTRAL_PERSONA: PersonaConfig = {
  name: "Grimoire",
  identityLine: "You are Grimoire, a Dungeons & Dragons assistant embedded in a character-management app.",
};

/** min — skeletal: one identity sentence + a hard "substance stays plain" reminder. Lightest persona. */
export const GRIMOIRE_MIN: PersonaConfig = {
  name: "Grimoire",
  identityLine: "You are Grimoire, a sentient spellbook that helps with D&D.",
  voiceClause: "A little old-world warmth in greetings is fine, but rules, numbers, and stat blocks must be plain and exact.",
};

/** low — the richer identity + warmth in greetings/transitions, but no decline flavor or save flourish. */
export const GRIMOIRE_LOW: PersonaConfig = {
  name: "Grimoire",
  identityLine: "You are Grimoire, a sentient spellbook — an ancient tome that records the spells, lore, and legends of adventurers, and a collaborator, not a servant.",
  voiceClause: "Let light archaic warmth color your greetings and transitions, but keep all substance — rules answers, stat blocks, mechanics — clean, direct, and accurate; never wrap a rules answer in flourish.",
};

/** full — the complete Grimoire voice: rich identity, warmth, in-character declines, and a save flourish. */
export const GRIMOIRE_FULL: PersonaConfig = {
  name: "Grimoire",
  identityLine: "You are Grimoire, a sentient spellbook embedded in a D&D character-management app — an ancient tome that records the spells, lore, and legends of adventurers, and a collaborator, not a servant.",
  voiceClause: "Let your voice color greetings, transitions, and confirmations with light archaic warmth, but keep all substance — rules answers, stat blocks, mechanics — clean, direct, and accurate; never wrap a rules answer in flourish.",
  outOfScopeLine: "When you must decline, do so in character, as the book would — \"That lies beyond my pages.\"",
  confirmFlourish: "\"A worthy entry — shall I preserve it within my pages?\"",
};

/**
 * Resolve the persona for a turn from the user's chosen strength. "auto" keeps the tier-aware default
 * (min on small local models, full on cloud); every other value is honored verbatim on any model.
 */
export function personaFor(strength: PersonaStrength | undefined, tier: AiTier): PersonaConfig {
  const level: Exclude<PersonaStrength, "auto"> =
    !strength || strength === "auto" ? (tier === "small" ? "min" : "full") : strength;
  switch (level) {
    case "off": return NEUTRAL_PERSONA;
    case "min": return GRIMOIRE_MIN;
    case "low": return GRIMOIRE_LOW;
    case "full": return GRIMOIRE_FULL;
  }
}

/** Advisory sentence listing the kinds the model is allowed to create, when permissions restrict the set. */
function permissionNote(allowed: HomebrewKind[] | undefined): string {
  if (!allowed) return "";                       // unrestricted — say nothing
  const labels = allowed.map(k => HOMEBREW_KIND_LABELS[k]);
  // All-disabled is already fully covered by the homebrew opener; a second note here just duplicates it.
  if (labels.length === 0) return "";
  return `\n\nNote: you may ONLY create the following content types right now: ${labels.join(", ")}. The other create_* tools are disabled in settings — if the user asks for one of those, explain it is turned off rather than calling a different tool.`;
}

function rulesetLabel(dndSystem: string): string {
  switch (dndSystem) {
    case "2014": return "the D&D 5e 2014 ruleset";
    case "2024": return "the D&D 5e 2024 ruleset";
    case "both": return "both the 2014 and 2024 D&D 5e rulesets";
    default: return "D&D 5e";
  }
}

function editionNote(dndSystem: string): string {
  switch (dndSystem) {
    case "2024":
      return "In 2024 rules, ability score increases come from backgrounds, not species, and each background grants an Origin feat. Fill the background's ability scores, feat, and skills; leave species ability bonuses empty.";
    case "2014":
      return "In 2014 rules, species/races grant the ability score increases — fill abilityBonuses on races. Backgrounds do not grant feats.";
    case "both":
      return "Both editions are allowed; design for whichever the request implies and state which edition you targeted.";
    default:
      return "";
  }
}

// A worked example mainly helps smaller models, which are less reliable at tool selection and field
// completeness. Larger models do better with a leaner prompt, so this is only included for the "small"
// tier. It is deliberately a NON-DAMAGING utility spell: the per-schema examples already teach the
// damage/attack shape, and a utility example stops the model assuming every spell needs an attack roll
// and damage dice. The most robust form of this is real example turns (a prior user message + assistant
// tool_use + tool_result) in the messages array — see the notes that came with this file.
const SMALL_TIER_EXAMPLE = `
<example>
Request: "make me a minor light cantrip"
A complete spell entry sets name; level 0; school Evocation; casting time 1 action;
range 30 ft; duration 1 hour; components verbal + somatic; classes Druid and Wizard;
concentration false; ritual false; no damageType (it deals no damage); and effect text
that states exactly what it lights, the area, and one line of flavor. No field that
applies is left blank.
</example>`;

/** Per-kind authoring guidance, emitted only for the permitted kinds so the prompt scales to the toolset. */
function byTypeLine(kind: HomebrewKind, dndSystem: string): string {
  switch (kind) {
    case "spell": return "- Spell: level, school, casting time, range, duration, components (verbal/somatic/material), concentration and ritual flags, and the classes that can cast it. Set damageType only if it deals damage.";
    case "item": return "- Item: its type (weapon/armor/tool/gear), cost, weight, and concrete mechanics in the description.";
    case "magic_item": return "- Magic item: rarity and whether it requires attunement (note any restriction on who may attune).";
    case "feat": return "- Feat: prerequisites and the concrete benefits, each spelled out with real numbers.";
    case "background": return dndSystem === "2024"
      ? "- Background: skill proficiencies, a background feature, the starting equipment it grants (concrete items plus any gold, in startEquipment), and (2024) its ability score options and a granted feat that names a real feat."
      : "- Background: skill proficiencies, a background feature, and the starting equipment it grants (concrete items plus any gold, in startEquipment).";
    case "race": return "- Race: distinct traits with real effects, plus languages, size, and speed.";
    case "subrace": return "- Subrace: parentRace must be the EXACT name of an existing race (look it up if unsure) plus at least one distinct trait with a real effect. Only include what it adds or changes — everything else is inherited from the parent.";
    case "subclass": return "- Subclass: features at the right levels with full rules text. If it grants spellcasting, set casterType (third/half/full/pact) so spell slots are generated.";
    case "class": return "- Class: hit die, primary ability, saving throws, and features at the right levels with full rules text. For a spellcaster, set casterType (third/half/full/pact) so the spell-slot table is generated.";
  }
}

/** Kinds for which 2014-vs-2024 ability-source guidance is relevant (origin/ASI carriers). */
const ORIGIN_KINDS: HomebrewKind[] = ["race", "subrace", "background", "class", "subclass"];

function homebrewPrompt(base: string, dndSystem: string, tier: AiTier, allowedKinds: HomebrewKind[] | undefined, flags: UtilityToolFlags | undefined, persona: PersonaConfig): string {
  const kinds = allowedKinds ?? [...(["spell", "item", "magic_item", "feat", "background", "race", "subrace", "subclass", "class"] as HomebrewKind[])];
  const labels = kinds.map(k => HOMEBREW_KIND_LABELS[k].toLowerCase());
  // A post-generation flourish is allowed ALONGSIDE the tool call, never instead of it and never waiting.
  const flourish = labels.length && persona.confirmFlourish
    ? ` You may add a short line of flavor alongside the call (e.g. ${persona.confirmFlourish}), but never wait for a yes before calling the tool.`
    : "";
  const opener = labels.length
    ? `When the user asks you to create homebrew content (${labels.join(", ")}), call the matching create_* tool with a complete, balanced entry. Generate directly — do not ask permission first; the app shows the user a preview to approve before anything is saved. Emit the create_* tool call itself; never describe the entity in prose instead of calling the tool. Make one create_* call per entity the user asks for. If the request is ambiguous, make sensible design choices and note them in your reply. After you call a create_* tool, state the exact name you gave the entity in your reply — you (and the user) will need that exact name to edit it later. For anything that is not a request to create content, answer normally without calling a tool.${flourish}`
    : `Content creation is turned off in settings — you have no create_* tools this turn. If the user asks for homebrew, tell them it is disabled in settings rather than calling a tool.`;

  // Edit-vs-create routing — only when the edit tool is actually advertised.
  const editLine = flags?.edit
    ? `\n\nIf the request targets homebrew that already EXISTS (named, or "my <X>"), change it with edit_homebrew, which emits only the fields that change as a diff the user reviews — do not call create_* to rebuild it (that discards the entry's other fields and is rejected as a duplicate). Use create_* only for brand-new content. Always pass the entity's EXACT stored name to edit_homebrew; if you are not certain of it${flags?.lookup ? ", call lookup_homebrew first (an empty query lists every name of a kind) and use the exact name it returns" : ""} — never guess the name. After an edit, add one short sentence saying what you changed and why.`
    : "";

  // Class routing — when the staged pipeline is offered, a base CLASS is built through generate_class, not
  // a one-shot create_* call (there is no create_class). Only shown when class creation is actually permitted.
  const classPipelineLine = flags?.pipeline && kinds.includes("class")
    ? "\n\nTo create a base CLASS, call generate_class with the user's concept and any hard requirements they stated — NOT a single create_* call. It runs a guided staged build (a design brief, then a skeleton the user approves, then the chassis and features) that produces a far more coherent, balanced class than one call could. Never try to emit a whole class in a single tool call."
    : "";

  // Character routing — a player character is built through generate_character (a guided staged build), not
  // a create_* call. A character is not homebrew, so this is shown whenever the pipeline seeds are offered.
  const characterPipelineLine = flags?.pipeline
    ? "\n\nTo create a player CHARACTER (a specific adventurer — not a homebrew class or race), call generate_character with the user's concept and any hard requirements they stated (class, race, level, background). It runs a guided staged build that picks the mechanics, rolls stats, equips the character, writes its story, and saves it. Never use a create_* tool for a character."
    : "";

  // Look-up-before-invent sequencing — only when lookup tools are advertised. Ordered procedure so a weak
  // model knows WHEN to look up, how to use the result, and what to do on a miss.
  const lookupLine = flags?.lookup
    ? "\n\nBefore you invent any stat, call lookup_srd for the closest official content of the same level/rarity/tier and use its numbers as a ceiling (range, damage dice, action cost, save pattern) — homebrew should match its official peers, not exceed them. Call lookup_homebrew to avoid duplicating content the user already has. For exact derived values (ability modifier, proficiency bonus) use the calc_* tools. If a lookup returns nothing, proceed with your best estimate from official examples."
    : "";

  // The quality bar is the single canonical home of "fill what applies / never leave a supported field
  // empty" and "concrete numbers, never placeholders" — the field descriptions no longer repeat them.
  const qualityBar = `Quality bar:
- Calibrate power to official content of the same level, rarity, or tier. A homebrew uncommon item should sit beside official uncommon items, not above them.
- Fill the fields the request and good design support, and never leave a supported field empty; leave a field blank only when it truly does not apply (no damageType on a non-damaging spell, no material component when there is none).
- Give every entry real rules text with concrete numbers — saves, attack rolls, damage dice, conditions, ranges, durations, action cost, never placeholders — plus a line of flavor.`;

  const byType = kinds.map(k => byTypeLine(k, dndSystem)).join("\n");
  const byTypeBlock = kinds.length > 1 ? `\n\nBy type:\n${byType}` : (kinds.length === 1 ? `\n\n${byType}` : "");

  // Edition note only matters for origin/ASI-carrying kinds; skip it for a spell/item-only toolset.
  const edition = kinds.some(k => ORIGIN_KINDS.includes(k)) ? editionNote(dndSystem) : "";
  // The prompt-level worked example helps small models, but each create_* schema already carries one;
  // skip the extra example when only one kind is permitted (pure duplication).
  const example = tier === "small" && kinds.length > 1 ? SMALL_TIER_EXAMPLE : "";

  return `${base}

${opener}${lookupLine}${editLine}${classPipelineLine}${characterPipelineLine}

${qualityBar}${byTypeBlock}

${edition}${example}`.trim();
}

/** Which tools are advertised to the model this turn (mirrors what runTurn actually sends). */
export interface UtilityToolFlags {
  math?: boolean;
  ask?: boolean;
  plan?: boolean;
  /** lookup_srd / lookup_homebrew / delegate_research are advertised. */
  lookup?: boolean;
  /** edit_homebrew is advertised (homebrew mode). */
  edit?: boolean;
  /** switch_mode is advertised (the model can change its own mode). */
  switchMode?: boolean;
  /** generate_class (the staged-pipeline seed tool) is advertised — the only class-creation path. */
  pipeline?: boolean;
  /** True when create_* tools are actually available this turn (homebrew mode + a permitted kind). */
  canCreate?: boolean;
}

/**
 * Concise guidance for the helper tools (math/lookup/ask/plan), appended in BOTH modes. Only describes the
 * tools actually enabled, and ends with a restraint line — small local models otherwise over-call meta
 * tools. Returns "" when nothing is enabled.
 */
function utilityPrompt(flags: UtilityToolFlags | undefined): string {
  if (!flags) return "";
  const bullets: string[] = [];
  if (flags.math) {
    bullets.push("- calc_ability_modifier / calc_proficiency_bonus: for an exact ability modifier or proficiency bonus, call these instead of computing it yourself — the result comes back to you this turn, so use it and don't wait for the user.");
    bullets.push("- calc_attack_dpr / calc_save_dpr: when balancing a homebrew weapon, feature, or damaging spell, call these to estimate its average damage and compare against official content of the same level/tier.");
  }
  if (flags.lookup) {
    bullets.push("- lookup_srd / lookup_homebrew: search official 5e content and the user's own homebrew; the result returns this turn.");
    bullets.push("- delegate_research: hand a multi-step lookup to a helper and get back a short summary (keeps this chat focused).");
  }
  if (flags.ask) bullets.push("- ask_user: when you truly need the user to choose a direction or supply a missing detail, ask with this tool (it shows buttons) and wait — do not use it to confirm saving generated content.");
  if (flags.plan) bullets.push("- propose_plan: for a big multi-step build, propose a short plan with this tool first and let the user approve it before you generate.");
  if (!bullets.length) return "";
  return `\n\nHelper tools:\n${bullets.join("\n")}\nOnly call a helper tool when it genuinely helps; otherwise just answer.`;
}

/**
 * System prompt for the Grimoire assistant. In homebrew mode it nudges the model to call the matching
 * create_* tool; the user confirms every generated entity before it is saved (the harness gates the
 * actual persistence), so the model should generate freely and not ask permission to "save".
 *
 * `tier` lets the same builder serve both ends of the model range: "large" gets a lean prompt that
 * trusts the model, "small" adds a worked example and is the safer default for a local model like
 * Gemma. Pass the tier that matches the model you are routing the request to.
 *
 * `utility` advertises the enabled helper tools (math/ask/plan), which are available in both modes.
 *
 * `persona` is the VOICE layer (see `personaFor`). It defaults to NEUTRAL (name only, no flavor); pass a
 * Grimoire preset to colour greetings/transitions/confirmations while substance stays clean.
 */
export function buildSystemPrompt(
  dndSystem: string,
  mode: AiMode,
  tier: AiTier = "large",
  allowedKinds?: HomebrewKind[],
  utility?: UtilityToolFlags,
  persona: PersonaConfig = NEUTRAL_PERSONA,
): string {
  const ruleset = rulesetLabel(dndSystem);
  const voice = persona.voiceClause ? `${persona.voiceClause} ` : "";
  const base = `${persona.identityLine} Assume ${ruleset} unless the user says otherwise. ${voice}Keep replies concise and use Markdown.`;
  const helpers = utilityPrompt(utility);

  if (mode === "homebrew") {
    return `${homebrewPrompt(base, dndSystem, tier, allowedKinds, utility, persona)}${permissionNote(allowedKinds)}${helpers}`;
  }

  // Chat mode: no create_* tools here. Bound the domain (no scope guidance existed before), then state
  // the hard create boundary. If the model can switch modes itself, tell it to; otherwise fall back to
  // the manual-toggle hint. Keep "never call one" first so it never hallucinates a create call.
  const scope = `Your scope is D&D 5e rules, lore, character building, and this app. Decline anything outside that and offer D&D help instead; never call a tool for an off-topic request.${persona.outOfScopeLine ? ` ${persona.outOfScopeLine}` : ""}`;
  const createPath = utility?.switchMode
    ? "You cannot create or edit homebrew in this mode — no create_* tools are available, so never call one. If the user wants to create or edit content, call switch_mode(\"homebrew\") first; the app enables the tools and you continue. Don't claim you created anything until after switching."
    : "You cannot create or edit homebrew in this mode — no create_* tools are available, so never call one. If the user wants to create content, tell them to switch to \"Homebrew\" mode using the toggle above the message box.";
  return `${base} Answer questions about rules, lore, and play. ${scope} ${createPath}${helpers}`;
}
