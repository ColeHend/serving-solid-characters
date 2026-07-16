import {
  Component,
  Show,
  createEffect,
  createMemo,
  createSignal,
  onCleanup,
  onMount,
} from "solid-js";
import {
  Body,
  Table,
  Cell,
  Header,
  Column,
  Row,
  Button,
  Icon,
} from "coles-solid-library";
import { FilterAlt } from "coles-solid-library/icons";
import { homebrewManager, Paginator, createTableSort, createTableFilter, FilterFieldConfig, SortState, getUserSettings } from "../../../shared";
import { useSearchParams } from "@solidjs/router";
import { FeatMenu } from "./featMenu/featMenu";
import { useDnDFeats } from "../../../shared/customHooks/dndInfo/info/all/feats";
import { Feat, PrerequisiteType } from "../../../models/generated";
import FeatView from "../../../shared/components/modals/featModal/featView";
import SearchBar from "../../../shared/components/SearchBar/SearchBar";
import { FilterDialog } from "../../../shared/components/filterDialog/filterDialog";
import { FilterChips } from "../../../shared/components/filterDialog/filterChips";
import { trackRecentItem } from "../../../shared/customHooks/useRecentItems";
import styles from "./feats.module.scss";

// Feat has no root name/category; sort/filter keys need them on the row type.
type FeatRow = Feat & { name?: string; category?: string };

const FEAT_INITIAL_SORT: SortState = { sortKey: "name", isAsc: true };

const STATS = ["STR", "DEX", "CON", "INT", "WIS", "CHA"];
const LEVELS = Array.from({ length: 20 }, (_, i) => String(i + 1));

// Handles both stat prereq shapes: "STR 13" and "STR:13 or DEX:13"
const statTokens = (feat: FeatRow): string[] => {
  const out = new Set<string>();
  (feat.prerequisites ?? []).forEach(p => {
    if (p.type === PrerequisiteType.Stat) {
      (p.value.match(/\b(STR|DEX|CON|INT|WIS|CHA)\b/gi) ?? []).forEach(s => out.add(s.toUpperCase()));
    }
  });
  return [...out];
};

const levelPrereq = (feat: FeatRow): number | undefined => {
  const p = (feat.prerequisites ?? []).find(p => p.type === PrerequisiteType.Level);
  return p ? parseInt(p.value, 10) : undefined;
};

const featFilterFields: FilterFieldConfig<FeatRow>[] = [
  { key: "category", label: "Category", getValues: (feat) => feat.details?.metadata?.category },
  { key: "stat", label: "Stat", options: STATS, getValues: statTokens },
  {
    key: "level", label: "Level", options: LEVELS,
    // "Available at level": no level prereq always passes, otherwise prereq <= a selected level
    matches: (feat, selected) => {
      const req = levelPrereq(feat);
      return req === undefined || selected.some(s => req <= Number(s));
    },
  },
  {
    key: "prerequisites", label: "Prerequisite",
    getValues: (feat) => (feat.prerequisites ?? [])
      .filter(p => p.type === PrerequisiteType.String)
      .map(p => p.value),
  },
];

