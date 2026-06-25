import { Component, Show, createSignal } from "solid-js";
import { Button, Icon } from "coles-solid-library";
import { Shield, Speed, Tune, Verified } from "coles-solid-library/icons";
import useClickOutside from "solid-click-outside";
import { aiAssistant } from "../../shared/customHooks/aiAssistant";
import getUserSettings, { saveUserSettings } from "../../shared/customHooks/userSettings";
import { DEFAULT_USAGE_LEVEL, UsageControlLevel, UserSettings } from "../../models/userSettings";
import { Clone } from "../../shared/customHooks/utility/tools/Tools";
import styles from "./SparkSidebar.module.scss";

const LEVELS: { value: UsageControlLevel; label: string; icon: string; blurb: string }[] = [
    { value: "low", label: "Low", icon: Speed, blurb: "Generate and preview" },
    { value: "medium", label: "Medium", icon: Tune, blurb: "Auto-retry a failed generation" },
    { value: "high", label: "High", icon: Verified, blurb: "Review before handing over" },
];

/**
 * Compact quick-picker for the usage control level (Low / Medium / High), sitting next to the mode
 * toggle in the sidebar footer. Only meaningful while generating, so it's shown in Homebrew mode.
 * Mirrors ModeMenu's upward custom popover (the coles Menu only opens downward, off-screen here).
 * Persists immediately (no settings-popup Save needed) since it's a session-level toggle.
 */
const UsageLevelMenu: Component = () => {
    const [open, setOpen] = createSignal(false);
    const [rootRef, setRootRef] = createSignal<HTMLDivElement>();
    const [userSettings] = getUserSettings();

    useClickOutside(rootRef, () => setOpen(false));

    const level = (): UsageControlLevel => userSettings().ai?.usageLevel ?? DEFAULT_USAGE_LEVEL;
    const current = () => LEVELS.find(l => l.value === level()) ?? LEVELS[0];

    const pick = (value: UsageControlLevel) => {
        const s = userSettings();
        const next = Clone({ ...s, ai: { ...(s.ai ?? {}), usageLevel: value } }) as UserSettings;
        saveUserSettings(next);   // updates the global signal AND persists to IndexedDB
        setOpen(false);
    };

    return (
        <div class={styles.modeMenu} ref={setRootRef}>
            <Show when={open()}>
                <div class={styles.modePopover} role="menu">
                    {LEVELS.map(l => (
                        <button type="button" class={styles.modeOption} role="menuitem" onClick={() => pick(l.value)}>
                            <Icon icon={l.icon} size="small" /> {l.label} — {l.blurb}
                        </button>
                    ))}
                </div>
            </Show>
            <Button
                transparent
                class={styles.modeTrigger}
                title={`Quality level: ${current().label} — ${current().blurb}. Click to change how much Spark checks generated content.`}
                onClick={() => setOpen(o => !o)}
            >
                <Icon icon={Shield} size="small" />
                {current().label}
            </Button>
        </div>
    );
};

export default UsageLevelMenu;
