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
import { Body, Cell, Column, Header, Row, Table } from "coles-solid-library";
import { ItemPopup } from "../../../../../shared/components/modals/ItemModal/ItemModal";
import { createSelectionSync, createTableSort, Paginator } from "../../../../../shared";
import { useSearchParams } from "@solidjs/router";
import { Item } from "../../../../../models/generated";
import { srdItem } from "../../../../../models/data/generated";
import { costToCopper } from "../../item";
import styles from "./weaponsView.module.scss";
import SearchBar from "../../../../../shared/components/SearchBar/SearchBar";
import { ItemsMenu } from "../itemsMenu/itemsMenu";

interface viewProps {
  items: Accessor<Item[]>;
}

export const WeaponsView: Component<viewProps> = (props) => {
  const [searchParam, setSearchParam] = useSearchParams();

  const [searchResults, setSearchResults] = createSignal<Item[]>([]);
  const [tabledata, setTableData] = createSignal<Item[]>(props.items());
  const [paginatedItems, setPaginatedItems] = createSignal<Item[]>([]);
  const [currentItem, setCurrentItem] = createSignal<Item | undefined>(
    undefined,
  );
  const [showItem, setShowItem] = createSignal<boolean>(false);
  const { currentSort, dataSort, applySort } = createTableSort<Item>({
    data: [tabledata, setTableData],
    syncSetters: [setSearchResults],
    initial: {sortKey: "cost", isAsc: false},
    valueSelectors: {
      cost: (item) => costToCopper(item?.cost),
      properties: (item) => String(item?.properties?.Damage ?? ""),
    },
  });

  const searchResult$ = createMemo(() =>
    searchResults()?.length > 0 ? searchResults() : props?.items(),
  );

  createEffect(() => {
    const list = props?.items();
    if (list.length === 0) return;
    const param =
      typeof searchParam?.name === "string"
        ? searchParam?.name
        : searchParam?.name?.join(" ");
    const found =
      param &&
      list?.some((i) => i?.name?.toLowerCase() === param?.toLowerCase());
    // Only set if param is missing or invalid, and not already set to first item
    if ((!param || !found) && list?.[0]?.name === param) {
      setSearchParam({ name: list?.[0]?.name });
    }
  });

  const selectedItem = createMemo(() => {
    const list = props?.items();
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

  createEffect(()=>{
    const list = props?.items();
    applySort(list);
  });

  return (
    <Body class={`${styles.itemsBody}`}>
      <div class={`${styles.searchBar}`}>
        <SearchBar dataSource={tabledata} setResults={setSearchResults} />
      </div>

      <div class={`${styles.table}`}>
        <Table
          columns={["name","cost", "menu"]}
          data={() => paginatedItems()}
        >
          <Column name="name" class={`${styles.nameColumn}`}>
            <Header onClick={() => dataSort("name")}>
              Name
              <Show when={currentSort()?.sortKey === "name"}>
                <span>{currentSort()?.isAsc ? " ▲" : " ▼"}</span>
              </Show>
            </Header>
          </Column>

          <Column name="cost" class={`${styles.costColumn}`}>
            <Header onClick={() => dataSort("cost")}>
              Cost
              <Show when={currentSort()?.sortKey === "cost"}>
                <span>{currentSort()?.isAsc ? " ▲" : " ▼"}</span>
              </Show>
            </Header>
          </Column>

          <Column name="menu" class={`${styles.actionColumn}`}>
            <Header class={`${styles.noClicky}`}>
              <></>
            </Header>
          </Column>
        </Table>

        <div class={`${styles.scrollable}`}>
          <Table
            columns={["name", "cost", "menu"]}
            data={() => paginatedItems()}
          >
            <Column name="name" class={`${styles.nameColumn}`}>
              <Cell<srdItem>>{(item) => <span>{item?.name}</span>}</Cell>
            </Column>

            <Column name="cost" class={`${styles.costColumn}`}>
              <Cell<srdItem>>{(item) => <span>{item?.cost}</span>}</Cell>
            </Column>

            <Column name="menu" class={`${styles.actionColumn}`}>
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

      <div>
        <Paginator
          items={searchResult$}
          setPaginatedItems={setPaginatedItems}
          transparent
        />
      </div>

      <Show when={showItem()}>
        <ItemPopup show={[showItem, setShowItem]} item={currentItem as any} />
      </Show>
    </Body>
  );
};
