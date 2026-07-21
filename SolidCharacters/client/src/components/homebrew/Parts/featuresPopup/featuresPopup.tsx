import { FormArray, FormGroup, Modal, TabBar } from "coles-solid-library";
import { Accessor, Component, Match, Switch, createEffect, createMemo, createSignal, on, onCleanup, untrack } from "solid-js";
import { createStore } from "solid-js/store";
import { MadType } from "../../../../shared/customHooks/mads/madModels";
import { FeatureDetail, FeatureMetadata, MadPrerequisite } from "../../../../models/generated";
import { MadForm, MadPrereqForm } from "../../../../models/data/formModels";
import { useDnDSpells } from "../../../../shared/customHooks/dndInfo/info/all/spells";
import { useDnDItems } from "../../../../shared/customHooks/dndInfo/info/all/items";
import { useDndFeature } from "../../../../shared/customHooks/dndInfo/useDndFeatures";
import { useDnDFeats } from "../../../../shared/customHooks/dndInfo/info/all/feats";
import { getScreenSize } from "../../../../shared/customHooks/utility/tools/getScreenSize";
import { PopupHeader } from "./popupHeader";
import { PopupFooter } from "./popupFooter";
import { DetailsTab } from "./detailsTab";
import { UsageSpellsTab } from "./usageSpellsTab";
import { EffectsTab } from "./effectsTab";
import { CloseGuardDialog, PendingClose } from "./closeGuardDialog";
import { FeaturesPopupProps, MadsApi, buildSubtitle, isUnsetRow, splitCommand, usageOwnedIndices } from "./featuresPopup.shared";
import { OptionsTab } from "./parts/optionsFeature/optionsTab";
import {
    OptionRow,
    OptionsApi,
    OptionsConfigForm,
    blankOptionRow,
    emptyOptionsConfigForm,
    hydrateOptionRow,
    hydrateOptionsConfig,
    newMadFormGroup,
    serializeOptionRows,
    serializeOptionsConfig,
} from "./parts/optionsFeature/optionsFeature.shared";
import styles from "./featuresPopup.module.scss";

