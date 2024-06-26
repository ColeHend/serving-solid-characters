import { Accessor, Component, For, Match, Setter, Show, Switch, createSignal } from "solid-js";
import useDnDSpells from "../../../../customHooks/dndInfo/srdinfo/useDnDSpells";
import { Spell } from "../../../../models/spell.model";
import { effect } from "solid-js/web";
import { get } from "http";
import Chip from "./chip";
import useStyle from "../../../../customHooks/utility/style/styleHook";
import styles from "./searchBar.module.scss";
import ClearAllBtn from "./clearAllBtn";
import { beutifyChip } from "../../../../customHooks/utility/beautifyChip";
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
    const [ischecked, setIsChecked] = createSignal<boolean>(false);
    const [chipBar, setChipBar] = createSignal<Chip[]>([]);
    const [isOther, setIsOther] = createSignal<boolean>(false);
    const stylin = useStyle();

    const checkbox = document.getElementById("booleanCheckbox") as HTMLInputElement


    const spellSchools = [
        "Abjuration",
        "Conjuration",
        "Divination",
        "Enchantment",
        "Evocation",
        "Illusion",
        "Necromancy",
        "Transmutation"
    ]



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
                                return ` ${spellValue} `
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
        if (typeof props.spellsSrd()[0][searchKey() as keyof Spell] === 'boolean') {
            setSearchValue(`${ischecked()}`)
        }
    })

    effect(()=>{


        setChipBar((oldChips)=>!!searchChip().key ?[...oldChips, searchChip()] : oldChips);
        setSearchValue("");
        if (!!(document.getElementById("searchBar") as HTMLSelectElement)) {
            (document.getElementById("searchBar") as HTMLInputElement).value = "";
        }                                                                                          

    })
    

    const beutifyKey = (Key: string) => {
        switch (Key) { 
            case "name":
                return "Name";
            case "level":
                return "Level";
            case "school":
                return "School";
            case "castingTime":
                return "Casting Time";
            case "range":
                return "Range";
            case "duration":
                return "Duration";
            case "concentration":
                return "Conc";
            case "ritual":
                return "Ritual";
            case "damageType":
                return "Dmg Type";
            case "isMaterial":
                return "Material";
            case "isSomatic":
                return "Somatic";
            case "isVerbal":
                return "Verbal";
            case "classes":
                return "Classes";
            case "desc":
                return "Desc";
            case "subClasses":
                return "Subclasses";
            
        }
    }
    
    return (
        <div>
            <div class={`${styles.searchBar}`}>
                <SearchGlass onClick={()=>setSearchChip((old)=>({key: searchKey(), value: beutifyChip(searchValue())  }))}  />
                <span>
                        <select onChange={(e)=>setSearchKey(e.target.value)} id="chipDropdown">
                            <For each={Object.keys(props.spellsSrd()[0]).filter(x=> !["materials_Needed","higherLevel","page"].includes(x) )}>
                                {(key) => 
                                    <option value={key}>{beutifyKey(key)}</option>
                                }
                            </For>
                        </select>
                </span>
                <Switch>
                    <Match when={typeof props.spellsSrd()[0][searchKey() as keyof Spell] === "string"}>
                        <Switch fallback={
                            <input
                        id="searchBar"
                        onChange={(e) => setSearchValue(e.currentTarget.value)}
                        onKeyDown={(e) => {(e.key === "Enter") && setSearchChip((old)=>({key: searchKey(), value: beutifyChip(e.currentTarget.value)}))}}
                        placeholder="Search Spells..."
                        value={searchValue()}
                        type="text"
                        />

                        }>
                            <Match when={searchKey() === "school"}>
                                <select onChange={(e)=>setSearchValue(e.currentTarget.value)}>
                                    <For each={spellSchools}>
                                        {(school)=>
                                            <>
                                                <option value={school}>{school}</option>
                                                
                                            </>
                                        }
                                    </For>
                                </select>
                            </Match>
                            <Match when={searchKey() === "level"}>
                                <select onChange={(e)=>setSearchValue(e.currentTarget.value)}>
                                    <option value="0">0</option>
                                    <option value="1">1</option>
                                    <option value="2">2</option>
                                    <option value="3">3</option>
                                    <option value="4">4</option>
                                    <option value="5">5</option>
                                    <option value="6">6</option>
                                    <option value="7">7</option>
                                    <option value="8">8</option>
                                    <option value="9">9</option>
                                </select>
                            </Match>
                        </Switch>

                        
                    </Match>
                    <Match when={Array.isArray(props.spellsSrd()[0][searchKey() as keyof Spell])}>
                        <input
                        id="searchBar"
                        onChange={(e) => setSearchValue(e.currentTarget.value)}
                        onKeyDown={(e) => {(e.key === "Enter") && setSearchChip((old)=>({key: searchKey(), value: beutifyChip(e.currentTarget.value) }))}}
                        placeholder="Search Spells..."
                        value={searchValue()}
                        type="text"
                        />
                        
                        
                    </Match>
                    <Match when={typeof props.spellsSrd()[0][searchKey() as keyof Spell] === "boolean"}>
                        <div class={`${styles.booleanSelect}`} id="booleanBar">
                            <span>
                                <label for="falsebox">
                                    <Show when={ischecked() === false}>
                                        false
                                    </Show>
                                    <Show when={ischecked() === true}>
                                        true
                                    </Show>
                                </label>
                                <input type="checkbox" checked={ischecked()} id="booleanCheckbox" onchange={()=>{
                                    setIsChecked(!ischecked())
                                    setSearchValue(`${ischecked()}`)
                                }}/>
                            </span>
                        </div>
                    </Match>
                </Switch>
               

            </div>
            <Show when={chipBar().length > 0}>
                <div class={`${styles.chipBar}`}>
                    <ClearAllBtn clear={()=>setChipBar([])} />

                    <For each={chipBar()}>
                        {(chip, i) => <Chip key={beutifyKey(chip.key) ?? '' } value={chip.value} clear={()=>setChipBar((oldChipBar)=>oldChipBar.filter((x, index) => index !== i() ))}/>}
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