import { Component, Show, createSignal } from "solid-js";
import { Button, Input, TextArea, addSnackbar } from "coles-solid-library";
import { deleteCustomRule, saveCustomRule } from "../../../customHooks/userRulesManager";
import { SegmentedToggle } from "./segmentedToggle";
import type { UserRule } from "./rulesDictionary.shared";
import styles from "./rulesDictionary.module.scss";

const EDITOR_EDITIONS = [
  { key: "2014", label: "2014 (Legacy)" },
  { key: "2024", label: "2024" },
];

/**
 * Create/edit form for a custom rule, shown in the dictionary's detail pane ("Inscribe a new
 * rule"). Plain signals + coles Input/TextArea + addSnackbar. Description is authored as Markdown
 * — the same text RuleDetail renders. `props.rule` present = edit, absent = create; the parent
 * remounts this component per open (keyed), so the signals reseed from the target rule.
 * Escape closes only the editor: the Modal's own Escape handler listens on `document` in the
 * bubble phase, so stopPropagation here keeps the dialog open.
 */
const RuleEditor: Component<{
  rule?: UserRule;
  onDone: () => void;
  onSaved: (rule: UserRule) => void;
}> = (props) => {
  const [name, setName] = createSignal(props.rule?.name ?? "");
  const [tags, setTags] = createSignal((props.rule?.tags ?? []).join(", "));
  const [edition, setEdition] = createSignal(props.rule?.legacy === true ? "2014" : "2024");
  const [description, setDescription] = createSignal(props.rule?.description ?? "");
  const [busy, setBusy] = createSignal(false);

  const save = async () => {
    if (!name().trim() || !description().trim()) {
      addSnackbar({ message: "Give the rule a name and a description.", severity: "error" });
      return;
    }
    setBusy(true);
    try {
      const saved = await saveCustomRule({
        id: props.rule?.id,
        createdAt: props.rule?.createdAt,
        name: name().trim(),
        description: description().trim(),
        category: props.rule?.category, // no category field in the form; preserved across edits
        tags: tags().split(",").map((t) => t.trim()).filter(Boolean),
        legacy: edition() === "2014",
      });
      addSnackbar({ message: `Rule "${saved.name}" saved.`, severity: "success" });
      props.onSaved(saved);
    } catch (e) {
      addSnackbar({ message: `Could not save rule: ${String(e)}`, severity: "error" });
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!props.rule) return;
    setBusy(true);
    await deleteCustomRule(props.rule.id);
    addSnackbar({ message: "Rule deleted.", severity: "success" });
    setBusy(false);
    props.onDone();
  };

  return (
    <div
      class={styles.editor}
      onKeyDown={(e) => { if (e.key === "Escape") { e.stopPropagation(); props.onDone(); } }}
    >
      <h2 class={styles.editorTitle}>{props.rule ? "Revise a rule" : "Inscribe a new rule"}</h2>

      <div class={styles.editorRow}>
        <label class={styles.fieldLabel} for="rule-name">Name</label>
        <Input
          id="rule-name"
          value={name()}
          placeholder="e.g. Opportunity Attack"
          onInput={(e) => setName(e.currentTarget.value)}
        />
      </div>

      <div class={styles.editorRow}>
        <label class={styles.fieldLabel} for="rule-tags">
          Tags <span class={styles.fieldHint}>(comma-separated, optional)</span>
        </label>
        <Input
          id="rule-tags"
          value={tags()}
          placeholder="Hazard, Combat"
          onInput={(e) => setTags(e.currentTarget.value)}
        />
      </div>

      <div class={styles.editorRow}>
        <span class={styles.fieldLabel}>Edition</span>
        <SegmentedToggle
          options={EDITOR_EDITIONS}
          value={edition()}
          onChange={setEdition}
          ariaLabel="Edition"
          class={styles.editorSeg}
        />
      </div>

      <div class={styles.editorRow}>
        <label class={styles.fieldLabel} for="rule-desc">
          Description <span class={styles.fieldHint}>(Markdown supported)</span>
        </label>
        <TextArea
          id="rule-desc"
          text={description}
          setText={setDescription}
          placeholder="Describe the rule. **Bold**, *italic*, `code`, ### headings and - lists are supported."
        />
      </div>

      <div class={styles.editorActions}>
        <Button theme="primary" disabled={busy()} onClick={save}>Save Rule</Button>
        <Button transparent disabled={busy()} onClick={props.onDone}>Cancel</Button>
        <Show when={props.rule}>
          <Button transparent disabled={busy()} onClick={remove}>Delete</Button>
        </Show>
      </div>
    </div>
  );
};

export default RuleEditor;
