import { Component, For, Show, Switch, Match, createSignal, createMemo, Accessor, useContext } from "solid-js";
import ExpansionPanel from "../../../shared/components/expansion/expansion";
import FeatureTable from "./featureTable";
import useGetClasses from "../../../shared/customHooks/data/useGetClasses";
import useStyle from "../../../shared/customHooks/utility/style/styleHook";
import styles from "./viewClasses.module.scss"
import { useSearchParams, useParams } from "@solidjs/router";
import { effect } from "solid-js/web";
import type { DnDClass } from "../../../models";
import Carousel from "../../../shared/components/Carosel/Carosel";
import { Feature } from "../../../models/core.model";
import { Subclass } from "../../../models/class.model";
import Button from "../../../shared/components/Button/Button";
import { SharedHookContext } from "../../rootApp";
import useStyles from "../../../shared/customHooks/utility/style/styleHook";
import getUserSettings from "../../../shared/customHooks/userSettings";
import SearchBar from "../../../shared/components/SearchBar/SearchBar";
import { Paginator } from "../../../shared/components";


const viewClasses: Component = () => {
    const stylin = createMemo(()=>useStyles(userSettings().theme));
    const [searchResults,setSearchResults] = createSignal<DnDClass[]>([]) ;
    const [paginatedClasses,setPaginatedClasses] = createSignal<DnDClass[]>([]);
    
    const sharedHooks = useContext(SharedHookContext);
    const [userSettings, setUserSettings] = getUserSettings();
    const dndSrdClasses = useGetClasses();
    const [searchParam, setSearchParam] = useSearchParams();
    const selectedClass = dndSrdClasses().filter(x=>x.name?.toLowerCase() === (searchParam.name || dndSrdClasses()[0]?.name).toLowerCase())[0]
    const currentClass = createMemo(() => selectedClass)
    
    
    

    // if (!!!searchParam.name) setSearchParam({ name: dndSrdClasses().length > 0 ? dndSrdClasses()[)].name : "barbarian" })

    // const currentClass: Accessor<DnDClass> = createMemo(() => dndSrdClasses().length > 0 && currentClassIndex() >= 0 && currentClassIndex() < dndSrdClasses().length ? dndSrdClasses()[currentClassIndex()] : ({} as DnDClass))


    effect(() => {
        setSearchParam({ name: currentClass().name })
    })



    return (
        <div class={`${stylin()?.primary} ${styles.CenterPage}`}>
            
            <SearchBar dataSource={dndSrdClasses} setResults={setSearchResults}/>
            



            <Paginator items={searchResults} setPaginatedItems={setPaginatedClasses}/>
        </div>
    )
};
export default viewClasses
