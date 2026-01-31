import { Component, For, Show, createSignal } from "solid-js";
import { Button, Chip, Modal, Input, FormField } from "coles-solid-library";
import styles from "../backgrounds.module.scss";
import { FlatCard } from "../../../../../../shared/components/flatCard/flatCard";

interface EquipGroup {
  optionKeys?: string[];
  items?: string[];
}

interface Props {
  collapsed: boolean | undefined;
  toggle: (k: string) => void;
  groups: EquipGroup[];
  activeKey: string | undefined;
  optionKeys: string[];
  selectedItems: string[];
  onSelectKey: (k: string) => void;
  onCommitGroup: (keys: string[], items: string[]) => void;
  candidateItems: string[];
  // Pending item management became internal; external props kept optional for backward compat.
  addPendingItem?: (it: string) => void;
  pendingItems?: string[];
  removePendingItem?: (it: string) => void;
  clearPending?: () => void;
  error?: boolean;
}

const EquipmentSection: Component<Props> = (p) => {
  const [show, setShow] = createSignal(false);
  const [showItemModal, setShowItemModal] = createSignal(false);
  const [equipKeyInput, setEquipKeyInput] = createSignal("");
  const [itemSearch, setItemSearch] = createSignal("");
  // Internal pending items state (fallback when parent does not manage it)
  const [internalPending, setInternalPending] = createSignal<string[]>(
    p.pendingItems ? [...p.pendingItems] : []
  );
  const usingExternal = () => typeof p.addPendingItem === "function";
  const pending = () =>
    usingExternal() ? p.pendingItems || [] : internalPending();
  const addPending = (it: string) => {
    const val = it.trim();
    if (!val) return;
    if (usingExternal()) {
      p.addPendingItem && p.addPendingItem(val);
    } else {
      setInternalPending((list) =>
        list.includes(val) ? list : [...list, val]
      );
    }
  };
  const removePending = (it: string) => {
    if (usingExternal()) {
      p.removePendingItem && p.removePendingItem(it);
    } else {
      setInternalPending((list) => list.filter((v) => v !== it));
    }
  };
  const clearPending = () => {
    if (usingExternal()) {
      p.clearPending && p.clearPending();
    } else {
      setInternalPending([]);
    }
  };
  const filtered = () => {
    const term = itemSearch().toLowerCase();
    return term
      ? p.candidateItems.filter((i) => i.toLowerCase().includes(term))
      : p.candidateItems;
  };
  const commit = () => {
    const keys = equipKeyInput()
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);
    if (!keys.length || !pending().length) return;
    p.onCommitGroup(keys, [...pending()]);
    setEquipKeyInput("");
    clearPending();
  };
  return (
    <FlatCard
      icon="home_repair_service"
      headerName="Equipment"
      extraHeaderJsx={
        <div>
          <div><span>{p.groups.length}</span> <span>groups</span></div>
          <Button onClick={() => setShow(true)}>Edit</Button>
        </div>
      }
    >
      <div
        
      >
        <For each={p.optionKeys}>
          {(k) => (
            <Button
              class={k === p.activeKey ? styles.activeKeyBtn : ""}
              onClick={() => p.onSelectKey(k)}
            >
              {k}
            </Button>
          )}
        </For>
        <Show when={!p.optionKeys.length}>
          <span>No keys</span>
        </Show>
      </div>
      <div class={!p.collapsed ? styles.itemsRow : styles.collapsedContent}>
        <For each={p.selectedItems}>{(i) => <Chip value={i} />}</For>
        <Show when={!p.selectedItems.length}>
          <Chip value="No items" />
        </Show>
      </div>
      <div>
        <div >
          <For each={p.groups}>
            {(g) => (
              <Chip
                value={
                  (g.optionKeys || []).join("/") +
                  ": " +
                  (g.items || []).join(", ")
                }
              />
            )}
          </For>
          <Show when={!p.groups.length}>
            <Chip value="No groups" />
          </Show>
        </div>
      </div>
      <Modal title="Edit Equipment Groups" show={[show, setShow]}>
        <FormField name="Option Keys (comma sep)">
          <Input
            transparent
            value={equipKeyInput()}
            onInput={(e) => setEquipKeyInput(e.currentTarget.value)}
          />
        </FormField>
        <FormField name="">
          <Button onClick={() => setShowItemModal(true)}>
            Pick / Add Items
          </Button>
        </FormField>
        <div class={styles.chipsRow}>
          <For each={pending()}>
            {(i) => <Chip value={i} remove={() => removePending(i)} />}
          </For>
          <Show when={pending().length === 0}>
            <Chip value="No items yet" />
          </Show>
        </div>
        <Button
          disabled={!pending().length || !equipKeyInput()}
          onClick={commit}
        >
          Commit Group
        </Button>
        <div class={styles.scrollMini}>
          <div class={styles.chipsRow}>
            <For each={p.groups}>
              {(g) => (
                <Chip
                  value={
                    (g.optionKeys || []).join("/") +
                    ": " +
                    (g.items || []).join(", ")
                  }
                />
              )}
            </For>
          </div>
        </div>
        <div class={styles.chipsRow}>
          <Button onClick={() => setShow(false)}>Done</Button>
        </div>
        <Modal
          title="Select Equipment Items"
          show={[showItemModal, setShowItemModal]}
        >
          <div
            class={styles.scrollMini}
            style={{ "max-height": "70vh", padding: "0.5rem" }}
          >
            <FormField name="Search / Add Custom">
              <Input
                transparent
                value={itemSearch()}
                onInput={(e) => setItemSearch(e.currentTarget.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    addPending(itemSearch().trim());
                    setItemSearch("");
                  }
                }}
              />
              <Button
                onClick={() => {
                  addPending(itemSearch().trim());
                  setItemSearch("");
                }}
              >
                Add Custom
              </Button>
            </FormField>
            <div class={styles.chipsRow}>
              <For each={filtered()}>
                {(it) => (
                  <Button
                    class={pending().includes(it) ? styles.activeKeyBtn : ""}
                    onClick={() => addPending(it)}
                  >
                    {it}
                  </Button>
                )}
              </For>
              <Show when={!filtered().length}>
                <Chip value="No matches" />
              </Show>
            </div>
            <div class={styles.chipsRow}>
              <For each={pending()}>
                {(it) => <Chip value={it} remove={() => removePending(it)} />}
              </For>
              <Show when={!pending().length}>
                <Chip value="None Selected" />
              </Show>
            </div>
            <div class={styles.chipsRow}>
              <Button onClick={() => setShowItemModal(false)}>Done</Button>
              <Button onClick={() => clearPending()}>Clear</Button>
            </div>
          </div>
        </Modal>
      </Modal>
    </FlatCard>
  );
};
export default EquipmentSection;

/* 

(
    <div class={styles.flatSection} data-collapsed={p.collapsed} data-section="equipment" data-error={p.error || false}>
      <div class={styles.sectionHeader}>
        <h4>🧰 Equipment</h4>
        <div class={styles.inlineMeta}>
          
          <button class={styles.collapseBtn} onClick={() => p.toggle('equipment')}>{p.collapsed ? 'Expand' : 'Collapse'}</button>
          
        </div>
      </div>
      
    </div>
  );


*/