export const FeaturesPopup: Component<FeaturesPopupProps> = (props) => {
    const [show, setShow] = props.Show;
    const [feature, setFeature] = createSignal<FeatureDetail | null>(null);
    const [popupRef, setPopupRef] = createSignal<HTMLElement | null>(null);
    const [prerequisites, setPrerequisites] = createSignal<Record<string, MadPrerequisite>>({});
    const [activeTab, setActiveTab] = createSignal(0);
    // Effect cards are recreated on every row write (see effectCard.tsx), so the
    // value editors' open/closed flags live here, keyed by the row's stable name.
    const [editorOpen, setEditorOpen] = createSignal<Record<string, boolean>>({});
    // Close intercepted by the unset-effects guard, awaiting confirmation.
    const [pendingClose, setPendingClose] = createSignal<PendingClose>(null);

    const is_edit = createMemo(() => props.isEdit());
    const { screenSize } = getScreenSize();
    const allSpells = useDnDSpells();
    const allItems = useDnDItems();
    const { allFeatures } = useDndFeature();
    const allFeats = useDnDFeats();

    const currentFeatureMetadata = new FormArray<MadForm>([]);
    const currentFeaturePrerequisites = new FormArray<MadPrereqForm>([]);

    let rowSeq = 0;
    const addMadRow = (init: Partial<MadForm> = {}) => {
        currentFeatureMetadata.add(new FormGroup<MadForm>({
            name: [init.name ?? `row-${++rowSeq}`, []],
            command: [init.command ?? "", []],
            value: [init.value ?? {}, []],
            type: [init.type ?? MadType.Character, []],
            prerequisites: [init.prerequisites ?? [], []],
            group: [init.group ?? 0, []],
            commandCategory: [init.commandCategory ?? "", []],
            commandType: [init.commandType ?? "Add", []],
        }));
    };

    const rows = createMemo(() => currentFeatureMetadata.get());
    // Rows owned by the Usage & spells tab don't count as effects.
    const effectCount = createMemo(() => rows().length - usageOwnedIndices(rows()).size);

    const setMadFeature = <T extends keyof MadForm>(key: T, index: number, value: MadForm[T]) => {
        currentFeatureMetadata.getGroup(index)?.set(key, value);
    };

    const api: MadsApi = {
        rows,
        setMadFeature,
        addMadRow,
        removeMad: (index) => currentFeatureMetadata.remove(index),
        isEditorOpen: (key) => !!editorOpen()[key],
        setEditorOpen: (key, open) => setEditorOpen(old => ({ ...old, [key]: open })),
    };

    // Feature options (named sub-picks). Rows live in a store so field edits keep row
    // identity — the option cards' inputs survive keystrokes instead of remounting.
    // Each row's nested effects FormArray is a class instance the store leaves unwrapped.
    const [optionState, setOptionState] = createStore<{ rows: OptionRow[] }>({ rows: [] });
    const [optionsConfig, setOptionsConfig] = createSignal<OptionsConfigForm>(emptyOptionsConfigForm());
    let optionSeq = 0;

    const optionsApi: OptionsApi = {
        rows: () => optionState.rows,
        config: optionsConfig,
        setConfig: (patch) => setOptionsConfig(old => ({ ...old, ...patch })),
        addRow: () => setOptionState("rows", optionState.rows.length, blankOptionRow(++optionSeq)),
        removeRow: (key) => setOptionState("rows", (rows) => rows.filter(row => row.key !== key)),
        updateRow: (key, patch) => {
            const index = optionState.rows.findIndex(row => row.key === key);
            if (index >= 0) setOptionState("rows", index, patch);
        },
        madsApiFor: (row) => ({
            rows: () => row.mads.get(),
            setMadFeature: (key, index, value) => row.mads.getGroup(index)?.set(key, value),
            addMadRow: (init = {}) => row.mads.add(newMadFormGroup(init)),
            removeMad: (index) => row.mads.remove(index),
            // Editor-open flags share the popup signal, prefixed so options can't collide
            // with the feature-level effect rows (or each other).
            isEditorOpen: (key) => !!editorOpen()[`opt${row.key}:${key}`],
            setEditorOpen: (key, open) => setEditorOpen(old => ({ ...old, [`opt${row.key}:${key}`]: open })),
        }),
    };

    const resetOptions = () => {
        setOptionState("rows", () => []);
        setOptionsConfig(emptyOptionsConfigForm());
    };

    const unsetCount = createMemo(() => rows().filter(isUnsetRow).length);

    const doSave = () => {
        const name = getFeatureValue("name")?.() ?? "";
        const desc = getFeatureValue("description")?.() ?? "";

        // Unset rows (no category / no value) do nothing on the sheet — drop them
        // rather than persisting junk mads with an empty command or value.
        const madsData = currentFeatureMetadata.get().filter(metadata => !isUnsetRow(metadata)).flatMap(metadata => {
            return {
                command: metadata.command,
                value: metadata.value,
                type: metadata.type,
                prerequisites: metadata.prerequisites,
                group: metadata.group
            }
        });

        // Options with no name have nothing to pick — dropped like unset effect rows.
        const optionsData = serializeOptionRows(optionState.rows);

        const current = feature();
        const newFeature: FeatureDetail = {
            id: current?.id ?? "",
            name: name,
            description: desc,
            choiceKey: current?.choiceKey || undefined,
            metadata: {
                uses: 0,
                recharge: "",
                spells: [],
                category: current?.metadata?.category ?? "",
                mads: madsData,
                options: optionsData.length ? optionsData : undefined,
                optionsConfig: optionsData.length ? serializeOptionsConfig(optionsConfig()) : undefined,
            }
        }

        setShow(false);
        if (props.onClose) {
            props.onClose(newFeature);
            clearInputs();
        }
    }

    const clearInputs = () => {
        setFeature(null);
        setPrerequisites({});
        currentFeatureMetadata.reset();
        resetOptions();
        setEditorOpen({});
        setPendingClose(null);
        setActiveTab(0);
    }

    const doCancel = () => {
        clearInputs();
        setShow(false);
    }

    // Closing with unset effects diverts to the guard dialog first.
    const save = () => unsetCount() > 0 ? setPendingClose("save") : doSave();
    const cancel = () => unsetCount() > 0 ? setPendingClose("cancel") : doCancel();

    // The library Modal's backdrop click and Escape close by writing show[1](false)
    // directly — route those through the same guard as the Cancel button. doCancel/
    // doSave call the raw setShow, so a confirmed close passes straight through.
    const guardedSetShow = ((value: boolean) => {
        if (value === false && show()) { cancel(); return; }
        setShow(value);
    }) as typeof setShow;

    const confirmClose = () => {
        const mode = pendingClose();
        setPendingClose(null);
        if (mode === "save") doSave();
        else if (mode === "cancel") doCancel();
    }

    const getFeatureValue = <T extends keyof FeatureDetail>(key: T): Accessor<FeatureDetail[T]> | null => {
        const Feature = feature();

        if (!Feature) return null;

        const clone = structuredClone(Feature);

        return createMemo(() => clone[key]);
    }

    const setFeatureValue = <T extends keyof FeatureDetail>(key: T, value: FeatureDetail[T]) => {
        const Feature = feature();

        if (!Feature) return;

        if (typeof value === "string") {
            Feature[key] = value;
        } else if (typeof value === "object" && key === "metadata") {
            const val: FeatureMetadata = value;

            Feature['metadata'] = val;
        }

        setFeature(structuredClone(Feature));
    }

    const featureName = createMemo(() => getFeatureValue("name")?.() ?? "");
    const featureDesc = createMemo(() => getFeatureValue("description")?.() ?? "");
    const featureCategory = createMemo(() => feature()?.metadata?.category ?? "");

    const setFeatureCategory = (category: string) => {
        const current = feature();
        if (!current) return;
        setFeatureValue("metadata", { ...(current.metadata ?? {}), category });
    }

    const fillForm = () => {
        const [parentFeature] = props.feature;

        setFeatureValue("id", parentFeature().id);
        setFeatureValue("choiceKey", parentFeature().choiceKey ?? "");
        setFeatureValue("name", parentFeature().name);
        setFeatureValue("description", parentFeature().description);
        setFeatureValue("metadata", parentFeature().metadata);

        const mads = parentFeature().metadata?.mads ?? [];

        // fillForm runs from a tracked effect: reading the FormArray while growing it
        // in tracking scope makes that effect depend on the array it mutates,
        // re-running until the script times out. Hydrate untracked, and reset first so a
        // re-fill replaces the rows instead of appending duplicates.
        untrack(() => {
            currentFeatureMetadata.reset();
            setEditorOpen({});
            mads.forEach((mad, index) => {
                // Split the stored command so the Add/Remove toggle, category select
                // and value editor all show the hydrated state.
                addMadRow({ ...mad, ...splitCommand(mad.command), name: `${index + 1}` });
            });
            setOptionState("rows", () => (parentFeature().metadata?.options ?? []).map(option => hydrateOptionRow(option, ++optionSeq)));
            setOptionsConfig(hydrateOptionsConfig(parentFeature().metadata?.optionsConfig));
        })
    }

    // Hydrate the internal form only when the PARENT feature changes. on() runs its
    // callback untracked, so the setFeature writes inside fillForm() can't re-trigger
    // this effect — that tracked read+write cycle was the "too much recursion" loop
    // on the edit path. Callers must pass a fresh object reference on every open
    // (openAddFeature/openEditFeature both do) or the hydration won't re-fire.
    createEffect(on(() => props.feature[0](), (parent) => {
        if (feature() === null) {
            setFeature({
                id: "",
                name: "",
                description: "",
                metadata: {
                    mads: [],
                }
            })
        }

        if (parent.name !== "") {
            fillForm()
        } else {
            // Add mode (blank feature): drop any rows left over from a previous edit.
            currentFeatureMetadata.reset();
            resetOptions();
        }
    }))

    // DOM-only side effects on the library modal chrome once it mounts: strip the
    // dialog's bottom padding, and turn its overflow:hidden boxes into clip.
    // hidden boxes are still programmatically scrollable — the Select dropdown's
    // focus/scrollIntoView scrolls the dialog itself, sticking the header out of
    // view with no scrollbar to recover. clip boxes cannot scroll at all.
    createEffect(() => {
        const popup = popupRef();
        if (!popup) return;
        const body = popup.parentElement;
        const dialog = body?.parentElement;
        if (body) {
            body.style.setProperty("overflow", "clip");
        }
        if (dialog) {
            dialog.style.setProperty("padding-bottom", "0", "important");
            dialog.style.setProperty("overflow", "clip");
        }
    })

    onCleanup(() => {
        clearInputs();
    })

    const title = () => `${is_edit() ? "Edit" : "Add"} Feature`;

    return <Modal
        noHeader
        show={[show, guardedSetShow]}
        title={title()}
        width={screenSize() === "large" ? "min(1120px, 92vw)" : "min(700px, 94vw)"}
        height={screenSize() === "small" ? "95vh" : "88vh"}
    >
        <div class={styles.wrapper} ref={(e) => setPopupRef(e)}>
            <PopupHeader
                title={title()}
                subtitle={buildSubtitle(props.context, featureCategory())}
                onClose={cancel}
            />

            <div class={styles.tabsRow}>
                <TabBar
                    tabs={["Details", "Usage & spells", `Effects (${effectCount()})`, `Options (${optionState.rows.length})`]}
                    activeTab={activeTab()}
                    onTabChange={(label, i) => setActiveTab(i)}
                    colors={{ indicator: "var(--pop-accent)", text: "var(--on-surface-color)" }}
                />
            </div>

            <div class={styles.scrollBody}>
                <Switch>
                    <Match when={activeTab() === 0}>
                        <DetailsTab
                            name={featureName}
                            category={featureCategory}
                            description={featureDesc}
                            onName={(v) => setFeatureValue("name", v)}
                            onCategory={setFeatureCategory}
                            onDescription={(v) => setFeatureValue("description", v)}
                        />
                    </Match>
                    <Match when={activeTab() === 1}>
                        <UsageSpellsTab api={api} allSpells={allSpells} />
                    </Match>
                    <Match when={activeTab() === 2}>
                        <EffectsTab
                            api={api}
                            data={{ allSpells, allItems, allFeatures, allFeats }}
                            prereqForm={currentFeaturePrerequisites}
                            prereqs={[prerequisites, setPrerequisites]}
                        />
                    </Match>
                    <Match when={activeTab() === 3}>
                        <OptionsTab
                            api={optionsApi}
                            data={{ allSpells, allItems, allFeatures, allFeats }}
                            prereqForm={currentFeaturePrerequisites}
                            prereqs={[prerequisites, setPrerequisites]}
                        />
                    </Match>
                </Switch>
            </div>

            <PopupFooter effectCount={effectCount()} onCancel={cancel} onSave={save} />

            <CloseGuardDialog
                pending={pendingClose}
                unsetCount={unsetCount}
                onKeepEditing={() => setPendingClose(null)}
                onConfirm={confirmClose}
            />
        </div>
    </Modal>
}
