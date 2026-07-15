import { Component, For, Show } from "solid-js";
import { Icon } from "coles-solid-library";
import { Star, StarFill } from "coles-solid-library/icons";
import { Rule } from "../../../../models/generated";
import { starredRuleIds, toggleFavorite } from "../../../customHooks/userRulesManager";
import { editionBadge } from "./rulesDictionary.shared";
import styles from "./rulesDictionary.module.scss";

/**
 * One selectable row in the dictionary index: star toggle + small-caps name + tag chips + edition
 * badge. Clicking anywhere on the row selects the rule; the star is a nested control whose
 * click/keys stop propagation so starring never changes the selection. (div+role rather than a
 * <button> — a nested interactive star inside a real button is invalid HTML.)
 */
const RuleRow: Component<{
  rule: Rule;
  isCustom: boolean;
  selected: boolean;
  onSelect: (id: string) => void;
}> = (props) => {
  const starred = () => starredRuleIds().has(props.rule.id);
  const badge = () => editionBadge(props.rule);

  return (
    <div
      class={styles.row}
      role="button"
      tabIndex={0}
      data-selected={props.selected}
      onClick={() => props.onSelect(props.rule.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); props.onSelect(props.rule.id); }
      }}
    >
      <span
        class={styles.star}
        classList={{ [styles.starOn]: starred() }}
        role="button"
        tabIndex={0}
        title={starred() ? "Unstar" : "Star"}
        onClick={(e) => { e.stopPropagation(); void toggleFavorite(props.rule.id); }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); void toggleFavorite(props.rule.id); }
        }}
      >
        <Icon icon={starred() ? StarFill : Star} size="small" />
      </span>
      <span class={styles.rowName}>{props.rule.name}</span>
      <Show when={props.rule.category}><span class={styles.tag}>{props.rule.category}</span></Show>
      <For each={props.rule.tags ?? []}>{(tag) => <span class={styles.tag}>{tag}</span>}</For>
      <Show when={props.isCustom}><span class={styles.tag}>Custom</span></Show>
      <Show when={badge()}>
        <span class={`${styles.badge} ${badge() === "2014" ? styles.badge2014 : styles.badge2024}`}>{badge()}</span>
      </Show>
    </div>
  );
};

export default RuleRow;
