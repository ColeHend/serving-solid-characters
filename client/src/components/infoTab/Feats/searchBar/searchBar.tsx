import { Accessor, Component, For, Setter, Show, createSignal } from "solid-js";
import { Feat } from "../../../../models/feat.model";
import { effect } from "solid-js/web";
import styles from "./searchBar.module.scss";

type Props<T> = {
    items: Accessor<T>;
    setSearchRes: Setter<T>;
}

const FeatsSearch: Component<Props<Feat[]>> = (props) => {
    const [searchValue, setSearchValue] = createSignal<string>("");

    effect(()=>{
        props.setSearchRes(props.items().filter((feat: Feat)=>{
            
            if(!!feat){
                return feat.name.toLowerCase().includes(searchValue().toLowerCase());
            }
        }));
    })

    return (
        <div class={styles.featSearch}>
            <input 
                id="FeatSearchBar"
                type="text" 
                value={searchValue()}
                placeholder="Search Feats..."
                onChange={(e)=>setSearchValue(e.currentTarget.value)}  />

        </div>
    )
};

export default FeatsSearch;