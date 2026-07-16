import { addTheme } from "coles-solid-library";

export type BaseMode = "dark" | "light";

export interface ThemeDefinition {
  /** Persisted in UserSettings.theme (IndexedDB) — keep stable. */
  id: string;
  /** Human-readable name shown in the settings Select. */
  label: string;
  /** What the library's addTheme receives (it clamps to these two anyway). */
  base: BaseMode;
  /** Value for body[data-theme-variant]; absent = plain base theme. */
  variant?: string;
}

export const THEMES: readonly ThemeDefinition[] = [
  { id: "dark",      label: "Dark",              base: "dark"  },
  { id: "light",     label: "Light",             base: "light" },
  { id: "arcane",    label: "Arcane (Dark)",     base: "dark",  variant: "arcane" },
  { id: "parchment", label: "Parchment (Light)", base: "light", variant: "parchment" },
];

/** Unknown/legacy ids (e.g. rootApp's initial 'default') fall back to dark — same as addTheme's clamp. */
export function getTheme(id: string | undefined): ThemeDefinition {
  return THEMES.find(t => t.id === id) ?? THEMES[0];
}

/** Single entry point: base mode via the library (data-theme), variant via our own attribute. */
export function applyTheme(id: string): void {
  const def = getTheme(id);
  addTheme(def.base);
  if (def.variant) document.body.setAttribute("data-theme-variant", def.variant);
  else document.body.removeAttribute("data-theme-variant");
}
