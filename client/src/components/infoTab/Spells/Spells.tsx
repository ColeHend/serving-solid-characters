import { Component, For, Show, createMemo, createSignal, useContext } from "solid-js";
import styles from "./Spells.module.scss";
import useStyle from "../../../shared/customHooks/utility/style/styleHook";
import useDnDSpells from "../../../shared/customHooks/dndInfo/srdinfo/useDnDSpells";
import TableRow from "./TableRow/tableRow";
import Paginator from "../../../shared/components/paginator/paginator";
import { Spell } from "../../../models/spell.model";
import SearchBar from "./searchBar/searchBar";
import useGetSpells from "../../../shared/customHooks/data/useGetSpells";
import { useSearchParams } from "@solidjs/router";
import { effect } from "solid-js/web";
import { SharedHookContext } from "../../rootApp";
import useStyles from "../../../shared/customHooks/utility/style/styleHook";
import getUserSettings from "../../../shared/customHooks/userSettings";

const masterSpells: Component = () => {
    const sharedHooks = useContext(SharedHookContext);
    const [userSettings, setUserSettings] = getUserSettings();
    const stylin = createMemo(()=>useStyles(userSettings().theme));
    const dndSrdSpells = useGetSpells();

    // search param stuff

    const [searchParam, setSearchParam] = useSearchParams();
    if (!!!searchParam.name) setSearchParam({name: dndSrdSpells()[0]?.name});
    const selectedSpell = dndSrdSpells().filter(x=>x.name.toLowerCase() === (searchParam.name || dndSrdSpells()[0].name).toLowerCase())[0];
    const [currentSpell,setCurrentSpell] = createSignal<Spell>(selectedSpell);
    
    //-------------

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

    effect(()=>{
        setSearchParam({name: currentSpell()?.name ?? ""})
    })

    return (
        <div class={`${stylin()?.primary} ${styles.SpellsBody}`}>
            <h1>Spells</h1>

            <SearchBar searchResults={searchResults} setSearchResults={setSearchResults} spellsSrd={dndSrdSpells}></SearchBar>

            <table class={`${stylin()?.table}`}>
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
                                    <button onClick={() => 
                                        {
                                            toggleRow(i());
                                            setCurrentSpell(()=>spell);
                                        }}>
                                        {hasIndex(i()) ? "↑" : "↓"}
                                    </button>
                                </td>
                            </tr>
                            <Show when={hasIndex(i())} >
                                <TableRow spell={currentSpell()}></TableRow>
                            </Show>
                            <hr />
                        </>
                    }</For>
                </tbody>
            </table>
            <div>
            <Paginator items={searchResults} setPaginatedItems={setPaginatedSpells}></Paginator>
            </div>
        </div>
    )
}
export default masterSpells;