import { HOMEBREW_KIND_LABELS, HomebrewKind } from "../refs/homebrewKind";

export type AiMode = "chat" | "homebrew";
export type AiTier = "small" | "large";

/** Advisory sentence listing the kinds the model is allowed to create, when permissions restrict the set. */
function permissionNote(allowed: HomebrewKind[] | undefined): string {
  if (!allowed) return "";                       // unrestricted — say nothing
  const labels = allowed.map(k => HOMEBREW_KIND_LABELS[k]);
  if (labels.length === 0) {
    return "\n\nNote: homebrew creation tools are currently disabled. Do not call any create_* tool; instead tell the user that content creation is turned off in settings.";
  }
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
      return "The user allows both editions. Design for whichever the request implies, and state which edition you targeted in your reply.";
    default:
      return "";
  }
}

// A worked example mainly helps smaller models, which are less reliable at tool
// selection and field completeness. Larger models do better with a leaner prompt,
// so this is only included for the "small" tier. The most robust form of this is
// real example turns (a prior user message + assistant tool_use + tool_result) in
// the messages array — see the notes that came with this file.
const SMALL_TIER_EXAMPLE = `
<example>
Request: "make me a fire cantrip"
A complete spell entry sets name; level 0; school Evocation; casting time 1 action;
range 120 ft; duration Instantaneous; components verbal + somatic; classes Sorcerer
and Wizard; damageType Fire; concentration false; ritual false; and effect text that
states the attack roll, the damage dice and how they scale by character level, and one
line of flavor. No field that applies is left blank.
</example>`;

/** Per-kind authoring guidance, emitted only for the permitted kinds so the prompt scales to the toolset. */
function byTypeLine(kind: HomebrewKind, dndSystem: string): string {
  switch (kind) {
    case "spell": return "- Spell: level, school, casting time, range, duration, components (verbal/somatic/material), concentration and ritual flags, and the classes that can cast it. Set damageType only if it deals damage.";
    case "item": return "- Item: its type (weapon/armor/tool/gear), cost, weight, and concrete mechanics in the description.";
    case "magic_item": return "- Magic item: rarity and whether it requires attunement (note any restriction on who may attune).";
    case "feat": return "- Feat: prerequisites and the concrete benefits, each spelled out with real numbers.";
    case "background": return dndSystem === "2024"
      ? "- Background: skill proficiencies, a background feature, and (2024) its ability score options and a granted feat that names a real feat."
      : "- Background: skill proficiencies and a background feature.";
    case "race": return "- Race: distinct traits with real effects, plus languages, size, and speed.";
    case "subclass": return "- Subclass: features at the right levels with full rules text. If it grants spellcasting, set casterType (third/half/full/pact) so spell slots are generated.";
    case "class": return "- Class: hit die, primary ability, saving throws, and features at the right levels with full rules text. For a spellcaster, set casterType (third/half/full/pact) so the spell-slot table is generated.";
  }
}

/** Kinds for which 2014-vs-2024 ability-source guidance is relevant (origin/ASI carriers). */
const ORIGIN_KINDS: HomebrewKind[] = ["race", "background", "class", "subclass"];

