import { 
  Accessor, 
  Component, 
  For, 
  Match, 
  Setter, 
  Show, 
  Switch, 
  createEffect, 
  createSignal 
} from "solid-js";
import { 
  Button, 
  Input, 
  Icon, 
  Checkbox, 
  Chipbar, 
  ChipType 
} from "coles-solid-library";
import { beutifyChip } from "../../../../shared/customHooks/utility/tools/beautifyChip";
import { Spell } from "../../../../models/data";
import styles from "./searchBar.module.scss";


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
        <Button transparent onClick={()=>setSearchChip(()=>({key: searchKey(), value: beutifyChip(searchValue())  }))} >
          <Icon name="search" size={"medium"}></Icon>
        </Button>
        <select value={searchKey()} onChange={(e)=>setSearchKey(e.currentTarget.value)} id="chipDropdown">
          <For each={Object.keys(getFirstSpell()).filter(x=> !["materials_Needed","higherLevel","page"].includes(x) )}>{(key) => 
            <option value={key}>{beautifyKey(key)}</option>
          }</For>
        </select>
        <Switch>
          <Match when={Array.isArray(getFirstSpell()[searchKey() as keyof Spell]) || ['damageType', 'castingTime', 'range', 'duration'].includes(searchKey())}>
            <select value={searchValue()} onChange={setSearchValue}>
              <For each={getKeyOptions(searchKey() as keyof Spell)}>
                {(option)=>
                  <option value={option}>{option}</option>
                }
              </For>
            </select>
          </Match>
          <Match when={typeof getFirstSpell()[searchKey() as keyof Spell] === "boolean"}>
            <div class={`${styles.booleanSelect}`} id="booleanBar">
              {/* <Input type="checkbox" checked={ischecked()} id="booleanCheckbox" onchange={()=>{
                setIsChecked(!ischecked())
                setSearchValue(`${ischecked()}`)
              }}/> */}
              <Checkbox checked={ischecked()} onChange={()=>{
                setIsChecked(!ischecked())
                setSearchValue(`${ischecked()}`)
              }} />
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
                <select value={searchValue()} onChange={(e)=>setSearchValue(e.currentTarget.value)}>
                  <Show when={searchKey() === "school"}>
                    <For each={spellSchools}>
                      {(school)=>
                        <>
                          <option value={school}>{school}</option>
                        </>
                      }
                    </For>
                  </Show>
                  <Show when={searchKey() === "level"}>
                    <For each={[0,1,2,3,4,5,6,7,8,9]}>
                      {(level)=>
                        <>
                          <option value={level}>{level}</option>
                        </>
                      }
                    </For>
                  </Show>
                </select>
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
