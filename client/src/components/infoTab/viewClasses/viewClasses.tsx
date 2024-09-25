import { Component, For, Show, Switch, Match, createSignal, createMemo, Accessor, useContext } from "solid-js";
import useGetClasses from "../../../shared/customHooks/data/useGetClasses";
import styles from "./viewClasses.module.scss"
import { useSearchParams, useParams, action, useNavigate } from "@solidjs/router";
import { effect } from "solid-js/web";
import type { DnDClass } from "../../../models";
import { Subclass } from "../../../models/class.model";
import Button from "../../../shared/components/Button/Button";
import { SharedHookContext } from "../../rootApp";
import useStyles from "../../../shared/customHooks/utility/style/styleHook";
import getUserSettings from "../../../shared/customHooks/userSettings";
import ClassModal from "../../../shared/components/modals/classModal/classModal.component";
import { Body, Paginator, SkinnySnowman } from "../../../shared";
import Table from "../../../shared/components/Table/table";
import { Cell, Column, Header } from "../../../shared/components/Table/innerTable";
import SearchBar from "../../../shared/components/SearchBar/SearchBar";


const viewClasses: Component = () => {
    const sharedHooks = useContext(SharedHookContext);
    const [userSettings, setUserSettings] = getUserSettings();
    const stylin = createMemo(()=>useStyles(userSettings().theme));
    const dndSrdClasses = useGetClasses();
    const [searchParam, setSearchParam] = useSearchParams();
    const [paginatedClasses,setPaginatedClasses] = createSignal<DnDClass[]>([]);
    const [currentClass, setCurrentClass] = createSignal<DnDClass>({} as DnDClass);
    const currentSubclasses = createMemo(() => currentClass()?.subclasses?.length > 0 ? currentClass()?.subclasses : [] as Subclass[])
		const [showClass, setShowClass] = createSignal<boolean>(false);
    const [results, setResults] = createSignal<DnDClass[]>([]);

  //   const searchResults = createMemo(() =>
  //   results().length > 0 ? results() : dndSrdClasses()
  // )
		const navigate = useNavigate();
    const menuButtons = (dndClass:DnDClass) => ([
      {
        name: "Edit",
        action: () => {
					navigate(`/homebrew/create/classes?name=${dndClass.name}`)
				}
      },
      {
        name: "Calculate Dmg",
        action: () => {}
      }
    ])

    effect(() => {
        setSearchParam({ name: dndSrdClasses()?.length > 0 ? currentClass().name : "barbarian" })      
    })

    
    return (
        <Body class={`${stylin()?.primary}  ${styles.classesView}`}>
            <h1>Classes</h1>

            <div class={`${styles.searchBar}`}>
              <SearchBar 
                dataSource={dndSrdClasses} 
                setResults={setResults}
                searchFunction={(data, search)=>{
                  return data.name.toLowerCase() === search.toLowerCase();
                }}
                class={`${styles.searchBar}`}/>
            </div>

            <Table data={paginatedClasses} columns={["name","menu"]} class={`${styles.classesTable}`}>
								<Column name="name">
									<Header><span></span></Header>
									<Cell<DnDClass>>{(x, i) => <span onClick={() => {
										setCurrentClass(x);
										setSearchParam({ name: x.name });
										setShowClass(!showClass());
									}}>{x.name}</span>}</Cell>
								</Column>
                <Column name="menu">
                  <Header><span></span></Header>
                  <Cell<DnDClass>>
                    {(dndClass, i) => <Button enableBackgroundClick menuItems={menuButtons(dndClass)}>
                      <SkinnySnowman />  
                    </Button>}
                  </Cell>
                </Column>
						</Table>
						<Show when={showClass()}>
								<ClassModal boolean={showClass} booleanSetter={setShowClass} currentClass={currentClass} />
						</Show>
            <div class={`${styles.paginator}`}>
              <Paginator 
              items={results} 
              setPaginatedItems={setPaginatedClasses}/>
            </div>
        </Body>
    )
};
export default viewClasses