/** Pick-CSV helpers shared by the choice-picker controls (MadChoiceControl, OptionChoiceControl). */

export const csvPicks = (raw: string | undefined): string[] =>
  (raw ?? "").split(",").map((s) => s.trim()).filter(Boolean);

/** Toggle `value` in a CSV pick list capped at `max`; null = at the cap, ignore. */
export const toggleCsv = (raw: string | undefined, value: string, max: number): string | null => {
  const picks = csvPicks(raw);
  if (picks.includes(value)) return picks.filter((p) => p !== value).join(",");
  if (picks.length >= max) return null;
  return [...picks, value].join(",");
};
