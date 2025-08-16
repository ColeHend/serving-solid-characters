import { Component, Show, createSignal, createMemo } from "solid-js";
import useGetClasses from "../../../shared/customHooks/dndInfo/oldSrdinfo/data/useGetClasses";
import styles from "./viewClasses.module.scss"
import { useSearchParams, useNavigate } from "@solidjs/router";
import { effect } from "solid-js/web";
import type { DnDClass } from "../../../models";
import useStyles from "../../../shared/customHooks/utility/style/styleHook";
import getUserSettings from "../../../shared/customHooks/userSettings";
import ClassModal from "../../../shared/components/modals/classModal/classModal.component";
import { homebrewManager, Paginator } from "../../../shared";
import SearchBar from "../../../shared/components/SearchBar/SearchBar";
import { Body, Cell, Column, Header, Icon, Button, Table  } from "coles-solid-library";
import { ClassMenu } from "./classMenu/classMenu";


const viewClasses: Component = () => {
  const [userSettings] = getUserSettings();
  const stylin = createMemo(()=>useStyles(userSettings().theme));
  const dndSrdClasses = useGetClasses();
  const [, setSearchParam] = useSearchParams();
  const [paginatedClasses,setPaginatedClasses] = createSignal<DnDClass[]>([]);
  const [currentClass, setCurrentClass] = createSignal<DnDClass>({} as DnDClass);
  const [showClass, setShowClass] = createSignal<boolean>(false);
  const [results, setResults] = createSignal<DnDClass[]>([]);

  const searchResults = createMemo(() =>
    results().length > 0 ? results() : dndSrdClasses()
  )


  effect(() => {
    setSearchParam({ name: dndSrdClasses()?.length > 0 ? currentClass().name : "barbarian" })      
 
    console.log("Classes: ", dndSrdClasses())
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

      <div class={`${styles.classesTable}`}>
        <Table data={paginatedClasses} columns={["name","menu"]}>
          <Column name="name">
            <Header><span></span></Header>
            <Cell<DnDClass>>{(x) => <span onClick={() => {
              setCurrentClass(x);
              setSearchParam({ name: x.name });
              setShowClass(!showClass());
            }}>{x.name}</span>}</Cell>
          </Column>
          <Column name="menu">
            <Header><></></Header>
            <Cell<DnDClass>>
              {(dndClass) => <ClassMenu dndClass={dndClass} />}
            </Cell>
          </Column>
        </Table>
      </div>
      <Show when={showClass()}>
        <ClassModal boolean={showClass} booleanSetter={setShowClass} currentClass={currentClass} />
      </Show>
      <div class={`${styles.paginator}`}>
        <Paginator 
          items={searchResults} 
          setPaginatedItems={setPaginatedClasses}/>
      </div>
    </Body>
  )
};
export default viewClasses