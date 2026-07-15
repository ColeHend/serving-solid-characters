import { Accessor, Component, For, Setter, Show, createMemo, createSignal, onMount } from "solid-js";
import { Button, Icon, Input, Modal } from "coles-solid-library";
import { Add, Close, Search, Star, StarFill, West } from "coles-solid-library/icons";
import { Rule } from "../../../../models/generated";
import { useGetSrdRules } from "../../../customHooks/dndInfo/info/srd/rules";
import { getUserSettings } from "../../../customHooks/userSettings";
import {
  ensureUserRulesLoaded,
  starredRuleIds,
  userCustomRules,
} from "../../../customHooks/userRulesManager";
import { matchRule, mergeRules, sortRules, type RuleEdition, type UserRule } from "./rulesDictionary.shared";
import { SegmentedToggle } from "./segmentedToggle";
import RuleRow from "./ruleRow";
import RuleDetail from "./ruleDetail";
import RuleEditor from "./ruleEditor";
import styles from "./rulesDictionary.module.scss";
import { getScreenSize } from "../../../customHooks/utility/tools/getScreenSize";

interface RulesDictProps {
  show: Accessor<boolean>;
  setShow: Setter<boolean>;
}

const EDITIONS: { key: RuleEdition; label: string }[] = [
  { key: "2014", label: "2014" },
  { key: "2024", label: "2024" },
  { key: "both", label: "Both" },
];

/** Map the app-wide dndSystem setting to a dictionary edition (default 2014). */
const editionFromSetting = (dndSystem: string): RuleEdition =>
  dndSystem === "2024" ? "2024" : dndSystem === "both" ? "both" : "2014";

/**
 * Two-pane "arcane grimoire" rules dictionary: index of rules on the left, the selected rule's
 * detail (or the add/edit form) on the right. All colors come from theme custom properties via
 * the module's --rules-* tokens, so new app themes restyle it without touching this component.
 */
