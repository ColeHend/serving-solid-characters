import {
    Component,
    For,
    Match,
    Show,
    Switch,
    createMemo,
    createSignal,
    useContext,
} from "solid-js";
import styles from "./feats.module.scss";
import { Feat } from "../../../models/feat.model";
import Paginator from "../../../shared/components/paginator/paginator";
import { effect } from "solid-js/web";
import useGetFeats from "../../../shared/customHooks/data/useGetFeats";
import SearchBar from "../../../shared/components/SearchBar/SearchBar";
import { useSearchParams } from "@solidjs/router";
import { SharedHookContext } from "../../rootApp";
import useStyles from "../../../shared/customHooks/utility/style/styleHook";
import getUserSettings from "../../../shared/customHooks/userSettings";
import Table from "../../../shared/components/Table/table";
import { Cell, Column, Header } from "../../../shared/components/Table/innerTable";
import { Body, Button, SkinnySnowman } from "../../../shared";

const featsList: Component = () => {
    const [paginatedFeats, setPaginatedFeats] = createSignal<Feat[]>([]);
    const [searchResult, setSearchResult] = createSignal<Feat[]>([]);
    const displayResults = createMemo(() => {
        if (searchResult().length === 0) return paginatedFeats();
        return searchResult();
    });

    const sharedHooks = useContext(SharedHookContext);
    const [userSettings, setUserSettings] = getUserSettings();
    const stylin = createMemo(() => useStyles(userSettings().theme));

    const srdFeats = useGetFeats();

    const [searchParam, setSearchParam] = useSearchParams();
    if (!!!searchParam.name) setSearchParam({ name: srdFeats()[0]?.name });
    const selectedFeat = srdFeats().filter(
        (feat) =>
            feat.name?.toLowerCase() ===
            (searchParam.name || srdFeats()[0]?.name).toLowerCase()
    )[0];
    const [currentFeat, setCurrentFeat] = createSignal<Feat>(selectedFeat);

    effect(() => {
        setSearchParam({ name: currentFeat()?.name });
    });

    return (
        <Body class={`${styles.featWrapper}`}>
            <h1 class={styles.header}>Feats</h1>
                
               <div class={`${styles.searchDiv}`}>
                <SearchBar
                    placeholder="Search Feats..."
                    dataSource={srdFeats}
                    setResults={setSearchResult}></SearchBar>
               </div>
                
                <div class={`${styles.featTable}`}>
                    <Table data={displayResults} columns={["name","options"]}>
                        
                        <Column name="name">
                            <Header>Name</Header>
                            <Cell<Feat>>
                                { (feat, i) => <span>
                                    {feat.name} 
                                </span>}
                            </Cell>
                        </Column>
                        <Column name="options">
                            <Header><></></Header>
                            <Cell<Feat>>
                                { (feat,i) => <span>
                                    <Button class={`${styles.menuBtn}`}>
                                        <SkinnySnowman />
                                    </Button>
                                </span>}
                            </Cell>
                        </Column>

                    </Table>

                </div>
               
                <div class={`${styles.paginator}`}>
                    <Paginator items={srdFeats} setPaginatedItems={setPaginatedFeats} />
                </div>
        </Body>
    );
};
export default featsList;
