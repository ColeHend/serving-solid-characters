import { Accessor, createEffect, createSignal, Setter, splitProps } from "solid-js";
import style from "./SearchBar.module.scss";
import { Clone } from "../../customHooks";
import { Button, Icon, Input, addSnackbar } from "coles-solid-library";
import { Search } from "coles-solid-library/icons";
interface Props<T> {
    dataSource: Accessor<T[]>;
    setResults: Setter<T[]>;
    class?: string;
    tooltip?: string;
		wrapClass?: string;
    searchFunction?: (data:T, search:string) => boolean;
    /** Programmatic search (e.g. a ?search= URL param); applied once per distinct value when data is ready. */
    seed?: string;
}
const SearchBar = <T,>(props: Props<T>) => {
  const [searchValue, setSearchValue] = createSignal<string>("");
  const [local, inputProps] = splitProps(props, ['wrapClass', 'tooltip', 'seed', 'dataSource', 'setResults', 'searchFunction'])
  
  
  const searchClick = () => setTimeout(() => {
    
    const search = searchValue().toLowerCase();
    const results = props.dataSource().filter((item) => {

      if (props.searchFunction) return props.searchFunction(item, searchValue());
      if(search.trim().length === 0) return true;
      return JSON.stringify(item).toLowerCase().trim().includes(search.toLowerCase().trim());
    });
    
    if (results.length >= 1) {
      addSnackbar({
        message:`Found: ${results.length}!`,
        severity:"success",
        closeTimeout:4000,
      })
      props.setResults(Clone(results));
    } else {
      addSnackbar({
        message:`Found: ${results.length}`,
        severity:"error",
        closeTimeout:4000,
      })
      props.setResults(props.dataSource());
    }
  }, 0);

  let searchTimeout:NodeJS.Timeout;

  // Applies a programmatic search once per distinct seed, waiting for the
  // async dataSource to load before filtering.
  let appliedSeed: string | undefined;
  createEffect(() => {
    if (searchValue() === "") {
      props.setResults(props.dataSource());
    }

    const seed = props.seed?.trim();
    if (!seed || seed === appliedSeed || props.dataSource().length === 0) return;
    appliedSeed = seed;
    setSearchValue(seed);
    searchClick();
  });
  return (
    <div class={`${style.searchBar}`}>
      <Input
        transparent
        type="text"
        value={searchValue()}
        onInput={(e) => {
          setSearchValue(e.target.value)
          
          clearTimeout(searchTimeout)

          searchTimeout = setTimeout(() => {
            searchClick()
          },500)
        }}
        // onKeyDown={(e) => e.key === "Enter" && searchClick()}
        // onSubmit={()=>searchClick()}
        {...inputProps}
        class={`${style.input} ${(props.class ?? "")}`}
      />
      <Button onClick={searchClick} title={local.tooltip ?? "Search!"}><Icon icon={Search} size={"medium"} /></Button>
    </div>
  )
}

export default SearchBar;