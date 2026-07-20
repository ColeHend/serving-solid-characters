import { Accessor, Component, For, Show, createMemo, createSignal } from "solid-js";
import { Button, Checkbox, Chip, FormField, Input } from "coles-solid-library";
import { Spell } from "../../../../../../models/generated";
import { createTableFilter } from "../../../../../../shared/customHooks/utility/tools/tableFilter";
import { FilterDialog } from "../../../../../../shared/components/filterDialog/filterDialog";
import { FilterChips } from "../../../../../../shared/components/filterDialog/filterChips";
import {
    filterSelectionsFromValue,
    filterSpellsForChoice,
    hasDerivedSpellPool,
    serializeSpellFilter,
    spellFilterFields,
} from "../../../../../../shared/customHooks/mads/spellChoiceFilters";
import { SpellPickerDialog } from "./spellPickerDialog";
import styles from './spellFeature.module.scss';

interface SpellFeatureProps {
    allSpells: Accessor<Spell[]>;
    getValue: Accessor<Record<string, string> | undefined>;
    /** Enables the "player chooses from a list" form (AddSpells only). */
    allowChoice?: boolean;
    commit: (value: Record<string, string>) => void;
}

/**
 * Value editor for AddSpells/RemoveSpells. Specific mode picks one spell ({ID}); choice mode
 * (AddSpells only) builds the list the player later picks from — catalog filters
 * ({filterLevel, filterClass, ...}) and/or a bare spellLevel and/or explicit spells
 * ({options}), unioned at pick time. The search + spell table lives in SpellPickerDialog.
 */