function homebrewPrompt(base: string, dndSystem: string, tier: AiTier, allowedKinds: HomebrewKind[] | undefined, flags: UtilityToolFlags | undefined): string {
  const kinds = allowedKinds ?? [...(["spell", "item", "magic_item", "feat", "background", "race", "subclass", "class"] as HomebrewKind[])];
  const labels = kinds.map(k => HOMEBREW_KIND_LABELS[k].toLowerCase());
  const opener = labels.length
    ? `When the user asks you to create homebrew content (${labels.join(", ")}), call the matching create_* tool with a complete, balanced entry. Generate directly; do not ask for confirmation — the app shows the user a preview (a diff for edits) to approve before anything is saved. Emit the create_* tool call itself; do not describe the entity in prose instead of calling the tool. Make one create_* call per entity the user asks for. If the request is ambiguous, make sensible design choices and note them in your reply. For anything that is not a request to create content, answer normally without calling a tool.`
    : `Content creation is turned off in settings — you have no create_* tools this turn. If the user asks for homebrew, tell them it is disabled in settings rather than calling a tool.`;

  // Edit-vs-create routing — only when the edit tool is actually advertised.
  const editLine = flags?.edit
    ? "\n\nIf the request targets homebrew that already EXISTS (named, or \"my <X>\"), change it with edit_homebrew, which emits only the fields that change as a diff the user reviews — do not call create_* to rebuild it (that discards the entry's other fields and is rejected as a duplicate). Use create_* only for brand-new content. After an edit, add one short sentence saying what you changed and why."
    : "";

  // Look-up-before-invent sequencing — only when lookup tools are advertised.
  const lookupLine = flags?.lookup
    ? "\n\nBefore inventing stats, call lookup_srd to find the closest official content of the same level/rarity/tier and match its numbers (range, damage dice, action cost, save pattern). Call lookup_homebrew with the proposed name/theme to avoid duplicating content the user already has. Never guess a number you could look up first."
    : "";

  const qualityBar = `Quality bar:
- Calibrate power to official content of the same level, rarity, or tier. A homebrew uncommon item should sit beside official uncommon items, not above them.
- Fill the fields the request and good design support. Leave a field empty only when it truly does not apply (no damageType on a non-damaging spell, no material component when there is none) — do not pad optional fields just to fill them.
- Give every entry real rules text: saves, attack rolls, damage dice, conditions, ranges, durations, action cost — concrete numbers, never placeholders — plus a line of flavor.`;

  const byType = kinds.map(k => byTypeLine(k, dndSystem)).join("\n");
  const byTypeBlock = kinds.length > 1 ? `\n\nBy type:\n${byType}` : (kinds.length === 1 ? `\n\n${byType}` : "");

  // Edition note only matters for origin/ASI-carrying kinds; skip it for a spell/item-only toolset.
  const edition = kinds.some(k => ORIGIN_KINDS.includes(k)) ? editionNote(dndSystem) : "";
  // The prompt-level worked example helps small models, but each create_* schema already carries one;
  // skip the extra example when only one kind is permitted (pure duplication).
  const example = tier === "small" && kinds.length > 1 ? SMALL_TIER_EXAMPLE : "";

  return `${base}

${opener}${lookupLine}${editLine}

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
    bullets.push("- lookup_srd / lookup_homebrew: search official 5e content and the user's own homebrew. The result returns this turn — use what it finds rather than guessing.");
    bullets.push("- delegate_research: hand a multi-step lookup to a helper and get back a short summary (keeps this chat focused).");
  }
  if (flags.ask) bullets.push("- ask_user: when you truly need the user to choose a direction or supply a missing detail, ask with this tool (it shows buttons) and wait — do not use it to confirm saving generated content.");
  if (flags.plan) bullets.push("- propose_plan: for a big multi-step build, propose a short plan with this tool first and let the user approve it before you generate.");
  if (!bullets.length) return "";
  return `\n\nHelper tools:\n${bullets.join("\n")}\nOnly call a helper tool when it genuinely helps; otherwise just answer.`;
}

/**
 * System prompt for the Spark assistant. In homebrew mode it nudges the model to call the matching
 * create_* tool; the user confirms every generated entity before it is saved (the harness gates the
 * actual persistence), so the model should generate freely and not ask permission to "save".
 *
 * `tier` lets the same builder serve both ends of the model range: "large" gets a lean prompt that
 * trusts the model, "small" adds a worked example and is the safer default for a local model like
 * Gemma. Pass the tier that matches the model you are routing the request to.
 *
 * `utility` advertises the enabled helper tools (math/ask/plan), which are available in both modes.
 */
export function buildSystemPrompt(
  dndSystem: string,
  mode: AiMode,
  tier: AiTier = "large",
  allowedKinds?: HomebrewKind[],
  utility?: UtilityToolFlags,
): string {
  const ruleset = rulesetLabel(dndSystem);
  const base = `You are Spark, a Dungeons & Dragons assistant embedded in a character-management app. Assume ${ruleset} unless the user says otherwise. Keep replies concise and use Markdown.`;
  const helpers = utilityPrompt(utility);

  if (mode === "homebrew") {
    return `${homebrewPrompt(base, dndSystem, tier, allowedKinds, utility)}${permissionNote(allowedKinds)}${helpers}`;
  }

  // Chat mode: no create_* tools here. If the model can switch modes itself, tell it to; otherwise fall
  // back to the manual-toggle hint. Either way state the hard boundary so it never hallucinates a create call.
  const createPath = utility?.switchMode
    ? "You cannot create or edit homebrew in this mode — no create_* tools are available, so never call one. If the user wants to create or edit content, call switch_mode(\"homebrew\") first; the app enables the tools and you continue. Don't claim you created anything until after switching."
    : "You cannot create or edit homebrew in this mode — no create_* tools are available, so never call one. If the user wants to create content, tell them to switch to \"Homebrew\" mode using the toggle above the message box.";
  return `${base} Answer questions about rules, lore, and play. ${createPath}${helpers}`;
}