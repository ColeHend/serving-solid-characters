import { Component, For, Show, createSignal } from "solid-js";
import { Button, Input, Modal, Option, Select, addSnackbar } from "coles-solid-library";
import { RulesetSelection } from "../../../../models/character.model";
import { ALIGNMENTS } from "../rules/constants";
import { reconcileEdition } from "../state/reconcileEdition";
import { useCreate } from "../state/createContext";
import styles from "./topBar.module.scss";

interface TopBarProps {
  onSave: () => void;
  onCreateSheet: () => void;
  onDelete: () => void;
  saveDisabled: boolean;
}

/** Sticky page header: name, alignment, rules toggle, live summary, level badge, actions. */
export const TopBar: Component<TopBarProps> = (props) => {
  const { draft, actions, derived, loadEditionData, editId } = useCreate();
  const [showConfirm, setShowConfirm] = createSignal(false);
  const [pendingSwitch, setPendingSwitch] = createSignal<{
    target: RulesetSelection;
    dropped: string[];
    apply: () => void;
  } | null>(null);

  const switchEdition = async (target: RulesetSelection) => {
    if (target === draft.edition) return;
    try {
      const data = await loadEditionData(target);
      const { next, dropped } = reconcileEdition(draft, target, data);
      const apply = () => {
        actions.load(next);
        setShowConfirm(false);
      };
      if (dropped.length > 0) {
        setPendingSwitch({ target, dropped, apply });
        setShowConfirm(true);
      } else {
        apply();
      }
    } catch (err) {
      console.error("edition switch failed", err);
      addSnackbar({ message: `Could not load the ${target} rules data`, severity: "error" });
    }
  };

  return (
    <div class={styles.topBar}>
      <div class={styles.nameWrap}>
        <Input
          value={draft.name}
          onInput={(e) => actions.setName(e.currentTarget.value)}
          placeholder="Name your character…"
          transparent
        />
      </div>

      <Select value={draft.alignment} onChange={(value: string) => actions.setAlignment(value)}>
        <For each={ALIGNMENTS}>{(alignment) => <Option value={alignment}>{alignment}</Option>}</For>
      </Select>

      <div class={styles.editionToggle} role="group" aria-label="Rules edition">
        <button
          type="button"
          classList={{ [styles.editionActive]: draft.edition === "2024" }}
          onClick={() => switchEdition("2024")}
        >
          2024 Rules
        </button>
        <button
          type="button"
          classList={{ [styles.editionActive]: draft.edition === "2014" }}
          onClick={() => switchEdition("2014")}
        >
          2014 Rules
        </button>
        <button
          type="button"
          classList={{ [styles.editionActive]: draft.edition === "both" }}
          onClick={() => switchEdition("both")}
        >
          Both
        </button>
      </div>

      <div class={styles.spacer} />

      <Show when={derived.classSummary()}>
        <span class={styles.summary}>
          {[draft.species, derived.classSummary(), draft.background].filter(Boolean).join(" · ")}
        </span>
      </Show>
      <span class={styles.levelBadge}>Level {derived.totalLevel()}</span>

      <div class={styles.actions}>
        <Button onClick={props.onCreateSheet} transparent title="Export a PDF sheet">
          PDF
        </Button>
        <Show when={editId()}>
          <Button onClick={props.onDelete} theme="error" transparent>
            Delete
          </Button>
        </Show>
        <Button onClick={props.onSave} disabled={props.saveDisabled}>
          {editId() ? "Update" : "Save"}
        </Button>
      </div>

      <Modal title="Switch rules edition?" show={[showConfirm, setShowConfirm]} width="440px">
        <div class={styles.confirmBody}>
          <p>Switching to {pendingSwitch()?.target} Rules removes what that edition doesn't have:</p>
          <ul>
            <For each={pendingSwitch()?.dropped ?? []}>{(loss) => <li>{loss}</li>}</For>
          </ul>
          <div class={styles.confirmActions}>
            <Button transparent onClick={() => setShowConfirm(false)}>
              Cancel
            </Button>
            <Button onClick={() => pendingSwitch()?.apply()}>Switch</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
