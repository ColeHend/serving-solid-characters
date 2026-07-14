import fs from "node:fs";
import path from "node:path";
import { SRC_2024 } from "../../config.ts";
import { normalizeMarkdown } from "../../md/normalize.ts";
import { sectionize, walk, type Section } from "../../md/sections.ts";
import { cleanWhitespace, nameKey } from "../../lib/util.ts";
import type { RuleJson } from "../../types.ts";

// "Attack [Action]" → name "Attack", tag "Action".
const BRACKET_RE = /^(.*?)\s*\[([^\]]+)\]\s*$/;

/** Rule body: keep bullets/pipe tables, collapse blank-line paragraph breaks to single "\n". */
function ruleBody(s: string): string {
    return cleanWhitespace(s).replace(/\n{2,}/g, "\n").trim();
}

/** Bare name from a heading, with any trailing "[Tag]" removed. */
function bareName(title: string): string {
    const m = title.match(BRACKET_RE);
    return (m ? m[1] : title).trim();
}

/** Every quoted "..." span inside each `*See also* ...` run of a body. */
function seeAlsoNames(body: string): string[] {
    const names: string[] = [];
    const re = /\*See also\*([^\n]*)/gi;
    let m: RegExpExecArray | null;
    while ((m = re.exec(body))) {
        for (const q of m[1].matchAll(/"([^"]+)"/g)) names.push(q[1].trim());
    }
    return names;
}

/**
 * Parse the 2024 SRD Rules Glossary (08_RulesGlossary.md). Entries are `#### <Name>` under
 * "## Rules Definitions"; a bracket tag ("Attack [Action]") becomes both `category` and a `tag`.
 * `related` cross-links the `*See also*` quoted names that resolve to other glossary entries.
 */
export function parseRules2024(): RuleJson[] {
    const file = path.join(SRC_2024, "08_RulesGlossary.md");
    const md = normalizeMarkdown(fs.readFileSync(file, "utf8"));
    const roots = sectionize(md);

    let defs: Section | undefined;
    for (const s of walk(roots)) {
        if (s.level === 2 && /rules definitions/i.test(s.title)) { defs = s; break; }
    }
    const entries = (defs?.children ?? []).filter(c => c.level === 4);

    // name-key → canonical bare name, so `related` uses each target's real spelling.
    const nameByKey = new Map(entries.map(e => [nameKey(bareName(e.title)), bareName(e.title)]));

    const rules: RuleJson[] = [];
    for (const e of entries) {
        const m = e.title.match(BRACKET_RE);
        const name = bareName(e.title);
        const tag = m ? m[2].trim() : undefined;
        const description = ruleBody(e.body);
        if (!name || !description) continue;

        const related = [...new Set(
            seeAlsoNames(e.body)
                .map(n => nameByKey.get(nameKey(n)))
                .filter((n): n is string => !!n && nameKey(n) !== nameKey(name)),
        )];

        const rule: RuleJson = { id: "", name, description, tags: tag ? [tag] : [] };
        if (tag) rule.category = tag;
        if (related.length) rule.related = related;
        rules.push(rule);
    }
    return rules;
}
