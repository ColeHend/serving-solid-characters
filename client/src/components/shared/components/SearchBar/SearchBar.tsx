import { Accessor, Component, createSignal, JSX, Setter } from "solid-js";
import useStyles from "../../../../customHooks/utility/style/styleHook";
import style from "./SearchBar.module.scss";
interface Props<T> extends JSX.InputHTMLAttributes<HTMLInputElement> {
    dataSource: Accessor<T[]>,
    setResults: Setter<T[]>,
    class?: string,
    tooltip?: string,
}
const SearchBar = <T,>(props: Props<T>) => {
    const [searchValue, setSearchValue] = createSignal<string>("");
    const searchClick = () => {
        const search = searchValue().toLowerCase();
        const results = props.dataSource().filter((item) => {
            if(search.trim().length === 0) return true;
            return JSON.stringify(item).toLowerCase().includes(search.trim());
        });
        props.setResults(results);
    };
    return (
        <div class={style.searchBar}>
            <input
            type="text"
            onChange={(e) => setSearchValue(e.currentTarget.value)}
            onSubmit={()=>searchClick()}
            {...props}
            class={`${style.input} ${(props.class ?? "")}`}
            />
            <button onClick={searchClick} title={props.tooltip ?? "Search!"}><SearchGlass /></button>
        </div>
    )
}

export default SearchBar;

interface SProps extends JSX.SvgSVGAttributes<SVGSVGElement> {
}
const SearchGlass: Component<SProps> = (props)=>{
    return <>
        <svg {...props} xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="100" height="100" viewBox="0 0 50 50">
            <path d="M 21 3 C 11.621094 3 4 10.621094 4 20 C 4 29.378906 11.621094 37 21 37 C 24.710938 37 28.140625 35.804688 30.9375 33.78125 L 44.09375 46.90625 L 46.90625 44.09375 L 33.90625 31.0625 C 36.460938 28.085938 38 24.222656 38 20 C 38 10.621094 30.378906 3 21 3 Z M 21 5 C 29.296875 5 36 11.703125 36 20 C 36 28.296875 29.296875 35 21 35 C 12.703125 35 6 28.296875 6 20 C 6 11.703125 12.703125 5 21 5 Z"></path>
        </svg>
        </>
}