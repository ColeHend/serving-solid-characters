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
import { Paginator } from "../../../shared";
import SearchBar from "../../../shared/components/SearchBar/SearchBar";
import { 
  Body, 
  Cell, 
  Column, 
  Header, 
  Table 
} from "coles-solid-library";
import { ClassMenu } from "./classMenu/classMenu";
import { Class5E, Subclass } from "../../../models/data";
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

  const searchResults = createMemo(() =>
    results().length > 0 ? results() : srdClasses()
  )

  createEffect(() => {
    const list = srdClasses();
    if (list.length === 0) return;
    const param = typeof searchParam.itemType === "string" ? searchParam.itemType : searchParam.itemType?.join(" ");
    const found = param && list.some(c => c.name.toLowerCase() === param.toLowerCase());
    if (!found) {
      setSearchParam({ name: list[0].name });
    }
  })

  const selectedClass = createMemo(() => {
    const list = srdClasses();
    const param = typeof searchParam.name === "string" ? searchParam.name : searchParam.name?.join(" ");
    if (list.length === 0) return undefined;
    const target = (param || list[0].name).toLowerCase();
    return list.find(c => c.name.toLowerCase() === target) || list[0];
  })

  createEffect(() => {
    const sel = selectedClass();
    if (sel) setCurrentClass(sel);
  })

  createEffect(() => {
    const cur = currentClass();

    if (showClass() && cur.name) {
      setSearchParam({ name: cur.name})
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
    setTableData(list);    
  })
    
  return (
    <Body class={`${stylin()?.primary}  ${styles.body}`}>
      <div class={`${styles.headerBar}`}>
        <h1>Classes</h1>
      </div>

      <div class={`${styles.searchBar}`}>
        <SearchBar 
          dataSource={tableData} 
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
            <Cell<Class5E>>{(x) => <span onClick={() => {
              setCurrentClass(x);
              setSearchParam({ name: x.name });
              setShowClass(old => !old);
            }}>{x.name}</span>}</Cell>
          </Column>
          <Column name="menu">
            <Header><></></Header>
            <Cell<Class5E>>
              {(dndClass) => <ClassMenu dndClass={dndClass} />}
            </Cell>
          </Column>
        </Table>
      </div>

      <div class={`${styles.paginator}`}>
        <Paginator 
          items={searchResults} 
          setPaginatedItems={setPaginatedClasses}/>
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