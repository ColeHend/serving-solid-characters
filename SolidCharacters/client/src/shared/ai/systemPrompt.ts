import { HOMEBREW_KIND_LABELS, HomebrewKind } from "./homebrewKind";

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

function homebrewPrompt(base: string, dndSystem: string, tier: AiTier): string {
  const edition = editionNote(dndSystem);
  const example = tier === "small" ? SMALL_TIER_EXAMPLE : "";

  return `${base}

When the user asks you to create homebrew content — a spell, item, magic item, feat, background, race, subclass, or class — call the matching create_* tool with a complete, balanced entry. Generate directly; do not ask for confirmation, because the app shows the user a preview to approve before anything is saved. If the request is ambiguous, make sensible design choices and note them in your reply. For anything that is not a request to create content, answer normally without calling a tool.

Quality bar:
- Calibrate power to official content of the same level, rarity, or tier. A homebrew uncommon item should sit beside official uncommon items, not above them.
- Fill the fields the request and good design support. Leave a field empty only when it truly does not apply (no damageType on a non-damaging spell, no material component when there is none) — do not pad optional fields just to fill them.
- Give every entry real rules text: saves, attack rolls, damage dice, conditions, ranges, durations, action cost — concrete numbers, never placeholders — plus a line of flavor.

By type:
- Spell: level, school, casting time, range, duration, components (verbal/somatic/material), concentration and ritual flags, and the classes that can cast it. Set damageType only if it deals damage.
- Magic item: rarity and whether it requires attunement (note any restriction on who may attune).
- Feat: prerequisites and category. Race/background: distinct traits with real effects, plus languages, size, and speed.
- Subclass/class: features at the right levels with full rules text. For a spellcaster, describe casting in a feature; the user completes the spell-slot table in the editor.

${edition}${example}`.trim();
}

/** Which utility tools are advertised to the model this turn (mirrors AiSettings enable flags). */
export interface UtilityToolFlags {
  math?: boolean;
  ask?: boolean;
  plan?: boolean;
}

/**
 * Concise guidance for the utility tools (math/ask/plan), appended in BOTH modes. Only describes the
 * tools that are actually enabled, and ends with a restraint line — small local models otherwise tend
 * to over-call meta tools. Returns "" when nothing is enabled.
 */
function utilityPrompt(flags: UtilityToolFlags | undefined): string {
  if (!flags) return "";
  const bullets: string[] = [];
  if (flags.math) bullets.push("- Math tools (calc_ability_modifier, calc_proficiency_bonus, calc_attack_dpr, calc_save_dpr): call these for an exact D&D number instead of doing the arithmetic yourself.");
  if (flags.ask) bullets.push("- ask_user: when you truly need the user to choose a direction or supply a missing detail, ask with this tool (it shows buttons) and wait — do not use it to ask permission to create content.");
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
    return `${homebrewPrompt(base, dndSystem, tier)}${permissionNote(allowedKinds)}${helpers}`;
  }

  return `${base} Answer questions about rules, lore, and play. If the user wants to create homebrew content, suggest they switch to "Homebrew" mode using the toggle above the message box.${helpers}`;
}