const featsList: Component = () => {
  const [currentFeat, setCurrentFeat] = createSignal<Feat | undefined>(undefined);
  const [showFeatModal,setShowFeatModal] = createSignal<boolean>(false);
  const [showFilter, setShowFilter] = createSignal<boolean>(false);
  const [paginatedFeats, setPaginatedFeats] = createSignal<FeatRow[]>([]);
  const [searchResult, setSearchResult] = createSignal<FeatRow[]>([]);
  const [tableData, setTableData] = createSignal<FeatRow[]>([]);

  const [searchParam, setSearchParam] = useSearchParams();
  const srdFeats = useDnDFeats();
  const [userSettings] = getUserSettings();

  const system = createMemo(() => userSettings().dndSystem);

  const is2014 = createMemo(() => system() === "2014" || system() === "both");

  const columns = createMemo(() => is2014() ? ["name","legacy","options"] : ["name","options"]);

  // Create a unified list including homebrew feats; normalize any legacy feats missing details
  const allFeats = createMemo<Feat[]>(() => {
    const base = srdFeats() || [];
    const homebrew = (homebrewManager.feats() || []).map((f: any) => {
      if (!f.details) {
        f.details = { name: f.name || '', description: Array.isArray(f.desc) ? f.desc[0] : (f.desc || '') };
      }
      return f as Feat;
    });
    // Avoid duplicates by name (prefer homebrew override)
    const seen = new Set<string>();
    const merged: Feat[] = [];
    [...base, ...homebrew].forEach(f => {
      const key = f.details?.name || (f as any).name;
      if (!key) return;
      if (seen.has(key.toLowerCase())) return;
      seen.add(key.toLowerCase());
      merged.push(f);
    });
    return merged;
  });

  const featSource = createMemo<FeatRow[]>(() => allFeats().filter(f => f?.details?.name));

  const { currentSort, dataSort, applySort, setSort } = createTableSort<FeatRow>({
    data: [tableData, setTableData],
    syncSetters: [setSearchResult],
    initial: FEAT_INITIAL_SORT,
    valueSelectors: {
      name: (feat) => feat.details?.name,
      category: (feat) => feat.details?.metadata?.category,
    },
  });

  const filter = createTableFilter<FeatRow>({
    source: featSource,
    fields: featFilterFields,
    legacy: { getValue: (feat) => feat.legacy },
    sort: {
      currentSort,
      setSort,
      initial: FEAT_INITIAL_SORT,
      options: [
        { key: "name", label: "Name" },
        { key: "category", label: "Category" },
        { key: "legacy", label: "Legacy" },
      ],
    },
  });

  createEffect(() => {
    applySort(filter.filteredData());
  });

  const paginateItems = createMemo(() =>
    searchResult().length > 0 ? searchResult() : tableData()
  );

  // Ensure we always have a valid name param once feats load (or version changes)
  createEffect(()=>{
    const list = allFeats();
    if (list.length === 0) return;
    const param = typeof searchParam.name !== "string" ? searchParam.name?.[0]: searchParam.name;
    const found = param && list.some(f => f.details?.name && f.details.name.toLowerCase() === param.toLowerCase());
    if (!found) {
      setSearchParam({ name: list[0].details?.name || ''});
    }
  });

  const selectedFeat = createMemo(() => {
  const list = allFeats();
    if (list.length === 0) return undefined;
    const param = typeof searchParam.name !== "string" ? searchParam.name?.[0]: searchParam.name;
    const target = (param || list[0].details?.name || '').toLowerCase();
    return list.find(f => f.details?.name && f.details.name.toLowerCase() === target) || list[0];
  })


  // Keep currentFeat in sync with derived selectedFeat
  createEffect(() => {
    const sel = selectedFeat();
    if (sel) setCurrentFeat(sel);
  })

  createEffect(()=>{
    const cur = currentFeat();

    if(showFeatModal() && cur?.details?.name) {
      setSearchParam({ name: cur.details.name})
      trackRecentItem({
        name: cur.details.name,
        type: "feat",
        route: `/info/feats?search=${encodeURIComponent(cur.details.name)}`,
      });
    } else if (!showFeatModal()) {
      setSearchParam({ name: ""})
    }
  })

  onMount(()=>{
    document.body.classList.add('feats-bg');
  })

  onCleanup(()=>{
    document.body.classList.remove('feats-bg');
  })

  return (
    <Body class={`${styles.body}`}>
      <h1>Feats</h1>

      <div class={`${styles.searchDiv}`}>
        <SearchBar
          dataSource={tableData}
          setResults={setSearchResult}
          searchFunction={(data,search)=>{
            return (data.details?.name ?? "").toLowerCase().trim().includes(search.toLowerCase().trim());
          }}
          seed={typeof searchParam.search === "string" ? searchParam.search : searchParam.search?.[0]}></SearchBar>
        <Button onClick={() => setShowFilter(true)} title="Filter & sort">
          <Icon icon={FilterAlt} size="medium" />
        </Button>
      </div>

      <FilterChips filter={filter} class={`${styles.filterChips}`} />

      <div class={`${styles.featTable}`}>
        <Show when={columns()} keyed>
          <>
            <Table data={paginatedFeats} columns={columns()}>
              <Column name="name" class={`${styles.nameCol}`}>
                <Header onClick={() => dataSort("name")}>
                  Name
                  <Show when={currentSort().sortKey === "name"}>
                    <span>{currentSort().isAsc ? " ▲" : " ▼"}</span>
                  </Show>
                </Header>
              </Column>
              <Column name="legacy" class={`${styles.legacyCol}`}>
                <Header onClick={() => dataSort("legacy")}>
                  Legacy
                  <Show when={currentSort().sortKey === "legacy"}>
                    <span>{currentSort().isAsc ? " ▲" : " ▼"}</span>
                  </Show>
                </Header>
              </Column>
              <Column name="options" class={`${styles.optionsCol}`}>
                <Header><></></Header>
              </Column>
            </Table>

            <div class={`${styles.scrollable}`}>
              <Table data={paginatedFeats} columns={columns()}>
                <Column name="name" class={`${styles.nameCol}`}>
                  <Cell<FeatRow>>
                    { (feat) => <span>{feat.details?.name || feat.name || ''}</span>}
                  </Cell>
                </Column>
                <Column name="legacy" class={`${styles.legacyCol}`}>
                  <Cell<FeatRow>>
                    { (feat) => <Show when={feat.legacy === true}><span>Legacy</span></Show>}
                  </Cell>
                </Column>
                <Column name="options" class={`${styles.optionsCol}`}>
                  <Cell<FeatRow> onClick={(e)=>e.stopPropagation()}>
                    { (feat) => <FeatMenu feat={feat} />}
                  </Cell>
                </Column>
                <Row onClick={(e, feat)=>{
                  setCurrentFeat(feat);
                  setShowFeatModal((old) => !old);
                }}/>
              </Table>
            </div>
          </>
        </Show>
      </div>

      <Show when={showFeatModal()}>
        <FeatView feat={currentFeat as any} show={[showFeatModal,setShowFeatModal]} width="40%" height="40%" />
      </Show>

      <Show when={showFilter()}>
        <FilterDialog title="Feats" show={[showFilter, setShowFilter]} filter={filter} />
      </Show>

      <div class={`${styles.paginator}`}>
        <Paginator items={paginateItems} setPaginatedItems={setPaginatedFeats} transparent/>
      </div>
    </Body>
  );
}
export default featsList;
