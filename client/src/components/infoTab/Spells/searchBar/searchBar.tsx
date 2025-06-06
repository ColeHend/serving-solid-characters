import { Accessor, Component, For, Match, Setter, Show, Switch, createEffect, createSignal } from "solid-js";
import { Spell } from "../../../../models/old/spell.model";
import styles from "./searchBar.module.scss";
import { beutifyChip } from "../../../../shared/customHooks/utility/tools/beautifyChip";
import { Button, Input, Select, Option } from "../../../../shared/components";
import Chipbar from "../../../../shared/components/Chipbar/chipbar";
import type ChipType from "../../../../shared/models/chip";

type Props = { 
    searchResults: Accessor<Spell[]>; 
    setSearchResults: Setter<Spell[]>;
    spellsSrd: Accessor<Spell[]>;
};
const SearchBar: Component<Props> = (props) => {
  const [searchChip, setSearchChip] = createSignal<ChipType>({ key: "", value: "" });
  const [searchKey, setSearchKey] = createSignal<string>("name");
  const [searchValue, setSearchValue] = createSignal<string>("");
  const [ischecked, setIsChecked] = createSignal<boolean>(false);
  const [chipBar, setChipBar] = createSignal<ChipType[]>([]);

  const getKeyOptions = (key: keyof Spell): string[] => {
    if (Array.isArray(props.spellsSrd()[0][key])) {
      const daVal = !!props.spellsSrd()[0][key] && Array.isArray(props.spellsSrd()[0][key]) ? (props.spellsSrd()[0][key] as string[])[0] : null;
      if (typeof daVal === 'string') {
        const allValues = props.spellsSrd().flatMap(x=> {
          if (x[key]?.toString().includes(',')) {
            return x[key]?.toString().split(',');
          } else {
            return x[key]?.toString();
          }
        }) as string[];
                
        return ([...new Set<string>(allValues)]).sort().filter(x=>!!x);
      } else {
        return [...new Set<string>(...props.spellsSrd().flatMap(x=> Array.isArray(x[key]) ? x[key] : []))].sort().filter(x=>!!x);
      }
    }
    const theSet = new Set<string>();
    props.spellsSrd().map(x=> !!x[key] && !Array.isArray(x[key]) ? x[key] : '').map(x=>theSet.add(`${x}`));
    return [...theSet].sort().filter(x=>!!x);
  }

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

  createEffect(() => {
    props.setSearchResults(props.spellsSrd().filter((spell: Spell) => {
      if (!!spell && chipBar().length > 0){
        const keyTypes = [...new Set<string>(chipBar().map(x=>x.key))]
        const keyGroups = keyTypes.map(x=>chipBar().filter(y=>y.key === x));
        const keyChecks = keyGroups.map(group => group.map(x=> {
          const spellValue = spell[x.key as keyof Spell];
          if (spellValue) {
            switch (true) {
            case typeof spellValue === "string":           
              return spellValue
                .toLowerCase()
                .includes(x.value.toLowerCase());
            case Array.isArray(spellValue):

              return spellValue
                .join(" ")
                .toLowerCase()
                .includes(x.value.toLowerCase());
            case typeof spellValue === "boolean":
              return ` ${spellValue} `
                .toLowerCase()
                .includes(x.value.toLowerCase());
            }
          }
          return false;
        }))
        const chipValueCheck = keyChecks.map(x=>x.includes(true))
                
        return !chipValueCheck.includes(false);
      }
      return true;
    }));
  });

  createEffect(()=>{
    if (props.spellsSrd().length > 0) {
      if (typeof props.spellsSrd()[0][searchKey() as keyof Spell] === 'boolean') {
        setSearchValue(`${ischecked()}`)
      }
    }
  })

  createEffect(()=>{
    setChipBar((oldChips)=>searchChip().key ?[...oldChips, searchChip()] : oldChips);
    setSearchValue("");
    if (document.getElementById("searchBar") as HTMLSelectElement) {
      (document.getElementById("searchBar") as HTMLInputElement).value = "";
    }                                                                                          
  })
    

  const beautifyKey = (Key: string) => {
    if (Key === "concentration") return "Conc";
    if (Key === "damageType") return "Dmg Type";
    const fixupString = (str: string) => (str.charAt(0).toUpperCase() + str.slice(1)).replace(/([A-Z])/g, ' $1').trim();
    return Key.startsWith("is") ? fixupString(Key.replace("is", "")): fixupString(Key);
  }

  const getFirstSpell = ()=> props.spellsSrd().length > 0 ? props.spellsSrd()[0] : {} as Spell
    
  return (
    <div class={`${styles.overall}`}>
      <div class={`${styles.searchBar}`}>
        <Button transparent={true} onClick={()=>setSearchChip(()=>({key: searchKey(), value: beutifyChip(searchValue())  }))} >
          <SearchGlass />
        </Button>
        <Select transparent class={`${styles.all}`} value={searchKey()} onChange={(e)=>setSearchKey(e)} id="chipDropdown">
          <For each={Object.keys(getFirstSpell()).filter(x=> !["materials_Needed","higherLevel","page"].includes(x) )}>{(key) => 
            <Option value={key}>{beautifyKey(key)}</Option>
          }</For>
        </Select>
        <Switch>
          <Match when={Array.isArray(getFirstSpell()[searchKey() as keyof Spell]) || ['damageType', 'castingTime', 'range', 'duration'].includes(searchKey())}>
            <Select transparent value={searchValue()} onChange={(e) => setSearchValue(e)}>
              <For each={getKeyOptions(searchKey() as keyof Spell)}>
                {(option)=>
                  <Option value={option}>{option}</Option>
                }
              </For>
            </Select>
          </Match>
          <Match when={typeof getFirstSpell()[searchKey() as keyof Spell] === "boolean"}>
            <div class={`${styles.booleanSelect}`} id="booleanBar">
              <Input type="checkbox" checked={ischecked()} id="booleanCheckbox" onchange={()=>{
                setIsChecked(!ischecked())
                setSearchValue(`${ischecked()}`)
              }}/>
              <label for="falsebox">
                <Show when={!ischecked()}>
                                    false
                </Show>
                <Show when={ischecked()}>
                                    true
                </Show>
              </label>
            </div>
          </Match>
          <Match when={typeof getFirstSpell()[searchKey() as keyof Spell] === "string"}>
            <Switch fallback={
              <Input
                id="searchBar"
                onChange={(e) => setSearchValue(e.currentTarget.value)}
                onKeyDown={(e) => {
                  return (e.key === "Enter") && setSearchChip(()=>({key: searchKey(), value: beutifyChip(e.currentTarget.value)}))
                }}
                placeholder="Search Spells..."
                value={searchValue()}
                type="text"
              />

            }>
              <Match when={["school", "level"].includes(searchKey())}> 
                <Select transparent value={searchValue()} onChange={(e)=>setSearchValue(e)}>
                  <Show when={searchKey() === "school"}>
                    <For each={spellSchools}>
                      {(school)=>
                        <>
                          <Option value={school}>{school}</Option>
                        </>
                      }
                    </For>
                  </Show>
                  <Show when={searchKey() === "level"}>
                    <For each={[0,1,2,3,4,5,6,7,8,9]}>
                      {(level)=>
                        <>
                          <Option value={level}>{level}</Option>
                        </>
                      }
                    </For>
                  </Show>
                </Select>
              </Match>
            </Switch> 
          </Match>
        </Switch>
      </div>
      <Chipbar chips={chipBar} setChips={setChipBar} />
    </div>
  );
};
export default SearchBar;

type SProps = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any  
  [key: string]: any;
}
const SearchGlass: Component<SProps> = (props)=>{
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" x="0" y="0" width="100" height="100" viewBox="0 0 50 50">
    <path d="M 21 3 C 11.621094 3 4 10.621094 4 20 C 4 29.378906 11.621094 37 21 37 C 24.710938 37 28.140625 35.804688 30.9375 33.78125 L 44.09375 46.90625 L 46.90625 44.09375 L 33.90625 31.0625 C 36.460938 28.085938 38 24.222656 38 20 C 38 10.621094 30.378906 3 21 3 Z M 21 5 C 29.296875 5 36 11.703125 36 20 C 36 28.296875 29.296875 35 21 35 C 12.703125 35 6 28.296875 6 20 C 6 11.703125 12.703125 5 21 5 Z"></path>
  </svg>
}
