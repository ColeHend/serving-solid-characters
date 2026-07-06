# srd-gen adversarial review record (July 2026)

Final state: **all four lenses PASS** (fresh Opus 4.8 reviewers each round; fixes always applied
to parsers/curated maps, never to output JSON; data regenerated + gates re-run after every fix).

## Rounds

**Round 1** — A Schema: PASS. D Integration: PASS. C MADS: correctness clean (0 invented/wrong of 377),
5 coverage misses → fixed (2014 Frost Brand / Staff of Fire / Staff of Frost resistances; 5×2024
AbilityCheck-advantage items; coverage.ts now scans magic items). B Fidelity: 9 defects → fixed
(Figurine of Wondrous Power truncation; Circle Spells L9→L3; Purity of Spirit promoted to L15;
versatile dice + thrown ranges preserved; Devotion Tenets/Oath Spells L1→L3; Grappler "STR:13 or
DEX:13"; Protection from Evil and Good duration; item descriptions added).

**Interim (user + dying-reviewer findings)** — real pre-existing API bug: property arrays served as
`[[]]` (Newtonsoft JArray → System.Text.Json) → fixed with `PrimitiveDictionaryConverter` on
`Item.Properties`. Item descriptions added: 2014 gear/tools/armor from the `***Item***.` prose runs,
2024 tools from their Ability/Utilize/Craft lines.

**Round 2** — A: PASS (converter verified vs built DLLs; 2 latent notes → hardened). D: PASS (live
HTTP incl. converter fix). C: correctness clean (385), 3 coverage misses → fixed (Cloak of the Bat,
Rod of Alertness, Weapon of Warning). B: all 8 round-1 fixes hold; 2 LOW desc defects → fixed
(table-caption debris on Scholar's Pack/Plate; merged-sibling paragraphs split for Healer's Kit,
Lanterns, Quiver, Portable Ram).

**Round 3** — A: PASS. D: PASS. C: PASS (392 commands, final consistency sweep: markdown-vs-corpus
grep agrees item-for-item; all uncommanded matches are justified skips). B: 1 defect → fixed
(Torch absorbed the `**Equipment Packs**` header; run parser now terminates at standalone bold headers).

**Round 4 (closure)** — B: PASS (Torch exact; zero `**` debris anywhere; 36/36 race traits +
24 item + 13 armor descs diffed exact; terminator proven zero-over-truncation).

## Accepted decisions / known follow-ups
- 2024 species keep `abilityBonusChoice` (matches served data + creation flow) even though 2024 rules
  put ASIs on backgrounds (`abilityOptions`) — potential double-count if both flows ever apply; the
  maintainer should pick one.
- Magic-item mads are **data-only**: the sheet doesn't scan items yet (equip/attune→apply is a follow-up).
- ASI mads use the +2-to-one-ability choice form (the +1/+1 split isn't representable).
- 2024 feats = 17 (the SRD 5.2 markdown's actual content; the old file's extra 3 aren't in the source).
- Level-scaling use counts encode the base amount; scaling stays in classSpecific.
- Pre-existing, out of scope: view.tsx items-table "Tags" cell reads `properties[0]` (always empty);
  2024 Dungeoneer's Pack "10\n\ndays" page-break artifact is faithful to the source.
