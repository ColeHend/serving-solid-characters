import { Component, For, Show, createMemo, createSignal, useContext } from "solid-js";
import styles from "./Spells.module.scss";
import useStyle from "../../../shared/customHooks/utility/style/styleHook";
import useDnDSpells from "../../../shared/customHooks/dndInfo/srdinfo/useDnDSpells";
import Paginator from "../../../shared/components/paginator/paginator";
import { Spell } from "../../../models/spell.model";
import SearchBar from "./searchBar/searchBar";
import useGetSpells from "../../../shared/customHooks/data/useGetSpells";
import { useSearchParams } from "@solidjs/router";
import { effect } from "solid-js/web";
import { SharedHookContext } from "../../rootApp";
import useStyles from "../../../shared/customHooks/utility/style/styleHook";
import getUserSettings from "../../../shared/customHooks/userSettings";
import { ExpansionPanel } from "../../../shared/components";
import SpellModal from "../../../shared/components/modals/spellModal/spellModal.component";


const masterSpells: Component = () => {
    const sharedHooks = useContext(SharedHookContext);
    const [userSettings, setUserSettings] = getUserSettings();
    const stylin = createMemo(()=>useStyles(userSettings().theme));
    const dndSrdSpells = useGetSpells();
    let compArr:any[] = [];

    // search param stuff

    const [searchParam, setSearchParam] = useSearchParams();
    if (!!!searchParam.name) setSearchParam({name: dndSrdSpells()[0]?.name});
    const selectedSpell = dndSrdSpells().filter(x=>x.name?.toLowerCase() === (searchParam?.name || dndSrdSpells()[0]?.name).toLowerCase())[0];
    const [currentSpell,setCurrentSpell] = createSignal<Spell>(selectedSpell);
    
    //-------------

    const [paginatedSpells, setPaginatedSpells] = createSignal<Spell[]>([]);
    const [searchResults, setSearchResults] = createSignal<any[]>([]);
    const [showSpell,setShowSpell] = createSignal(false)

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
    

    const spellComponents = (spell:Spell) => {
        const components = []
        if(spell.isVerbal) components.push("V");
        if(spell.isSomatic) components.push("S");
        if(spell.isMaterial) components.push("M");
        if (!!spell.materials_Needed) {
            return [components.join(', '), spell.materials_Needed ?? null].join(', ')
        }
        return components.join(', ')
    }
    
    effect(()=>{
        setSearchParam({name: currentSpell()?.name ?? ""})
    })
    
    return (
        <div class={`${stylin()?.primary} ${styles.SpellsBody}`}>
            <h1>Spells</h1>

            <SearchBar searchResults={searchResults} setSearchResults={setSearchResults} spellsSrd={dndSrdSpells}></SearchBar>

            <ul>
                <For each={paginatedSpells()}>
                    {(spell, i)=>
                        <>
                            <Show when={!sharedHooks?.isMobile()}>
                                <ExpansionPanel startOpen={currentSpell().name === spell.name}>
                                    <div class={`${styles.headerBar}`}>
                                        <span>{spell.name}</span> <span>{spellLevel(spell.level)}</span>
                                    </div>
                                    <div class={`${styles.view}`}>
                                        <div>
                                            <h1>{spell.name}</h1>

                                            <h2>{spellLevel(spell.level)} {spell.school}</h2>

                                            <h2>Casting time: {spell.castingTime} </h2>

                                            <h2>Range: {spell.range} </h2>

                                            <h2>Component: {spellComponents(spell)}</h2>

                                            <h2>Duration: {spell.duration}</h2>

                                            <h2>Classes: {spell.classes.join(", ")}</h2>

                                            <h2>SubClasses: {spell.subClasses.join(", ")}</h2>

                                            <span>
                                                {spell.desc}
                                            </span>

                                            <Show when={!!spell.higherLevel}>
                                                <h4>At Higher Levels:  </h4> <span>{spell.higherLevel}</span>
                                            </Show>
                                        </div>
                                    </div>
                                </ExpansionPanel>
                            </Show>
                            <Show when={sharedHooks?.isMobile()}>
                                <div class={`${styles.headerBar}`}>
                                    <span onClick={()=>{
                                    setCurrentSpell(spell)
                                    setShowSpell(old=>!old);
                                    console.log("spell", spell);
                                    console.log("current spell", currentSpell());
                                    console.log("background click", showSpell());
                                    
                                    
                                    
                                }}>{spell.name}</span> <span>{spellLevel(spell.level)}</span>
                                </div>
                                
                                <hr />

                                <Show when={showSpell()}>
                                    <SpellModal spell={currentSpell} backgroundClick={[showSpell,setShowSpell]} />
                                </Show>
                            </Show>
                        </>
                    }
                </For>
            </ul>

            <div class={`${styles.center}`}>
                <Paginator items={searchResults} setPaginatedItems={setPaginatedSpells}></Paginator>
            </div>
        </div>
    )
}
export default masterSpells;