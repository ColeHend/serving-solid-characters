import { Accessor, Component, For, Match, Setter, Show, Switch, createSignal } from "solid-js";
import useDnDSpells from "../../../../customHooks/dndInfo/useDnDSpells";
import { Spell } from "../../../../models/spell.model";
import { effect } from "solid-js/web";
import { get } from "http";
import Chip from "./chip";
import useStyle from "../../../../customHooks/utility/style/styleHook";
import styles from "./searchBar.module.scss";
import ClearAllBtn from "./clearAllBtn";
interface Chip {
    key: string;
    value: string;
    
}

type Props = {
    searchResults: Accessor<any[]>;
    setSearchResults: Setter<any[]>;
    spellsSrd: Accessor<Spell[]>;
};
const SearchBar: Component<Props> = (props) => {
    const [searchChip, setSearchChip] = createSignal<Chip>({ key: "", value: "" });
    const [searchKey, setSearchKey] = createSignal<string>("name");
    const [searchValue, setSearchValue] = createSignal<string>("");
    const [chipBar, setChipBar] = createSignal<Chip[]>([]);
    const stylin = useStyle();

    effect(() => {
        props.setSearchResults(props.spellsSrd().filter((spell: Spell) => {
            if (!!spell && chipBar().length > 0){
                const chipValueCheck = chipBar().map((chippy) => {
                    const spellValue = spell[chippy.key as keyof Spell];
                    
                    if (!!spellValue) {
                        switch (true) {
                            case typeof spellValue === "string":           
                                return spellValue
                                    .toLowerCase()
                                    .includes(chippy.value.toLowerCase());
                            case Array.isArray(spellValue):

                                return spellValue
                                    .join(" ")
                                    .toLowerCase()
                                    .includes(chippy.value.toLowerCase());
                            case typeof spellValue === "boolean":
                                return spellValue
                                    .toString()
                                    .toLowerCase()
                                    .includes(chippy.value.toLowerCase());
                        }
                    }
                    return false;
                });
                
                return !chipValueCheck.includes(false);
            }
            return true;
        }));
    });

    effect(()=>{
        setChipBar((oldChips)=>!!searchChip().key ?[...oldChips, searchChip()] : oldChips);
        setSearchValue("");
        if (!!(document.getElementById("searchBar") as HTMLSelectElement)) {
            (document.getElementById("searchBar") as HTMLInputElement).value = "";
        }

    })

    

    return (
        <div>
            <div class={`${styles.searchBar}`}>
                <SearchGlass onClick={()=>setSearchChip((old)=>({key: searchKey(), value: searchValue() }))}  />
                <span>
                        <select onChange={(e)=>setSearchKey(e.target.value)} id="chipDropdown">
                            <For each={Object.keys(props.spellsSrd()[0])}>
                                {(key) => 
                                    <option value={key}>{key}</option>
                                }
                            </For>
                        </select>
                </span>
                <input
                    id="searchBar"
                    onChange={(e) => setSearchValue(e.currentTarget.value)}
                    onKeyDown={(e) => {(e.key === "Enter") && setSearchChip((old)=>({key: searchKey(), value: e.currentTarget.value }))}}
                    placeholder="Search Spells..."
                    value={searchValue()}
                    type="text"
                />

            </div>
            <Show when={chipBar().length > 0}>
                <div class={`${styles.chipBar}`}>
                    <ClearAllBtn clear={()=>setChipBar([])} />

                    <For each={chipBar()}>
                        {(chip, i) => <Chip key={chip.key} value={chip.value} clear={()=>setChipBar((oldChipBar)=>oldChipBar.filter((x, index) => index !== i() ))}/>}
                    </For>
                </div>
            </Show>
        </div>
    );
};
export default SearchBar;

type SProps = {
    [key: string]: any;
}
const SearchGlass: Component<SProps> = (props)=>{
    return <>
    <svg {...props} xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="100" height="100" viewBox="0 0 50 50">
<path d="M 21 3 C 11.621094 3 4 10.621094 4 20 C 4 29.378906 11.621094 37 21 37 C 24.710938 37 28.140625 35.804688 30.9375 33.78125 L 44.09375 46.90625 L 46.90625 44.09375 L 33.90625 31.0625 C 36.460938 28.085938 38 24.222656 38 20 C 38 10.621094 30.378906 3 21 3 Z M 21 5 C 29.296875 5 36 11.703125 36 20 C 36 28.296875 29.296875 35 21 35 C 12.703125 35 6 28.296875 6 20 C 6 11.703125 12.703125 5 21 5 Z"></path>
</svg></>
}