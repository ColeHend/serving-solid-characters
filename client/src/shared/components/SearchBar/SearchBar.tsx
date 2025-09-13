import { Accessor, Component, createSignal, JSX, Setter, splitProps } from "solid-js";
import style from "./SearchBar.module.scss";
import { Clone } from "../../customHooks";
import { Button, Icon, Input, addSnackbar } from "coles-solid-library";
interface Props<T> {
    dataSource: Accessor<T[]>;
    setResults: Setter<T[]>;
    class?: string;
    tooltip?: string;
		wrapClass?: string;
    searchFunction?: (data:T, search:string) => boolean;
}
const SearchBar = <T,>(props: Props<T>) => {
  const [searchValue, setSearchValue] = createSignal<string>("");
  const [local, other] = splitProps(props, ['wrapClass', 'tooltip'])
  
  
  const searchClick = () => setTimeout(() => {
    
    const search = searchValue().toLowerCase();
    const results = props.dataSource().filter((item) => {

      if (props.searchFunction) return props.searchFunction(item, searchValue());
      if(search.trim().length === 0) return true;
      return JSON.stringify(item).toLowerCase().includes(search);
    });
    console.log('results', results);
    console.log(`searching for "${search}" in ${props.dataSource().length} items, found ${results.length}`);
    
    

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
  props.setResults(props.dataSource());
  return (
    <div class={`${style.searchBar}`}>
      <Input
        transparent
        type="text"
        value={searchValue()}
        onChange={(e) => setSearchValue(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && searchClick()}
        onSubmit={()=>searchClick()}
        {...props}
        class={`${style.input} ${(props.class ?? "")}`}
      />
      <Button onClick={searchClick} title={local.tooltip ?? "Search!"}><Icon name="search" size={"medium"} /></Button>
    </div>
  )
}

export default SearchBar;