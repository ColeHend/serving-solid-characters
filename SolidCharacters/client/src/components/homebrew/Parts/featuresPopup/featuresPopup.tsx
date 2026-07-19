import { FormArray, FormGroup, Modal, TabBar } from "coles-solid-library";
import { Accessor, Component, Match, Switch, createEffect, createMemo, createSignal, on, onCleanup, untrack } from "solid-js";
import { MadType } from "../../../../shared/customHooks/mads/madModels";
import { FeatureDetail, FeatureMetadata, MadPrerequisite } from "../../../../models/generated";
import { MadForm, MadPrereqForm } from "../../../../models/data/formModels";
import { useDnDSpells } from "../../../../shared/customHooks/dndInfo/info/all/spells";
import { useDnDItems } from "../../../../shared/customHooks/dndInfo/info/all/items";
import { useDndFeature } from "../../../../shared/customHooks/dndInfo/useDndFeatures";
import { useDnDFeats } from "../../../../shared/customHooks/dndInfo/info/all/feats";
import { PopupHeader } from "./popupHeader";
import { PopupFooter } from "./popupFooter";
import { DetailsTab } from "./detailsTab";
import { UsageSpellsTab } from "./usageSpellsTab";
import { EffectsTab } from "./effectsTab";
import { FeaturesPopupProps, MadsApi, buildSubtitle, splitCommand, usageOwnedIndices } from "./featuresPopup.shared";
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

    const is_edit = createMemo(() => props.isEdit());
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

    const save = () => {
        const name = getFeatureValue("name")?.() ?? "";
        const desc = getFeatureValue("description")?.() ?? "";

        const madsData = currentFeatureMetadata.get().flatMap(metadata => {
            return {
                command: metadata.command,
                value: metadata.value,
                type: metadata.type,
                prerequisites: metadata.prerequisites,
                group: metadata.group
            }
        });

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
        setEditorOpen({});
        setActiveTab(0);
    }

    const cancel = () => {
        clearInputs();
        setShow(false);
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

    return <Modal noHeader show={[show, setShow]} title={title()} width="min(700px, 94vw)">
        <div class={styles.wrapper} ref={(e) => setPopupRef(e)}>
            <PopupHeader
                title={title()}
                subtitle={buildSubtitle(props.context, featureCategory())}
                onClose={cancel}
            />

            <div class={styles.tabsRow}>
                <TabBar
                    tabs={["Details", "Usage & spells", `Effects (${effectCount()})`]}
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
                </Switch>
            </div>

            <PopupFooter effectCount={effectCount()} onCancel={cancel} onSave={save} />
        </div>
    </Modal>
}
