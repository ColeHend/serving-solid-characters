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
import { useNavigate, useSearchParams } from "@solidjs/router";
import { SharedHookContext } from "../../rootApp";
import useStyles from "../../../shared/customHooks/utility/style/styleHook";
import getUserSettings from "../../../shared/customHooks/userSettings";
import Table from "../../../shared/components/Table/table";
import { Cell, Column, Header } from "../../../shared/components/Table/innerTable";
import { Body, Button, SkinnySnowman } from "../../../shared";
import FeatView from "../../../shared/components/modals/featModal/featView";

const featsList: Component = () => {
    const [paginatedFeats, setPaginatedFeats] = createSignal<Feat[]>([]);
    const [searchResult, setSearchResult] = createSignal<Feat[]>([]);
    const displayResults = createMemo(() => {
        if (searchResult().length === 0) return paginatedFeats();
        return searchResult();
    });
    const sharedHooks = useContext(SharedHookContext);
    const srdFeats = useGetFeats();
    const [searchParam, setSearchParam] = useSearchParams();
    if (!!!searchParam.name) setSearchParam({ name: srdFeats()[0]?.name });
    const selectedFeat = srdFeats().filter(
        (feat) =>
            feat.name?.toLowerCase() ===
            (searchParam.name || srdFeats()[0]?.name).toLowerCase()
    )[0];
    const [currentFeat, setCurrentFeat] = createSignal<Feat>(selectedFeat);
    const [showFeatModal,setShowFeatModal] = createSignal<boolean>(false)

    const navigate = useNavigate()

    const menuItems = (feat:Feat) => ([
        {
            name: "Clone and Edit",
            action: () => {navigate(`/homebrew/create/feats?name=${feat.name}`)}
        },
        {
        name: "Calculate Dmg",
        action: () => {}
        }
    ]);

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
                                { (feat, i) => <span onClick={()=>{
                                    setCurrentFeat(feat);
                                    setShowFeatModal(!showFeatModal());
                                }}>
                                    {feat.name} 
                                </span>}
                            </Cell>
                        </Column>
                        <Column name="options">
                            <Header><></></Header>
                            <Cell<Feat>>
                                { (feat,i) => <span>
                                    <Button menuItems={menuItems(feat)} enableBackgroundClick class={`${styles.menuBtn}`}>
                                        <SkinnySnowman />
                                    </Button>
                                </span>}
                            </Cell>
                        </Column>

                    </Table>

                </div>

                <Show when={showFeatModal()}>
                    <FeatView feat={currentFeat} backgroundClick={[showFeatModal,setShowFeatModal]} width="40%" height="40%" />
                </Show>
               
                <div class={`${styles.paginator}`}>
                    <Paginator items={srdFeats} setPaginatedItems={setPaginatedFeats} />
                </div>
        </Body>
    );
};
export default featsList;
