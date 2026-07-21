import { Accessor } from "solid-js";
import { FormArray, FormGroup } from "coles-solid-library";
import { FeatureOption, OptionPrerequisite, OptionsConfig } from "../../../../../../models/generated";
import { MadForm } from "../../../../../../models/data/formModels";
import { MadType } from "../../../../../../shared/customHooks/mads/madModels";
import { MadsApi, isUnsetRow, splitCommand } from "../../featuresPopup.shared";

/**
 * Authoring state for one feature option (an Eldritch Invocation, Maneuver, Metamagic…).
 * Rows live in a Solid store so field edits keep the row's identity — the option cards
 * (and the text inputs inside them) survive keystrokes instead of remounting. The nested
 * effects FormArray is a class instance the store leaves unwrapped, mirroring how the
 * popup owns the feature-level mads FormArray.
 */
export interface OptionRow {
    /** Stable render key, unique per popup session. */
    key: number;
    name: string;
    description: string;
    /** Prerequisite fields kept as input strings; serialization validates/omits them. */
    minLevel: string;
    requiredFeature: string;
    prereqText: string;
    /** True for rows added this session — their card starts expanded. */
    fresh: boolean;
    mads: FormArray<MadForm>;
}

export interface OptionScalingRow {
    level: string;
    count: string;
}

/** Form state for optionsConfig; scalingRows beat the static count when any are valid. */
export interface OptionsConfigForm {
    label: string;
    count: string;
    scalingRows: OptionScalingRow[];
}

/** Narrow writer API the Options tab and cards mutate popup-owned option state through. */
export interface OptionsApi {
    rows: Accessor<OptionRow[]>;
    config: Accessor<OptionsConfigForm>;
    setConfig: (patch: Partial<OptionsConfigForm>) => void;
    addRow: () => void;
    removeRow: (key: number) => void;
    updateRow: (key: number, patch: Partial<Omit<OptionRow, "key" | "mads">>) => void;
    /** A MadsApi scoped to one option's nested effects FormArray. */
    madsApiFor: (row: OptionRow) => MadsApi;
}

let madRowSeq = 0;

/** A mads FormArray row, mirroring the popup's addMadRow seed. */
export function newMadFormGroup(init: Partial<MadForm> = {}): FormGroup<MadForm> {
    return new FormGroup<MadForm>({
        name: [init.name ?? `opt-row-${++madRowSeq}`, []],
        command: [init.command ?? "", []],
        value: [init.value ?? {}, []],
        type: [init.type ?? MadType.Character, []],
        prerequisites: [init.prerequisites ?? [], []],
        group: [init.group ?? 0, []],
        commandCategory: [init.commandCategory ?? "", []],
        commandType: [init.commandType ?? "Add", []],
    });
}

export function blankOptionRow(key: number): OptionRow {
    return {
        key,
        name: "",
        description: "",
        minLevel: "",
        requiredFeature: "",
        prereqText: "",
        fresh: true,
        mads: new FormArray<MadForm>([]),
    };
}

/** A stored option rebuilt into authoring state (stored command strings split for the editors). */
export function hydrateOptionRow(option: FeatureOption, key: number): OptionRow {
    const mads = new FormArray<MadForm>([]);
    (option.mads ?? []).forEach((mad) => {
        mads.add(newMadFormGroup({ ...mad, ...splitCommand(mad.command) }));
    });
    return {
        key,
        name: option.name ?? "",
        description: option.description ?? "",
        minLevel: option.prerequisites?.minLevel ? String(option.prerequisites.minLevel) : "",
        requiredFeature: option.prerequisites?.requiredFeature ?? "",
        prereqText: option.prerequisites?.text ?? "",
        fresh: false,
        mads,
    };
}

/**
 * Authoring rows serialized for metadata.options. Nameless rows are dropped (nothing to pick),
 * as are unset effect rows — the same rule the popup's save applies to feature mads. Commas
 * are squeezed out of names: the player's picks persist as a name CSV, so a comma would split
 * the pick in two.
 */
export function serializeOptionRows(rows: OptionRow[]): FeatureOption[] {
    return rows
        .filter((row) => row.name.trim())
        .map((row) => {
            const prereq: OptionPrerequisite = {};
            const minLevel = Number(row.minLevel);
            if (row.minLevel.trim() && Number.isFinite(minLevel) && minLevel >= 1) prereq.minLevel = Math.floor(minLevel);
            if (row.requiredFeature.trim()) prereq.requiredFeature = row.requiredFeature.trim();
            if (row.prereqText.trim()) prereq.text = row.prereqText.trim();
            return {
                name: row.name.replace(/,/g, " ").replace(/\s+/g, " ").trim(),
                description: row.description,
                prerequisites: Object.keys(prereq).length ? prereq : undefined,
                mads: row.mads.get().filter((mad) => !isUnsetRow(mad)).map((mad) => ({
                    command: mad.command,
                    value: mad.value,
                    type: mad.type,
                    prerequisites: mad.prerequisites ?? [],
                    group: mad.group,
                })),
            };
        });
}

/** "2:2,5:3" → editable rows; malformed pairs drop out. */
export function parseScalingRows(countScaling: string | undefined): OptionScalingRow[] {
    return (countScaling ?? "")
        .split(",")
        .map((pair) => pair.trim())
        .filter(Boolean)
        .map((pair) => {
            const [level, count] = pair.split(":");
            return { level: (level ?? "").trim(), count: (count ?? "").trim() };
        })
        .filter((row) => row.level && row.count);
}

/** Editable rows → the stored "level:count" string: valid pairs only, ascending by level. */
export function serializeScaling(rows: OptionScalingRow[]): string {
    return rows
        .map((row) => ({ level: Number(row.level), count: Number(row.count) }))
        .filter((row) => Number.isFinite(row.level) && row.level >= 1 && Number.isFinite(row.count) && row.count >= 0)
        .sort((a, b) => a.level - b.level)
        .map((row) => `${Math.floor(row.level)}:${Math.floor(row.count)}`)
        .join(",");
}

export function emptyOptionsConfigForm(): OptionsConfigForm {
    return { label: "", count: "", scalingRows: [] };
}

export function hydrateOptionsConfig(config: OptionsConfig | undefined): OptionsConfigForm {
    return {
        label: config?.label ?? "",
        count: config?.count ? String(config.count) : "",
        scalingRows: parseScalingRows(config?.countScaling),
    };
}

/** Form state → stored optionsConfig, or undefined when nothing meaningful was set. */
export function serializeOptionsConfig(form: OptionsConfigForm): OptionsConfig | undefined {
    const config: OptionsConfig = {};
    if (form.label.trim()) config.label = form.label.trim();
    const scaling = serializeScaling(form.scalingRows);
    if (scaling) {
        config.countScaling = scaling;
    } else {
        const count = Number(form.count);
        if (form.count.trim() && Number.isFinite(count) && count >= 1) config.count = Math.floor(count);
    }
    return Object.keys(config).length ? config : undefined;
}
