import { Body, Cell, Column, Header, Row, Table } from "coles-solid-library";
import { Accessor, Component, createEffect, createMemo, createSignal, onCleanup, onMount, Show } from "solid-js";
import { Item, ItemType } from "../../../../../models/data";
import SearchBar from "../../../../../shared/components/SearchBar/SearchBar";
import { Clone, Paginator } from "../../../../../shared";
import { useSearchParams } from "@solidjs/router";
import styles from "./itemsView.module.scss";

interface viewProps {
  items: Accessor<Item[]>;
}

export const ItemsView:Component<viewProps> = (props) => {
  const [searchParam, setSearchParam] = useSearchParams();

  const [tableData,setTableData] = createSignal<Item[]>([]);
  const [searchResult,setSearchResult] = createSignal<Item[]>([]);
  const [paginatedItems,setPaginatedItems] = createSignal<Item[]>([]);
  const [currentItem, setCurrentItem] = createSignal<Item | undefined>(undefined);
  const [showItem,setShowItem] = createSignal<boolean>(false);
  const [currentSort,setCurrentSort] = createSignal<{
    sortKey: string;
    isAsc: boolean;
  }>({ sortKey: "cost", isAsc: false});
  
  const searchResults = createMemo(() => searchResult().length ? searchResult() : props.items());

  createEffect(()=>{
    const list = props.items();
    if (list.length === 0) return;
    const param = searchParam.name;
    const found = param && list.some(i => i.name.toLowerCase() === param.toLowerCase())
    if (!found) {
      setSearchParam({ name: list[0].name});
    }
  });

  const selectedItem = createMemo(() => {
    const list = props.items();
    if (list.length === 0) return undefined;
    const target = (searchParam.name || list[0].name).toLowerCase();
    return list.find(i => i.name.toLowerCase() === target) || list[0];
  })

  createEffect(() => {
    const sel = selectedItem();
    if (sel) setCurrentItem(sel);
  })

  createEffect(() => {
    const cur = currentItem();

    if (showItem() && cur?.name) {
      setSearchParam({
        name: cur.name
      })
    } else if (!showItem()) {
      setSearchParam({
        name: "",
      })
    }
  })


  createEffect(()=>{
    const list = props.items();
    setTableData(list);

  });


  // Normalize cost string: keep only the first number + coin type (CP|SP|GP), ignore trailing text
  const normalizeCost = (cost: string): string => {
    const match = cost.match(/^(\d+)\s*(CP|SP|GP)/i);
    return match ? `${match[1]} ${match[2].toUpperCase()}` : cost;
  }

  const costToCopper = (cost: string): number => {
    const normalized = normalizeCost(cost);
    const match = normalized.match(/^(\d+)\s*(CP|SP|GP)$/i);
    if (!match) return 0;
    const value = parseInt(match[1], 10);
    const unit = match[2].toUpperCase();
    switch (unit) {
      case "GP":
        return value * 100;
      case "SP":
        return value * 10;
      case "CP":
        return value;
      default:
        return 0;
    }
  }

  const dataSort = (sortBy: keyof Item) => {
    setCurrentSort(old => {
      if (old.sortKey === sortBy) {
        return Clone({ sortKey: sortBy as string, isAsc: !old.isAsc });
      } else {
        return Clone({ sortKey: sortBy as string, isAsc: old.isAsc });
      }
    });
    setTableData((old) => {
      const currentSorting = currentSort();
      const shouldAsc = currentSorting.isAsc;

      const sorted = Clone(
        old.sort((a, b) => {
          let aSort: any, bSort: any;

          if (sortBy === "cost") {
            aSort = costToCopper(a.cost);
            bSort = costToCopper(b.cost);
          } else {
            aSort = typeof a?.[sortBy] === "string"
              ? a?.[sortBy].replaceAll(" ", "")
              : a?.[sortBy];
            bSort = typeof b?.[sortBy] === "string"
              ? b?.[sortBy].replaceAll(" ", "")
              : b?.[sortBy];
          }

          if (aSort === undefined || bSort === undefined) {
            return 0;
          }

          if (aSort < bSort) return shouldAsc ? 1 : -1;
          if (aSort > bSort) return shouldAsc ? -1 : 1;
          return 0;
        })
      );

      // Also update paginatedItems to trigger UI update
      setPaginatedItems(sorted);

      return sorted;
    });
  };

  onMount(() => {
    dataSort("cost");
  })

  console.log("items: ", props.items());
  

  return <Body class={`${styles.itemsBody}`}>
    <div class={`${styles.searchBar}`}>
      <SearchBar 
        dataSource={tableData}
        setResults={setSearchResult}
        searchFunction={(item,search) =>{
          return item.name === search.toLowerCase();
        }}
      />
    </div>

    <div class={`${styles.table}`}>
      <Table columns={["name","type","cost"]} data={()=>paginatedItems()}>
        <Column name="name">
          <Header onClick={()=>dataSort("name")}>
            Name
            <Show when={currentSort().sortKey === "name"}>
              <span>{ currentSort().isAsc ? " ▲" : " ▼" }</span>
            </Show>
          </Header>
          <Cell<Item>>
            {(item)=> <span>
              {item.name}
            </span>}
          </Cell>
        </Column>

        <Column name="type">
          <Header onClick={()=>dataSort("type")}>
            Type
            <Show when={currentSort().sortKey === "type"}>
              <span>{ currentSort().isAsc ? " ▲" : " ▼" }</span>
            </Show>
          </Header>
          <Cell<Item>>
            {(item)=><span>
              {ItemType[item.type]}
            </span>}
          </Cell>
        </Column>

        <Column name="cost">
          <Header onClick={()=>dataSort("cost")}>
            Cost
            <Show when={ currentSort().sortKey === "cost"}>
              <span>{ currentSort().isAsc ? " ▲" : " ▼"}</span>
            </Show>
          </Header>
          <Cell<Item>>
            {(item)=><span>
              {(item.cost)}
            </span>}
          </Cell>
        </Column>
          
        <Row rowNumber={1} onClick={(e, Item)=>{
          setCurrentItem(Item);
          setShowItem(old => !old);
        }}/>
      </Table>
    </div>

    <div class={`${styles.paginator}`}>
      <Paginator 
        items={searchResults}
        setPaginatedItems={setPaginatedItems}
      />
    </div>
  </Body>
}