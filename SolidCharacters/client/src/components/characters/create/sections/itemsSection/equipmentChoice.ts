export type CoinKey = "pp" | "gp" | "ep" | "sp" | "cp";

export interface ParsedEquipmentChoice {
  items: string[];
  /** Embedded currency ("14 GP", "10 SP") in its native denomination. */
  coin: { key: CoinKey; amount: number } | null;
}

/** Split an equipment option string into item names and an embedded coin amount. */
export function parseEquipmentChoice(choice: string): ParsedEquipmentChoice {
  const match = choice.match(/(\d+)\s*(PP|GP|EP|SP|CP)\b/i);
  const coin = match ? { key: match[2].toLowerCase() as CoinKey, amount: Number(match[1]) } : null;
  const items = choice
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item && item !== match?.[0].trim());
  return { items, coin };
}
