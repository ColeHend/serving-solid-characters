import { Component, For, Show, createSignal } from "solid-js";
import styles from "./Spells.module.scss";
import useStyle from "../../../customHooks/utility/style/styleHook";
import useDnDSpells from "../../../customHooks/dndInfo/srdinfo/useDnDSpells";
import { effect } from "solid-js/web";
import TableRow from "./TableRow/tableRow";
import Paginator from "../../shared/paginator/paginator";
import { Spell } from "../../../models/spell.model";
import SearchBar from "./searchBar/searchBar";

const masterSpells: Component = () => {
    const stylin = useStyle();
    const dndSrdSpells = useDnDSpells();

    const [RowShown, SetRowShown] = createSignal<number[]>([]);
    const [paginatedSpells, setPaginatedSpells] = createSignal<Spell[]>([]);

    const [searchResults, setSearchResults] = createSignal<any[]>([]);
    const toggleRow = (index: number) => !hasIndex(index) ? SetRowShown([...RowShown(), index]) : SetRowShown(RowShown().filter(i => i !== index));
    const hasIndex = (index: number) => RowShown().includes(index);
    const spellLevel = (spellLevel: string) => { 
        switch(spellLevel){
            case "0":
                return "Cantrip";
            case "1":
                return "1st";
            case "2":
                return "2nd";
            case "3":
                return "3rd";
            default:
                return `${spellLevel}th`;
        }
    }

    return (
        <div class={`${stylin.accent} ${styles.SpellsBody}`}>
            <h1>Spells</h1>

            <SearchBar searchResults={searchResults} setSearchResults={setSearchResults} spellsSrd={dndSrdSpells}></SearchBar>

            <table class={`${stylin.table}`}>
                <tbody>
                    <For each={paginatedSpells()}>{(spell, i) =>
                        <>
                            <tr class={`${styles.TableRow}`}>
                                <td class={styles.headerBar}>
                                    {/* left side */}
                                    <span>
                                        <span>{spell.name}</span>
                                        <span><i>{spell.school}</i></span>
                                        <Show when={spell.concentration}><span><i>{spell.duration}</i></span></Show>
                                         
                                    </span>

                                    {/* ride side */}
                                    <span>
                                        {spellLevel(spell.level)}
                                    </span>
                                     
                                </td>
                                <td>
                                    <button onClick={() => toggleRow(i())}>
                                        {hasIndex(i()) ? "↑" : "↓"}
                                    </button>
                                </td>
                            </tr>
                            <Show when={hasIndex(i())} >
                                <TableRow spell={spell}></TableRow>
                            </Show>
                            <hr />
                        </>
                    }</For>
                </tbody>
            </table>
            <div id="pagginator">
            <Paginator items={searchResults} setPaginatedItems={setPaginatedSpells}></Paginator>
            </div>
        </div>
    )
}
export default masterSpells;