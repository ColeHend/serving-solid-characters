import { describe, it, expect, afterEach } from "vitest";
import { THEMES, getTheme, applyTheme } from "./themeRegistry";

// Note: coles-solid-library is aliased to the test mock, whose addTheme is a no-op —
// so these tests assert only the variant attribute this module owns, not data-theme.

describe("themeRegistry", () => {
  afterEach(() => {
    document.body.removeAttribute("data-theme-variant");
  });

  it("falls back to dark for unknown or legacy ids", () => {
    expect(getTheme("bogus").id).toBe("dark");
    expect(getTheme(undefined).id).toBe("dark");
    expect(getTheme("default").id).toBe("dark");
  });

  it("resolves every registered id to itself", () => {
    for (const t of THEMES) {
      expect(getTheme(t.id)).toBe(t);
    }
  });

  it("applyTheme sets data-theme-variant for variant themes", () => {
    applyTheme("arcane");
    expect(document.body.dataset.themeVariant).toBe("arcane");

    applyTheme("parchment");
    expect(document.body.dataset.themeVariant).toBe("parchment");
  });

  it("applyTheme removes data-theme-variant for the plain base themes", () => {
    applyTheme("arcane");
    applyTheme("light");
    expect(document.body.hasAttribute("data-theme-variant")).toBe(false);

    applyTheme("parchment");
    applyTheme("dark");
    expect(document.body.hasAttribute("data-theme-variant")).toBe(false);
  });
});
