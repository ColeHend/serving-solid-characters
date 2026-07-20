import { Accessor, Component, Setter, Show, createMemo, createSignal } from "solid-js";
import { Button, Cell, Column, FormField, Header, Input, Modal, Table } from "coles-solid-library";
import { Markdown } from "../../../../../../shared";
import { Spell } from "../../../../../../models/generated";
import { getScreenSize } from "../../../../../../shared/customHooks/utility/tools/getScreenSize";
import { PopupHeader } from "../../popupHeader";
import styles from "./spellPickerDialog.module.scss";

interface SpellPickerDialogProps {
    show: [Accessor<boolean>, Setter<boolean>];
    allSpells: Accessor<Spell[]>;
    /** Multi-pick (choice mode's always-include list) vs single-pick with a detail pane. */
    multiple: boolean;
    isPicked: (id: string) => boolean;
    onToggle: (id: string) => void;
    /** Single mode: the currently selected spell id, drives the detail pane. */
    selectedId?: Accessor<string>;
    title: string;
    subtitle?: string;
    pickLabel: string;
    unpickLabel: string;
}

/**
 * The spell search + table (and, single mode, the spell detail pane) behind a
 * nested modal so the effect editor's main form stays compact. Deliberately
 * shows ALL spells (search only, no choice filters) — explicit picks may sit
 * outside the choice's filters, they're always included in the player pool.
 * Dumb component: the parent owns every selection.
 */
export const SpellPickerDialog: Component<SpellPickerDialogProps> = (props) => {
    const columns = ["Spell Name", "Level", "School", "Actions"];
    const { screenSize } = getScreenSize();
    const [search, setSearch] = createSignal("");

    const tableSpells = createMemo(() => {
        const term = search().trim().toLowerCase();
        const all = props.allSpells();
        return term ? all.filter(spell => spell.name.toLowerCase().includes(term)) : all;
    });

    const detailSpell = createMemo(() => {
        const id = props.selectedId?.() ?? "";
        return id ? props.allSpells().find(spell => spell.id === id) ?? null : null;
    });

    return <Modal
        noHeader
        show={props.show}
        title={props.title}
        width={screenSize() === "large" ? "min(1000px, 92vw)" : "min(700px, 94vw)"}
        height="85vh"
    >
        <div class={styles.pickerDialog}>
            <PopupHeader
                title={props.title}
                subtitle={props.subtitle ?? ""}
                onClose={() => props.show[1](false)}
            />

            <FormField name="Search spells">
                <Input value={search()} onInput={(e) => setSearch(e.currentTarget.value)} />
            </FormField>

            <div class={styles.wrapper}>
                <div class={styles.spellList}>
                    <Table data={tableSpells} columns={columns} >
                        <Column name="Spell Name">
                            <Header>Spell Name</Header>
                            <Cell<Spell>>
                                {spell => spell.name}
                            </Cell>
                        </Column>
                        <Column name="Level">
                            <Header>Level</Header>
                            <Cell<Spell>>
                                {spell => spell.level}
                            </Cell>
                        </Column>
                        <Column name="School">
                            <Header>School</Header>
                            <Cell<Spell>>
                                {spell => spell.school}
                            </Cell>
                        </Column>
                        <Column name="Casting Time">
                            <Header>Casting Time</Header>
                            <Cell<Spell>>
                                {spell => spell.castingTime}
                            </Cell>
                        </Column>
                        <Column name="Range">
                            <Header>Range</Header>
                            <Cell<Spell>>
                                {spell => spell.range}
                            </Cell>
                        </Column>
                        <Column name="Components">
                            <Header>Components</Header>
                            <Cell<Spell>>
                                {spell => spell.components}
                            </Cell>
                        </Column>
                        <Column name="Duration">
                            <Header>Duration</Header>
                            <Cell<Spell>>
                                {spell => spell.duration}
                            </Cell>
                        </Column>
                        <Column name="Actions">
                            <Header>Actions</Header>
                            <Cell<Spell>>
                                {spell => (
                                    <Button type="button" onClick={() => props.onToggle(spell.id)}>
                                        {props.isPicked(spell.id) ? props.unpickLabel : props.pickLabel}
                                    </Button>
                                )}
                            </Cell>
                        </Column>
                    </Table>
                </div>
                <Show when={!props.multiple}>
                    <Show
                        when={detailSpell()}
                        fallback={<div class={styles.details}>Select a spell to see its details.</div>}
                    >
                        {(spell) => (
                            <div class={styles.details}>
                                <h2>{spell().name}</h2>

                                <h2>{spell().level} {spell().school}</h2>

                                <p><strong>Casting Time:</strong> {spell().castingTime}</p>

                                <p><strong>Range:</strong> {spell().range}</p>

                                <p><strong>Components:</strong> {spell().components}</p>

                                <p><strong>Duration:</strong> {spell().duration}</p>

                                <Markdown text={spell().description ?? "**No description available.**"} />
                            </div>
                        )}
                    </Show>
                </Show>
            </div>

            <div class={styles.footerRow}>
                <Button onClick={() => props.show[1](false)}>Done</Button>
            </div>
        </div>
    </Modal>
}
