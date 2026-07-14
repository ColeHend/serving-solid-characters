import { Component, Show } from "solid-js";
import { Button, Chip, Icon } from "coles-solid-library";
import { Star, StarFill, Edit } from "coles-solid-library/icons";
import { FlatCard } from "../../flatCard/flatCard";
import Markdown from "../../MarkDown/MarkDown";
import { Rule } from "../../../../models/generated";
import { starredRuleIds, toggleFavorite } from "../../../customHooks/userRulesManager";
import styles from "./rulesDictionary.module.scss";

/**
 * One accordion row in the rules dictionary. Header shows a star toggle + name + category chip;
 * expanding reveals the rule's Markdown text. Custom rules also get an Edit affordance. The star
 * lives inside FlatCard's `headerName`; its click stops propagation so it never toggles the panel.
 */
const RuleRow: Component<{ rule: Rule; isCustom: boolean; onEdit: (rule: Rule) => void }> = (props) => {
  const starred = () => starredRuleIds().has(props.rule.id);

  return (
    <FlatCard
      transparent
      getRidOfTopBorder
      headerName={
        <span class={styles.rowHeader}>
          <span
            class={styles.star}
            role="button"
            tabIndex={0}
            title={starred() ? "Unstar" : "Star"}
            onClick={(e) => { e.stopPropagation(); void toggleFavorite(props.rule.id); }}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); void toggleFavorite(props.rule.id); } }}
          >
            <Icon icon={starred() ? StarFill : Star} size="medium" />
          </span>
          <span class={styles.rowName}>{props.rule.name}</span>
          <Show when={props.rule.category}>
            <Chip value={props.rule.category!} />
          </Show>
          <Show when={props.isCustom}>
            <Chip value="Custom" class={styles.customChip} />
          </Show>
        </span>
      }
    >
      <div class={styles.rowBody}>
        <Markdown text={props.rule.description ?? ""} />
        <Show when={props.isCustom}>
          <div class={styles.rowActions}>
            <Button transparent title="Edit rule" onClick={() => props.onEdit(props.rule)}>
              <Icon icon={Edit} size="small" /> Edit
            </Button>
          </div>
        </Show>
      </div>
    </FlatCard>
  );
};

export default RuleRow;
