/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Accessor,
  Component,
  createEffect,
  createMemo,
  createSignal,
  Show,
  untrack,
} from "solid-js";
import style from "./amorView.module.scss";
import { Item } from "../../../../../models/generated";
import { srdItem } from "../../../../../models/data/generated";
import { Body, Cell, Column, Header, Row, Table } from "coles-solid-library";
import { useSearchParams } from "@solidjs/router";
import { costToCopper } from "../../item";
import { createSelectionSync, createTableSort, Paginator } from "../../../../../shared";
import SearchBar from "../../../../../shared/components/SearchBar/SearchBar";
import { ItemPopup } from "../../../../../shared/components/modals/ItemModal/ItemModal";
import { ItemsMenu } from "../itemsMenu/itemsMenu";
import { getUserSettings } from "../../../../../shared/customHooks/userSettings";
import { isMobile } from "coles-solid-library/dist/tools/tools.js";

interface viewProps {
  items: Accessor<srdItem[]>;
}

export const ArmorView: Component<viewProps> = (props) => {
  const [searchParam, setSearchParam] = useSearchParams();

  const [tableData, setTableData] = createSignal<srdItem[]>(props?.items());
  const [searchResult, setSearchResult] = createSignal<srdItem[]>([]);
  const [paginatedItems, setPaginatedItems] = createSignal<srdItem[]>([]);
  const [currentItem, setCurrentItem] = createSignal<srdItem | undefined>(
    undefined,
  );
  const [showItem, setShowItem] = createSignal<boolean>(false);
  const { currentSort, dataSort, applySort } = createTableSort<srdItem>({
    data: [tableData, setTableData],
    syncSetters: [setSearchResult],
    initial: { sortKey: "cost", isAsc: false },
    valueSelectors: {
      cost: (item) => costToCopper(item?.cost),
      properties: (item) => String(item?.properties?.AC ?? ""),
    },
  });

  const [userSettings,] = getUserSettings();
  
  const mobile = createMemo(() => isMobile());
  
  const system = createMemo(() => userSettings().dndSystem);

  const is2014 = createMemo(() => system() === "2014" || system() === "both");

  const columns = createMemo(() => {
      const isMobile = mobile();
      if (isMobile) {
          return is2014() ? ["name", "legacy", "menu"] : ["name", "cost", "menu"]
      } else {
          return is2014() ? ["name", "legacy", "cost", "menu"] : ["name", "cost", "menu"]
      }
      
  });
  

  const searchResults = createMemo(() =>
    searchResult()?.length > 0 ? searchResult() : props.items(),
  );

  createEffect(() => {
    const list = props.items();
    if (list.length === 0) return;
    const param =
      typeof searchParam?.name === "string"
        ? searchParam?.name
        : searchParam?.name?.join(" ");
    const found =
      param &&
      list.some((i) => i?.name?.toLowerCase() === param?.toLowerCase());
    if ((!param || !found) && list?.[0].name === param) {
      setSearchParam({ name: list?.[0]?.name });
    }
  });

  const selectedItem = createMemo(() => {
    const list = props.items();
    const param =
      typeof searchParam?.name === "string"
        ? searchParam?.name
        : searchParam?.name?.join(" ");
    if (list.length === 0) return undefined;
    const target = (param || (list?.[0]?.name ?? ""))?.toLowerCase();
    return list?.find((i) => i?.name?.toLowerCase() === target) || list[0];
  });

  createSelectionSync({
    selected: selectedItem,
    list: () => props.items(),
    current: [currentItem, setCurrentItem],
    nameOf: (i) => i?.name,
  });

  createEffect(() => {
    const cur = currentItem();

    if (showItem() && cur?.name) {
      setSearchParam({
        name: cur?.name,
      });
    } else if (!showItem()) {
      // All four item tabs stay mounted in the Carousel and share ?name=; only the
      // view whose selection owns the param may clear it, else a background tab's
      // selection change wipes the active tab's param out from under its open modal.
      const param = untrack(() =>
        typeof searchParam.name === "string" ? searchParam.name : searchParam.name?.join(" "),
      );
      if (param && cur?.name && param.toLowerCase() === cur.name.toLowerCase()) {
        setSearchParam({ name: "" });
      }
    }
  });

  createEffect(() => {
    const list = props?.items();
    applySort(list);
  });

  return (
    <Body class={`${style.itemsBody}`}>
      <div class={`${style.searchBar}`}>
        <SearchBar
          dataSource={tableData}
          setResults={setSearchResult}
          searchFunction={(item, search) =>
            item?.name?.toLowerCase()?.includes(search?.toLowerCase())
          }
        />
      </div>

      <div class={`${style.table}`}>
        <Table
          columns={columns()}
          data={() => paginatedItems()}
        >
          <Column name="name" class={`${style.nameColumn}`}>
            <Header onClick={() => dataSort("name")}>
              Name
              <Show when={currentSort()?.sortKey === "name"}>
                <span>{currentSort()?.isAsc ? " ▲" : " ▼"}</span>
              </Show>
            </Header>
          </Column>

          <Column name="legacy" class={`${style.legacyColumn}`}>
            <Header onClick={() => dataSort("legacy")}>
              Legacy
              <Show when={currentSort()?.sortKey === "legacy"}>
                <span>{currentSort()?.isAsc ? " ▲" : " ▼"}</span>
              </Show>
            </Header>
          </Column>

          <Column name="cost" class={`${style.costColumn}`}>
            <Header onClick={() => dataSort("cost")}>
              Cost
              <Show when={currentSort()?.sortKey === "cost"}>
                <span>{currentSort()?.isAsc ? " ▲" : " ▼"}</span>
              </Show>
            </Header>
          </Column>

          <Column name="menu" class={`${style.actionColumn}`}>
            <Header class={`${style.noClicky}`}>
              <></>
            </Header>
          </Column>
        </Table>
        <div class={`${style.scrollable}`}>
          <Table
            columns={columns()}
            data={() => paginatedItems()}
          >
            <Column name="name" class={`${style.nameColumn}`}>
              <Cell<Item>>
                {(item) => <span>{item.name}</span>}
              </Cell>
            </Column>

            <Column name="legacy" class={`${style.legacyColumn}`}>
              <Cell<srdItem>>
                {(item) => <span>
                  <Show when={item.legacy === true}>Legacy</Show>  
                </span>}
              </Cell>
            </Column>

            <Column name="cost" class={`${style.costColumn}`}>
              <Cell<srdItem>>
                {(item) => <span>{item?.cost}</span>}
              </Cell>
            </Column>

            <Column name="menu" class={`${style.actionColumn}`}>
              <Cell<srdItem> onClick={(e) => e.stopPropagation()}>
                {(item) => (
                  <ItemsMenu
                    openDialog={() => {
                      setCurrentItem(item);
                      setShowItem((old) => !old);
                    }}
                    item={item}
                  />
                )}
              </Cell>
            </Column>

            <Row
              rowNumber={1}
              onClick={(e, Item) => {
                setCurrentItem(Item);
                setShowItem((old) => !old);
              }}
            />
          </Table>
        </div>
      </div>

      <div class={`${style.paginator}`}>
        <Paginator
          items={searchResults}
          setPaginatedItems={setPaginatedItems}
          transparent
        />
      </div>

      <Show when={showItem() && currentItem()}>
        <ItemPopup show={[showItem, setShowItem]} item={currentItem as any} />
      </Show>
    </Body>
  );
};
