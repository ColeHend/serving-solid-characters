import { Component, Show, createSignal } from "solid-js";
import { Button, Input, TextArea, addSnackbar } from "coles-solid-library";
import { deleteCustomRule, saveCustomRule } from "../../../customHooks/userRulesManager";
import type { UserRule } from "./rulesDictionary.shared";
import styles from "./rulesDictionary.module.scss";

/**
 * Create/edit form for a single custom rule (mirrors ReviewAgentEditor: plain signals + coles
 * Input/TextArea + addSnackbar). Description is authored as Markdown — the same text the row
 * renders through the `Markdown` component. `props.rule` present = edit, absent = create.
 */
const RuleEditor: Component<{ rule?: UserRule; onDone: () => void }> = (props) => {
  const [name, setName] = createSignal(props.rule?.name ?? "");
  const [category, setCategory] = createSignal(props.rule?.category ?? "");
  const [tags, setTags] = createSignal((props.rule?.tags ?? []).join(", "));
  const [description, setDescription] = createSignal(props.rule?.description ?? "");
  const [busy, setBusy] = createSignal(false);

  const save = async () => {
    if (!name().trim() || !description().trim()) {
      addSnackbar({ message: "Give the rule a name and a description.", severity: "error" });
      return;
    }
    setBusy(true);
    try {
      await saveCustomRule({
        id: props.rule?.id,
        createdAt: props.rule?.createdAt,
        name: name().trim(),
        description: description().trim(),
        category: category().trim() || undefined,
        tags: tags().split(",").map((t) => t.trim()).filter(Boolean),
      });
      addSnackbar({ message: `Rule "${name().trim()}" saved.`, severity: "success" });
      props.onDone();
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
    <div class={styles.editor}>
      <div class={styles.editorRow}>
        <label for="rule-name">Name</label>
        <Input id="rule-name" value={name()} placeholder="e.g. Flanking" onInput={(e) => setName(e.currentTarget.value)} />
      </div>

      <div class={styles.editorRow}>
        <label for="rule-category">Category (optional)</label>
        <Input id="rule-category" value={category()} placeholder="e.g. Combat" onInput={(e) => setCategory(e.currentTarget.value)} />
      </div>

      <div class={styles.editorRow}>
        <label for="rule-tags">Tags (optional, comma-separated)</label>
        <Input id="rule-tags" value={tags()} placeholder="e.g. movement, positioning" onInput={(e) => setTags(e.currentTarget.value)} />
      </div>

      <div class={styles.editorRow}>
        <label for="rule-desc">Description (Markdown supported)</label>
        <TextArea text={description} setText={setDescription} placeholder="Describe the rule. Markdown formatting is supported." />
      </div>

      <div class={styles.editorActions}>
        <Button theme="primary" disabled={busy()} onClick={save}>Save rule</Button>
        <Button transparent disabled={busy()} onClick={props.onDone}>Cancel</Button>
        <Show when={props.rule}>
          <Button transparent disabled={busy()} onClick={remove}>Delete</Button>
        </Show>
      </div>
    </div>
  );
};

export default RuleEditor;
