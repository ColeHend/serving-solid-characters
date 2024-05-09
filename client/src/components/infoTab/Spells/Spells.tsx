import { Component, For, Show, createSignal } from "solid-js";
import styles from "./Spells.module.scss";
import useStyle from "../../../customHooks/utility/style/styleHook";
import useDnDSpells from "../../../customHooks/dndInfo/useDnDSpells";
import { effect } from "solid-js/web";
import TableRow from "./TableRow/tableRow";

const masterSpells: Component = () => {
    const stylin = useStyle();
    const dndSrdSpells = useDnDSpells();

    const [RowShown, SetRowShown] = createSignal<number[]>([]);

    const toggleRow = (index: number) => !hasIndex(index) ? SetRowShown([...RowShown(), index]) : SetRowShown(RowShown().filter(i => i !== index));
    const hasIndex = (index: number) => RowShown().includes(index);

    return (
        <div class={`${stylin.accent} ${styles.SpellsBody}`}>
            <h1>Spells</h1>
            <table class={`${stylin.table}`}>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    <For each={dndSrdSpells()}>{(spell, i) =>
                        <>
                            <tr class={`${styles.TableRow}`}>
                                {spell.name}
                                <td>
                                    <button onClick={() => toggleRow(i())} >↓</button>
                                </td>
                            </tr>
                            <Show when={hasIndex(i())} >
                                <TableRow spell={spell}></TableRow>
                            </Show>
                            <br />
                            <hr style="width:65vw; margin-left:%;" />
                            <br />
                        </>


                        // <TableRow spell={spell}></TableRow>
                    }</For>
                </tbody>
            </table>
            <div id="pagginator">

            </div>
        </div>
    )
}
export default masterSpells;