export const SpellFeature: Component<SpellFeatureProps> = (props) => {
    const madValue = createMemo(() => props.getValue());
    const getMadValue = (key: string) => madValue()?.[key] ?? "";

    const storedId = getMadValue("ID");
    const [isChoice, setIsChoice] = createSignal(storedId === "choice");
    const [localID, setLocalID] = createSignal(storedId === "choice" ? "" : storedId);
    const [explicitIds, setExplicitIds] = createSignal<string[]>(
        getMadValue("options").split(",").map(s => s.trim()).filter(Boolean));
    const [count, setCount] = createSignal(+(getMadValue("count") || "1") || 1);
    const [spellLevel, setSpellLevel] = createSignal(getMadValue("spellLevel"));
    const [showFilter, setShowFilter] = createSignal(false);
    const [showPicker, setShowPicker] = createSignal(false);

    const filter = createTableFilter<Spell>({ source: props.allSpells, fields: spellFilterFields });
    // Seed the filter from the stored command once, on mount.
    for (const [key, values] of Object.entries(filterSelectionsFromValue(madValue()))) {
        filter.setFieldValues(key, values);
    }

    const getSpellByID = (id: string) => props.allSpells().find(spell => spell.id === id) ?? null;
    const spellName = (id: string) => getSpellByID(id)?.name ?? id;

    const isPicked = (id: string) => isChoice() ? explicitIds().includes(id) : localID() === id;
    const togglePick = (id: string) => {
        if (isChoice()) setExplicitIds(old => old.includes(id) ? old.filter(o => o !== id) : [...old, id]);
        else setLocalID(prev => prev === id ? "" : id);
    };

    const choiceFilterValue = createMemo(() => serializeSpellFilter(filter.selections()));
    // The exact value shape commit() will store — the preview MUST evaluate this, options
    // included, or it diverges from the pick-time pool (options-only choices derive nothing).
    const draftValue = createMemo(() => {
        const value: Record<string, string> = { ...choiceFilterValue() };
        const level = spellLevel().trim();
        if (level !== "") value["spellLevel"] = level;
        if (explicitIds().length) value["options"] = explicitIds().join(",");
        return value;
    });
    // Union of explicit picks and derived matches — the exact pool the creator picker builds.
    const poolCount = createMemo(() => {
        const ids = new Set(explicitIds().map(id => id.toLowerCase()));
        for (const spell of filterSpellsForChoice(props.allSpells(), draftValue())) {
            ids.add((spell.id ?? "").toLowerCase());
        }
        return ids.size;
    });
    const hasPool = createMemo(() => explicitIds().length > 0 || hasDerivedSpellPool(draftValue()));
    const canCommit = createMemo(() => isChoice() ? hasPool() : localID() !== "");

    const commit = () => {
        if (!isChoice()) {
            props.commit({ "ID": localID() });
            return;
        }
        props.commit({ "ID": "choice", "count": `${count()}`, ...draftValue() });
    };

    return <div class={styles.spellFeature}>
        <Show when={props.allowChoice}>
            <Checkbox
                label="Let the player choose from a list"
                checked={isChoice()}
                onChange={() => setIsChoice(v => !v)}
            />
        </Show>

        <Show when={isChoice()}>
            <div class={styles.filterRow}>
                <Button onClick={() => setShowFilter(true)}>Filter the list</Button>
                <Button onClick={() => setShowPicker(true)}>Add specific spells…</Button>
            </div>
            <span class={`${styles.pickerHint} ${hasPool() && poolCount() === 0 ? styles.warn : ""}`}>
                <Show when={hasPool()} fallback="No spells yet — filter the list and/or add specific spells the player picks from.">
                    <Show
                        when={poolCount() > 0}
                        fallback="0 spells match — players will have nothing to pick until a matching spell exists."
                    >
                        {`Players pick ${count()} of ${poolCount()} spells`}
                        {count() > poolCount() ? ` — only ${poolCount()} available so far` : ""}
                    </Show>
                </Show>
            </span>
            <FilterChips filter={filter} />
            <FilterDialog title="Allowed spells" show={[showFilter, setShowFilter]} filter={filter} />

            <div class={styles.chosenRow}>
                <Show
                    when={explicitIds().length}
                    fallback={<span class={styles.pickerHint}>Specific spells added here are always included, even outside the filters</span>}
                >
                    <For each={explicitIds()}>
                        {(id) => <Chip value={spellName(id)} remove={() => togglePick(id)} />}
                    </For>
                </Show>
            </div>

            <div class={styles.numberRow}>
                <FormField name="How many the player picks">
                    <Input
                        value={count()}
                        type="number"
                        min={1}
                        onChange={(e) => setCount(Math.max(1, +e.currentTarget.value || 1))}
                    />
                </FormField>
                <FormField name="Spell level (0 = cantrip)">
                    <Input
                        value={spellLevel()}
                        type="number"
                        min={0}
                        onChange={(e) => setSpellLevel(e.currentTarget.value)}
                    />
                </FormField>
            </div>
            <span class={styles.pickerHint}>
                Spell level restricts the list to that level (a Level filter overrides it) and keeps
                player picks separate — give each spell choice on the same feature a distinct level.
            </span>
        </Show>

        <Show when={!isChoice()}>
            <div class={styles.filterRow}>
                <Button onClick={() => setShowPicker(true)}>
                    {localID() ? "Change spell…" : "Choose spell…"}
                </Button>
                <Show when={localID()}>
                    <span class={styles.selectionSummary}>Selected: {spellName(localID())}</span>
                </Show>
            </div>
        </Show>

        <SpellPickerDialog
            show={[showPicker, setShowPicker]}
            allSpells={props.allSpells}
            multiple={isChoice()}
            isPicked={isPicked}
            onToggle={togglePick}
            selectedId={localID}
            title={isChoice() ? "Add specific spells" : "Choose a spell"}
            subtitle={isChoice() ? "Added spells are always in the player's list, even outside the filters" : ""}
            pickLabel={isChoice() ? "Add" : "Learn"}
            unpickLabel={isChoice() ? "Remove" : "Unlearn"}
        />

        <Button disabled={!canCommit()} onClick={commit}>Set Change</Button>
    </div>
}
