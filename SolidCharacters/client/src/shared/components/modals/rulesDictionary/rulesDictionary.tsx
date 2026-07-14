import { Accessor, Component, For, Setter, Show, createMemo, createSignal, onMount } from "solid-js";
import { Button, Icon, Input, Modal } from "coles-solid-library";
import { Add, Search, Star, StarFill } from "coles-solid-library/icons";
import { Rule } from "../../../../models/generated";
import { useGetSrdRules } from "../../../customHooks/dndInfo/info/srd/rules";
import { getUserSettings } from "../../../customHooks/userSettings";
import {
  ensureUserRulesLoaded,
  starredRuleIds,
  userCustomRules,
} from "../../../customHooks/userRulesManager";
import { matchRule, mergeRules, sortRules, type RuleEdition, type UserRule } from "./rulesDictionary.shared";
import RuleRow from "./ruleRow";
import RuleEditor from "./ruleEditor";
import styles from "./rulesDictionary.module.scss";

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

export const RulesDictionary: Component<RulesDictProps> = (props) => {
  const [userSettings] = getUserSettings();
  const [edition, setEdition] = createSignal<RuleEdition>(editionFromSetting(userSettings().dndSystem));
  const [search, setSearch] = createSignal("");
  const [starredOnly, setStarredOnly] = createSignal(false);
  const [editorOpen, setEditorOpen] = createSignal(false);
  const [editTarget, setEditTarget] = createSignal<UserRule | undefined>(undefined);

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
    return sortRules(list, favs);
  });

  const openAdd = () => { setEditTarget(undefined); setEditorOpen(true); };
  const openEdit = (rule: Rule) => { setEditTarget(rule as UserRule); setEditorOpen(true); };
  const closeEditor = () => { setEditorOpen(false); setEditTarget(undefined); };

  return (
    <Modal title="Rules Dictionary" show={[props.show, props.setShow]} width="min(720px, 95vw)">
      <Show
        when={!editorOpen()}
        fallback={<RuleEditor rule={editTarget()} onDone={closeEditor} />}
      >
        <div class={styles.toolbar}>
          <div class={styles.searchWrap}>
            <Icon icon={Search} size="medium" />
            <Input
              transparent
              type="text"
              placeholder="Search rules…"
              value={search()}
              onInput={(e) => setSearch(e.currentTarget.value)}
              class={styles.searchInput}
            />
          </div>
          <Button title="Add a custom rule" onClick={openAdd}>
            <Icon icon={Add} size="medium" /> Add
          </Button>
        </div>

        <div class={styles.filters}>
          <div class={styles.editionToggle}>
            <For each={EDITIONS}>{(ed) => (
              <Button
                transparent={edition() !== ed.key}
                theme={edition() === ed.key ? "primary" : undefined}
                onClick={() => setEdition(ed.key)}
              >
                {ed.label}
              </Button>
            )}</For>
          </div>
          <Button
            transparent={!starredOnly()}
            theme={starredOnly() ? "primary" : undefined}
            title="Show starred rules only"
            onClick={() => setStarredOnly((v) => !v)}
          >
            <Icon icon={starredOnly() ? StarFill : Star} size="medium" /> Starred
          </Button>
        </div>

        <div class={styles.list}>
          <For each={visible()} fallback={<div class={styles.empty}>No rules match your search.</div>}>
            {(rule) => (
              <RuleRow rule={rule} isCustom={customIds().has(rule.id)} onEdit={openEdit} />
            )}
          </For>
        </div>
      </Show>
    </Modal>
  );
};
