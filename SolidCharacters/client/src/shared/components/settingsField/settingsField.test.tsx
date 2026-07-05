// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@solidjs/testing-library";
import { SettingsField } from "./settingsField";

// Note: 'coles-solid-library' is aliased to the test mock, whose FormField is a passthrough that
// spreads `name` onto its wrapper — so we assert the label reaches FormField's `name` and that the
// child control + optional hint render.
describe("SettingsField", () => {
    it("wraps the child control in a FormField carrying the label as its name", () => {
        const { container } = render(() => (
            <SettingsField label="Provider">
                <input data-testid="child" />
            </SettingsField>
        ));
        expect(screen.getByTestId("child")).toBeTruthy();
        const formField = container.querySelector('[data-mock="FormField"]');
        expect(formField?.getAttribute("name")).toBe("Provider");
    });

    it("appends a required marker to the label", () => {
        const { container } = render(() => (
            <SettingsField label="Model" required>
                <input />
            </SettingsField>
        ));
        expect(container.querySelector('[data-mock="FormField"]')?.getAttribute("name")).toBe("Model *");
    });

    it("renders the hint when provided", () => {
        render(() => (
            <SettingsField label="Base URL" hint="e.g. http://localhost:11434">
                <input />
            </SettingsField>
        ));
        expect(screen.getByText("e.g. http://localhost:11434")).toBeTruthy();
    });

    it("omits the hint when not provided", () => {
        render(() => (
            <SettingsField label="Model">
                <input data-testid="child" />
            </SettingsField>
        ));
        // Only the child is present; no hint text node beyond it.
        expect(screen.queryByText(/e\.g\./)).toBeNull();
    });
});
