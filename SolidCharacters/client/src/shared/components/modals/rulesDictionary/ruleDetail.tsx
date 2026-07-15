import { Component, For, Show } from "solid-js";
import { Button, Icon } from "coles-solid-library";
import { Edit } from "coles-solid-library/icons";
import Markdown from "../../MarkDown/MarkDown";
import { Rule } from "../../../../models/generated";
import { editionBadge } from "./rulesDictionary.shared";
import styles from "./rulesDictionary.module.scss";

/**
 * Read view for the dictionary's detail pane: display-serif title + edition badge, tag chips,
 * divider, then the rule's Markdown body. Custom rules get an Edit affordance.
 */
const RuleDetail: Component<{
  rule: Rule | undefined;
  isCustom: boolean;
  onEdit: (rule: Rule) => void;
}> = (props) => {
  const badge = () => (props.rule ? editionBadge(props.rule) : undefined);

  return (
    <Show when={props.rule} fallback={<div class={styles.detailEmpty}>Select a rule to read it.</div>}>
      <article class={styles.detail}>
        <div class={styles.detailHead}>
          <h2 class={styles.detailTitle}>{props.rule!.name}</h2>
          <Show when={badge()}>
            <span class={`${styles.badge} ${badge() === "2014" ? styles.badge2014 : styles.badge2024}`}>{badge()}</span>
          </Show>
          <Show when={props.isCustom}>
            <Button transparent class={styles.detailEdit} title="Edit rule" onClick={() => props.onEdit(props.rule!)}>
              <Icon icon={Edit} size="small" /> Edit
            </Button>
          </Show>
        </div>
        <Show when={props.rule!.category || (props.rule!.tags?.length ?? 0) > 0 || props.isCustom}>
          <div class={styles.detailChips}>
            <Show when={props.rule!.category}><span class={styles.tag}>{props.rule!.category}</span></Show>
            <For each={props.rule!.tags ?? []}>{(tag) => <span class={styles.tag}>{tag}</span>}</For>
            <Show when={props.isCustom}><span class={styles.tag}>Custom</span></Show>
          </div>
        </Show>
        <hr class={styles.detailRule} />
        <Markdown text={props.rule!.description ?? ""} class={styles.detailBody} />
      </article>
    </Show>
  );
};

export default RuleDetail;
