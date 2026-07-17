import { expect, test } from "vitest";
import { render, screen } from "@solidjs/testing-library";
import { Route, Router } from "@solidjs/router";
import Create from "./create";

const renderPage = () =>
  render(() => (
    <Router>
      <Route path="/" component={Create} />
    </Router>
  ));

test("renders the codex shell with all ten sections", async () => {
  renderPage();
  for (const title of [
    "Class",
    "Species",
    "Background",
    "Abilities",
    "Skills",
    "Feats",
    "Spells",
    "Details & Story",
    "Items",
    "Review",
  ]) {
    expect(await screen.findByRole("heading", { name: title, level: 3 })).toBeTruthy();
  }
});

test("living sheet starts with an unnamed adventurer at level 0", async () => {
  renderPage();
  expect(await screen.findByText("Unnamed Adventurer")).toBeTruthy();
  expect(await screen.findByText("Level 0")).toBeTruthy();
  expect(await screen.findByText("✦ Living Sheet")).toBeTruthy();
});

test("shows the empty spell state and the grimoire trigger", async () => {
  renderPage();
  expect(await screen.findByText("No spells inscribed yet.")).toBeTruthy();
  expect(await screen.findByText("✦ Browse the Grimoire")).toBeTruthy();
});
