import { cleanTitle } from "./normalize.ts";

export interface Section {
    level: number;      // number of #
    title: string;      // cleaned heading text
    rawTitle: string;   // heading text as written (emphasis kept)
    body: string;       // text under the heading, up to the next heading of ANY level
    start: number;      // line index of the heading
    /** Sections nested under this one (next deeper headings until a heading of <= level). */
    children: Section[];
}

const HEADING_RE = /^(#{1,6})\s+(.+?)\s*$/;

/**
 * Parse markdown into a section tree. Tolerant of the 5.1/5.2 heading quirks:
 * emphasis inside headings ("## **Soldier**") is stripped in `title`, and the
 * tree is built purely from hash depth — callers that need to be depth-agnostic
 * (5.2 class features at ### or ####) should use `walk` and match on title text.
 */
export function sectionize(md: string): Section[] {
    const lines = md.split("\n");
    const flat: Section[] = [];
    let current: { level: number; title: string; rawTitle: string; start: number; bodyLines: string[] } | null = null;
    const preamble: string[] = [];

    const push = () => {
        if (current) {
            flat.push({ ...current, body: current.bodyLines.join("\n").trim(), children: [] });
            current = null;
        }
    };

    for (let i = 0; i < lines.length; i++) {
        const m = lines[i].match(HEADING_RE);
        if (m) {
            push();
            current = { level: m[1].length, title: cleanTitle(m[2]), rawTitle: m[2], start: i, bodyLines: [] };
        } else if (current) {
            current.bodyLines.push(lines[i]);
        } else {
            preamble.push(lines[i]);
        }
    }
    push();

    // build tree
    const root: Section[] = [];
    const stack: Section[] = [];
    for (const s of flat) {
        while (stack.length && stack[stack.length - 1].level >= s.level) stack.pop();
        if (stack.length) stack[stack.length - 1].children.push(s);
        else root.push(s);
        stack.push(s);
    }
    return root;
}

/** Depth-first walk over a section tree. */
export function* walk(sections: Section[]): Generator<Section> {
    for (const s of sections) {
        yield s;
        yield* walk(s.children);
    }
}

/** Full text of a section including its children's headings/bodies (for prose descriptions). */
export function sectionText(s: Section, includeChildHeadings = true): string {
    let out = s.body;
    for (const c of s.children) {
        const head = includeChildHeadings ? `${c.title}. ` : "";
        out += (out ? "\n" : "") + head + sectionText(c, includeChildHeadings);
    }
    return out.trim();
}
