import { describe, expect, it, vi } from "vitest";
import { createRoot } from "solid-js";
import { createStore } from "solid-js/store";

vi.mock("../srd/classes", () => ({
  useGetSrdClasses: (version: string) => () => [{ name: `class-${version}` }],
}));
vi.mock("../homebrew/classes", () => ({
  useGetHombrewClasses: () => () => [{ name: "homebrew-class" }],
}));
vi.mock("../srd/backgrounds", () => ({
  useGetSrdBackgrounds: (version: string) => () => [{ name: `background-${version}` }],
}));
vi.mock("../homebrew/background", () => ({
  useGetHombrewBackgrounds: () => () => [],
}));
vi.mock("../../../userSettings", () => {
  const getUserSettings = () => [() => ({ dndSystem: "2014" })];
  return { default: getUserSettings, getUserSettings };
});

import { useDnDClasses } from "./classes";
import { useDnDBackgrounds } from "./backgrounds";

describe("aggregator overrideVersion", () => {
  it("a reactive getter (creator store pattern) switches the served dataset", () => {
    createRoot((dispose) => {
      const [state, setState] = createStore({ edition: "2024" });
      const editionOpt = {
        get overrideVersion() {
          return state.edition;
        },
      };
      const classes = useDnDClasses(editionOpt);
      const backgrounds = useDnDBackgrounds(editionOpt);

      expect(classes().map((c) => c.name)).toEqual(["class-2024", "homebrew-class"]);
      expect(backgrounds().map((b) => b.name)).toEqual(["background-2024"]);

      setState("edition", "2014");
      expect(classes().map((c) => c.name)).toEqual(["class-2014", "homebrew-class"]);
      expect(backgrounds().map((b) => b.name)).toEqual(["background-2014"]);
      dispose();
    });
  });

  it("falls back to the user's dndSystem without an override", () => {
    createRoot((dispose) => {
      expect(useDnDClasses()().map((c) => c.name)).toEqual(["class-2014", "homebrew-class"]);
      expect(useDnDBackgrounds()().map((b) => b.name)).toEqual(["background-2014"]);
      dispose();
    });
  });
});
