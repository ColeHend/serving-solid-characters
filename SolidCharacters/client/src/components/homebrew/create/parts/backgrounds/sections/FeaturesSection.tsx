import { Component, For, Show, createSignal } from "solid-js";
import { Button, Chip, Modal, Input, FormField } from "coles-solid-library";
import styles from "../backgrounds.module.scss";
import { FeatureDetail } from "../../../../../../models/data/features";
import { FlatCard } from "../../../../../../shared/components/flatCard/flatCard";

interface Props {
  collapsed: boolean | undefined;
  toggle: (k: string) => void;
  features: FeatureDetail[];
  onChange: (features: FeatureDetail[]) => void;
  error?: boolean;
}

const FeaturesSection: Component<Props> = (p) => {
  const [show, setShow] = createSignal(false);
  const [fname, setFname] = createSignal("");
  const [fdesc, setFdesc] = createSignal("");
  const add = () => {
    if (!fname().trim()) return;
    p.onChange([
      ...p.features,
      { name: fname().trim(), description: fdesc().trim() },
    ]);
    setFname("");
    setFdesc("");
  };
  const remove = (i: number) =>
    p.onChange(p.features.filter((_, idx) => idx !== i));
  const updateName = (i: number, v: string) =>
    p.onChange(p.features.map((f, idx) => (idx === i ? { ...f, name: v } : f)));
  const updateDesc = (i: number, v: string) =>
    p.onChange(
      p.features.map((f, idx) => (idx === i ? { ...f, description: v } : f))
    );
  // return (
  //   <div class={styles.flatSection} data-collapsed={p.collapsed} data-section="features" data-error={p.error || false}>
  //     <div class={styles.sectionHeader}>
  //       <h4>🧩 Features</h4>
  //       <div class={styles.inlineMeta}>
  //         
  //         <button class={styles.collapseBtn} onClick={() => p.toggle('features')}>{p.collapsed ? 'Expand' : 'Collapse'}</button>
  //         
  //       </div>
  //     </div>

  //   </div>
  // );

  return (
    <FlatCard icon="star" headerName="Features" extraHeaderJsx={<div>
      <div><span>{p.features.length}</span> <span>total</span></div>
      <Button onClick={() => setShow(true)}>Edit</Button>
    </div>}>
      <div class={!p.collapsed ? styles.chipsRow : styles.collapsedContent}>
        <For each={p.features}>{(f) => <Chip value={f.name} />}</For>
        <Show when={!p.features.length}>
          <Chip value="None" />
        </Show>
      </div>
      <Modal title="Edit Features" show={[show, setShow]}>
        <FormField name="Feature Name">
          <Input
            transparent
            value={fname()}
            onInput={(e) => setFname(e.currentTarget.value)}
          />
        </FormField>
        <FormField name="Description">
          <Input
            transparent
            value={fdesc()}
            onInput={(e) => setFdesc(e.currentTarget.value)}
          />
        </FormField>
        <div class={styles.chipsRow}>
          <Button onClick={add} disabled={!fname().trim()}>
            Add Feature
          </Button>
          <Button
            onClick={() => {
              setFname("");
              setFdesc("");
            }}
            disabled={!fname() && !fdesc()}
          >
            Clear
          </Button>
        </div>
        <div class={styles.scrollMini} style={{ "max-height": "240px" }}>
          <For each={p.features}>
            {(f, i) => (
              <div
                style={{
                  border: "1px solid var(--border-color,#333)",
                  padding: ".4rem .5rem",
                  "border-radius": "6px",
                  display: "flex",
                  "flex-direction": "column",
                  gap: ".35rem",
                  "margin-bottom": ".5rem",
                }}
              >
                <Input
                  transparent
                  value={f.name}
                  onInput={(e) => updateName(i(), e.currentTarget.value)}
                />
                <Input
                  transparent
                  value={f.description}
                  onInput={(e) => updateDesc(i(), e.currentTarget.value)}
                />
                <div class={styles.chipsRow}>
                  <Button onClick={() => remove(i())}>Remove</Button>
                </div>
              </div>
            )}
          </For>
          <Show when={!p.features.length}>
            <div class={styles.subNote}>No features yet.</div>
          </Show>
        </div>
        <div class={styles.chipsRow}>
          <Button onClick={() => setShow(false)}>Done</Button>
        </div>
      </Modal>
    </FlatCard>
  );
};
export default FeaturesSection;