export const RulesDictionary: Component<RulesDictProps> = (props) => {
  const [userSettings] = getUserSettings();
  const [edition, setEdition] = createSignal<RuleEdition>(editionFromSetting(userSettings().dndSystem));
  const [search, setSearch] = createSignal("");
  const [starredOnly, setStarredOnly] = createSignal(false);

  const { screenSize } = getScreenSize({small: 768});
  const isMobile = createMemo(() => screenSize() === "small");
  // Editor state doubles as the "editor open" flag. A fresh object per open + keyed <Show>
  // remounts RuleEditor so its form signals reseed from the target rule (or blank for create).
  const [editorState, setEditorState] = createSignal<{ rule?: UserRule } | undefined>(undefined);
  const [selectedId, setSelectedId] = createSignal<string | undefined>(undefined);
  // Which pane the <=768px layout shows; desktop always shows both (CSS ignores this signal).
  const [mobilePane, setMobilePane] = createSignal<"index" | "detail">("index");

  onMount(() => void ensureUserRulesLoaded());

  // Merge SRD (per selected edition) + custom rules, de-duped by id. useGetSrdRules self-loads and
  // returns a reactive accessor; calling it inside the memo re-tracks when the edition changes.
  const customIds = createMemo(() => new Set(userCustomRules().map((r) => r.id)));
  const merged = createMemo<Rule[]>(() => mergeRules(useGetSrdRules(edition())(), userCustomRules()));

  const visible = createMemo<Rule[]>(() => {
    const favs = starredRuleIds();
    let list = merged();
    if (starredOnly()) list = list.filter((r) => favs.has(r.id));
    list = list.filter((r) => matchRule(r, search()));
    return sortRules(list);
  });

  // Derived selection — no effect needed: the explicit pick while it's visible, else the first
  // visible rule, else undefined (empty state in the detail pane).
  const selected = createMemo<Rule | undefined>(() => {
    const list = visible();
    return list.find((r) => r.id === selectedId()) ?? list[0];
  });

  const selectRow = (id: string) => { setSelectedId(id); setMobilePane("detail"); };
  const openAdd = () => { setEditorState({}); setMobilePane("detail"); };
  const openEdit = (rule: Rule) => { setEditorState({ rule: rule as UserRule }); setMobilePane("detail"); };
  const closeEditor = () => setEditorState(undefined);

  /** Reveal a just-saved rule: clear any filter that could hide it, then select it. */
  const onSaved = (saved: UserRule) => {
    setStarredOnly(false);
    setSearch("");
    const savedEdition: RuleEdition = saved.legacy ? "2014" : "2024";
    if (edition() !== "both" && edition() !== savedEdition) setEdition("both");
    setSelectedId(saved.id);
    closeEditor();
  };

  return (
    <Modal
      noHeader
      title="Rules Dictionary"
      show={[props.show, props.setShow]}
      width="min(1100px, 95vw)"
      height="min(760px, 90vh)"
      class={styles.grimoireDialog}
    >
      <div class={styles.grimoire}>
        <header class={styles.header}>
          <Show when={!isMobile()}>
            <span class={styles.diamond} aria-hidden="true">◆</span>
            <h2 class={styles.headerTitle}>Rules Dictionary</h2>
            <span class={styles.headerRule} aria-hidden="true" />
            <SegmentedToggle
              options={EDITIONS}
              value={edition()}
              onChange={(key) => setEdition(key as RuleEdition)}
              ariaLabel="Edition filter"
            />
            <button type="button" class={styles.iconBtn} aria-label="Close" title="Close" onClick={() => props.setShow(false)}>
              <Icon icon={Close} size="medium" />
            </button>
          </Show>
          <Show when={isMobile()}>
            <div style={{
              display: 'flex',
              'flex-direction': 'row',
              'align-items': 'center'
            }}>
              <span style={{
                'margin-right': '11px'
              }} class={styles.diamond} aria-hidden="true">◆</span>
              <h2 class={styles.headerTitle}>Rules Dictionary</h2>
              <button type="button" class={styles.iconBtn} aria-label="Close" title="Close" onClick={() => props.setShow(false)}>
                <Icon icon={Close} size="medium" />
              </button>
            </div>
            <span class={styles.headerRule} aria-hidden="true" />
            <SegmentedToggle
              options={EDITIONS}
              value={edition()}
              onChange={(key) => setEdition(key as RuleEdition)}
              ariaLabel="Edition filter"
            />
          </Show>

        </header>

        <div class={styles.toolbar}>
          <div class={styles.searchPill}>
            <Icon icon={Search} size="small" />
            <Input
              transparent
              type="text"
              placeholder="Search rules, tags, text…"
              value={search()}
              onInput={(e) => setSearch(e.currentTarget.value)}
              class={styles.searchInput}
            />
          </div>
          <Show when={!isMobile()}>
            <Button
              class={styles.pillBtn}
              transparent={!starredOnly()}
              theme={starredOnly() ? "primary" : undefined}
              title="Show starred rules only"
              onClick={() => setStarredOnly((v) => !v)}
            >
              <Icon icon={starredOnly() ? StarFill : Star} size="small" /> Starred
            </Button>
            <Button class={styles.pillBtn} theme="primary" title="Add a custom rule" onClick={openAdd}>
              <Icon icon={Add} size="small" /> Add Rule
            </Button>
          </Show>
          <Show when={isMobile()}>
            <div>
              <Button
                class={styles.pillBtn}
                transparent={!starredOnly()}
                theme={starredOnly() ? "primary" : undefined}
                title="Show starred rules only"
                onClick={() => setStarredOnly((v) => !v)}
              >
                <Icon icon={starredOnly() ? StarFill : Star} size="small" /> Starred
              </Button>
              <Button class={styles.pillBtn} theme="primary" title="Add a custom rule" onClick={openAdd}>
                <Icon icon={Add} size="small" /> Add Rule
              </Button>
            </div>
          </Show>
        </div>

        <div class={styles.panes} data-mobile-pane={mobilePane()}>
          <section class={styles.indexPane} aria-label="Rule index">
            <div class={styles.indexHead}>
              <span class={styles.indexLabel}>Index</span>
              <span class={styles.indexCount}>{visible().length} {visible().length === 1 ? "rule" : "rules"}</span>
            </div>
            <For each={visible()} fallback={<div class={styles.empty}>No rules match your search.</div>}>
              {(rule) => (
                <RuleRow
                  rule={rule}
                  isCustom={customIds().has(rule.id)}
                  selected={selected()?.id === rule.id}
                  onSelect={selectRow}
                />
              )}
            </For>
          </section>

          <section class={styles.detailPane} aria-label="Rule detail">
            <Show when={mobilePane() === "detail"}>
              <button type="button" class={styles.backBtn} onClick={() => setMobilePane("index")}>
                <Icon icon={West} size="small" /> Index
              </button>
            </Show>
            <Show
              keyed
              when={editorState()}
              fallback={
                <RuleDetail
                  rule={selected()}
                  isCustom={!!selected() && customIds().has(selected()!.id)}
                  onEdit={openEdit}
                />
              }
            >
              {(state) => <RuleEditor rule={state.rule} onDone={closeEditor} onSaved={onSaved} />}
            </Show>
          </section>
        </div>
      </div>
    </Modal>
  );
};
