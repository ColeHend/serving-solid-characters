import { 
  Component, 
  Show, 
  createSignal, 
  createMemo, 
  createEffect, 
  onMount,
  onCleanup
} from "solid-js";
import styles from "./viewClasses.module.scss"
import { useSearchParams } from "@solidjs/router";
import useStyles from "../../../shared/customHooks/utility/style/styleHook";
import getUserSettings from "../../../shared/customHooks/userSettings";
import ClassModal from "../../../shared/components/modals/classModal/classModal.component";
import { createSelectionSync, createTableSort, Paginator } from "../../../shared";
import SearchBar from "../../../shared/components/SearchBar/SearchBar";
import { 
  Body, 
  Cell,
  Column, 
  Header,
  Row,
  Table 
} from "coles-solid-library";
import { ClassMenu } from "./classMenu/classMenu";
import { trackRecentItem } from "../../../shared/customHooks/useRecentItems";
import { Class5E } from "../../../models/generated";
import { useDnDClasses } from "../../../shared/customHooks/dndInfo/info/all/classes";
import { useDnDSubclasses } from "../../../shared/customHooks/dndInfo/info/all/subclasses";

const viewClasses: Component = () => {
  const [userSettings] = getUserSettings();
  const stylin = createMemo(()=>useStyles(userSettings().theme));
  const srdClasses = useDnDClasses();
  const [searchParam, setSearchParam] = useSearchParams();
  const allSubclasses = useDnDSubclasses();

  const [paginatedClasses,setPaginatedClasses] = createSignal<Class5E[]>([]);
  const [currentClass, setCurrentClass] = createSignal<Class5E>({} as Class5E);
  const [showClass, setShowClass] = createSignal<boolean>(false);
  const [results, setResults] = createSignal<Class5E[]>([]);
  const [tableData, setTableData] = createSignal<Class5E[]>([]);

  const { currentSort, dataSort, applySort } = createTableSort<Class5E>({
    data: [tableData, setTableData],
    syncSetters: [setResults],
  });

  const system = createMemo(() => userSettings().dndSystem);

  const is2014 = createMemo(() => system() === "2014" || system() === "both");

  const searchResults = createMemo(() =>
    results().length > 0 ? results() : srdClasses()
  );

  createEffect(() => {
    const list = srdClasses();
    if (list.length === 0) return;
    const param = typeof searchParam.itemType === "string" ? searchParam.itemType : searchParam.itemType?.join(" ");
    const found = param && list.some(c => c.name.toLowerCase() === param.toLowerCase());
    if (!found) {
      setSearchParam({ name: list[0].name });
    }
  });

  const selectedClass = createMemo(() => {
    const list = srdClasses();
    const param = typeof searchParam.name === "string" ? searchParam.name : searchParam.name?.join(" ");
    if (list.length === 0) return undefined;
    const target = (param || list[0].name).toLowerCase();
    return list.find(c => c.name.toLowerCase() === target) || list[0];
  });

  createSelectionSync({
    selected: selectedClass,
    list: srdClasses,
    current: [currentClass, setCurrentClass],
    nameOf: (c) => c.name,
  });

  createEffect(() => {
    const cur = currentClass();

    if (showClass() && cur.name) {
      setSearchParam({ name: cur.name})
      trackRecentItem({
        name: cur.name,
        type: "class",
        route: `/info/classes?search=${encodeURIComponent(cur.name)}`,
      });
    } else if (!showClass()) {
      setSearchParam({ name: ""})
    }
  })



  onMount(()=>{
    document.body.classList.add('classes-bg');
  })

  onCleanup(()=>{
    document.body.classList.remove('classes-bg');
  })

  createEffect(() => {
    const list = srdClasses();
    applySort(list);    
  })
    
  const columns = createMemo(() =>
    is2014() ? ["name", "legacy", "menu"] : ["name", "menu"]
  );


  return (
    <Body class={`${stylin()?.primary}  ${styles.body}`}>
      <div class={`${styles.headerBar}`}>
        <h1 class={`${styles.Title}`}>Classes</h1>
      </div>

      <div class={`${styles.searchBar}`}>
        <SearchBar
          dataSource={tableData}
          setResults={setResults}
          searchFunction={(data, search)=>{
            return data.name.toLowerCase() === search.toLowerCase();
          }}
          seed={typeof searchParam.search === "string" ? searchParam.search : searchParam.search?.[0]}
          />
      </div>

     

      <div class={`${styles.classesTable}`}>
        <Show fallback={<></>} when={columns()} keyed>
            <>
              <Table data={paginatedClasses} columns={columns()}>
                <Column name="name" class={`${is2014() ? styles.nameCol : styles.nameCol2024}`}>
                  <Header onClick={()=>dataSort("name")}>
                    Name
                    <Show when={currentSort().sortKey === "name"}>
                      <span>{currentSort().isAsc ? " ▲" : " ▼"}</span>
                    </Show>
                  </Header>
                </Column>
                <Column name="legacy" class={`${styles.legacyCol}`}>
                  <Header onClick={()=>dataSort("legacy")}>
                    Legacy
                    <Show when={currentSort().sortKey === "legacy"}>
                      <span>{currentSort().isAsc ? " ▲" : " ▼"}</span>
                    </Show>
                  </Header>
                </Column>
                <Column name="menu" class={`${styles.menuCol}`}>
                  <Header class={`${styles.noClicky}`}><></></Header>
                </Column>
              </Table>

              <div class={`${styles.scrollable}`}>
                <Table data={paginatedClasses} columns={columns()}>
                  <Column name="name" class={`${is2014() ? styles.nameCol : styles.nameCol2024}`}>
                    <Cell<Class5E>>{(x) => <span>{x.name}</span>}</Cell>
                  </Column>
                  <Column name="legacy" class={`${styles.legacyCol}`}>
                    <Cell<Class5E>>
                      {(dndClass) => <Show fallback={<span></span>} when={dndClass.legacy === true}><span>Legacy</span></Show>}
                    </Cell>
                  </Column>
                  <Column name="menu" class={`${styles.menuCol}`}>
                    <Cell<Class5E> onClick={(e)=>e.stopPropagation()}>
                      {(dndClass) => <ClassMenu dndClass={dndClass} openDialog={() => {
                        setCurrentClass(dndClass);
                        setSearchParam({ name: dndClass.name });
                        setShowClass(true);
                      }} />}
                    </Cell>
                  </Column>

                  <Row onClick={(e ,dndClass) => {
                    setCurrentClass(dndClass);
                    setSearchParam({ name: dndClass.name });
                    setShowClass(old => !old);
                  }}/>
                </Table>
              </div>
            </>
        </Show>
      </div>

      <div class={`${styles.paginator}`}>
        <Paginator 
          items={searchResults} 
          setPaginatedItems={setPaginatedClasses}
          transparent/>
      </div>
      
      <Show when={showClass()}>
        <ClassModal 
          boolean={showClass} 
          booleanSetter={setShowClass} 
          currentClass={currentClass} 
          subclasses={allSubclasses}
        />
      </Show>
    </Body>
  )
};
export default viewClasses