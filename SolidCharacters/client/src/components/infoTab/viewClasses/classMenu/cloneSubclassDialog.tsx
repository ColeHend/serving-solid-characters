import { Accessor, Component, For, Setter, createMemo, createSignal, runWithOwner } from "solid-js";
import { useNavigate } from "@solidjs/router";
import { Button, Modal, Select, Option } from "coles-solid-library";
import { homebrewManager } from "../../../../shared";
import { Subclass } from "../../../../models/generated";
import styles from "./cloneSubclassDialog.module.scss";

interface CloneSubclassDialogProps {
    show: [Accessor<boolean>, Setter<boolean>];
    parentClassName: string;
    subclasses: Accessor<Subclass[]>;
}

export const CloneSubclassDialog: Component<CloneSubclassDialogProps> = (props) => {
  const navigate = useNavigate();
  const [selected, setSelected] = createSignal('');

  // The merged list shows a cloned subclass twice (SRD + homebrew); one option per name.
  const options = createMemo(() => {
    const seen = new Set<string>();
    return props.subclasses().filter(s => {
      const key = (s.name || '').toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  });

  const value = createMemo(() => selected() || options()[0]?.name || '');

  const isHomebrew = createMemo(() => homebrewManager.subclasses().some(s =>
    (s.parentClass || '').toLowerCase() === props.parentClassName.toLowerCase()
    && (s.name || '').toLowerCase() === value().toLowerCase()));

  const confirm = () => {
    const subclassName = value();
    if (!subclassName) return;
    props.show[1](false);
    navigate(`/homebrew/create/subclasses?name=${encodeURIComponent(props.parentClassName)}&subclass=${encodeURIComponent(subclassName)}`);
  };

  return <Modal title="Clone/Edit Subclass" show={props.show}>
    <div class={`${styles.body}`}>
      <Select value={value()} onChange={(v) => runWithOwner(null, () => setSelected(v as string))}>
        <For each={options()}>{(s) => <Option value={s.name}>{s.name}</Option>}</For>
      </Select>
      <div class={`${styles.actions}`}>
        <Button onClick={() => props.show[1](false)}>Cancel</Button>
        <Button theme="primary" onClick={confirm}>{isHomebrew() ? "Edit" : "Clone and Edit"}</Button>
      </div>
    </div>
  </Modal>;
};
