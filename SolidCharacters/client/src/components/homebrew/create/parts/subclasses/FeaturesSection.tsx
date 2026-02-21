import { createSignal, createEffect, For, Show } from "solid-js";
import { Select, Option, Button, FormGroup, Modal, Input, TextArea, Chip } from "coles-solid-library";
import { FeatureDetail } from "../../../../../models/data";
import styles from "./subclasses.module.scss";

// Added optional id to allow stable identity (reference equality was breaking indexOf logic)
export interface FeatureDetailLevel extends FeatureDetail { info: { level: number }; id?: string }

interface FeaturesSectionProps<T extends { parent_class: string; features: FeatureDetailLevel[] }> {
  form: FormGroup<T>;
  getSubclassLevels: () => string[];
  toAddFeatureLevel: () => number;
  setToAddFeatureLevel: (v: number) => void;
  getLevelUpFeatures: (level: number) => FeatureDetailLevel[];
  setEditIndex: (v: number) => void;
  getEditIndex: () => number;
}

export const FeaturesSection = <T extends { parent_class: string; features: FeatureDetailLevel[] }>(p: FeaturesSectionProps<T>) => {
  const [showFeatureModal, setShowFeatureModal] = createSignal(false);
  const [featureName, setFeatureName] = createSignal("");
  const [featureDescription, setFeatureDescription] = createSignal("");

  // Keep inputs in sync if edit index changes while modal open (safety net)
  createEffect(() => {
    if (!showFeatureModal()) return;
    const idx = p.getEditIndex();
    const list = (p.form.get('features') as FeatureDetailLevel[]) || [];
    if (idx >= 0 && list[idx]) {
      const f: any = list[idx];
      setFeatureName(f.name || "");
      setFeatureDescription(f.description || f.desc || f.value || "");
    }
  });

  const saveFeature = () => {
    const name = featureName().trim();
    if (!name) return; // simple guard
    const desc = featureDescription();
    const level = Number(p.toAddFeatureLevel());
    if (!level) return;
    const list = [ ...(((p.form.get('features') as FeatureDetailLevel[])||[])) ];
    const idx = p.getEditIndex();
    if (idx >= 0 && list[idx]) {
      list[idx] = { ...list[idx], name, description: desc };
    } else {
      list.push({ id: (globalThis as any)?.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}` , name, description: desc, info: { level } });
    }
    p.form.set('features', list as any);
    // Reset edit state and close
    p.setEditIndex(-1);
    setShowFeatureModal(false);
  };

  return (
  <div>
    <h2>Level up features</h2>
    <Select value={p.toAddFeatureLevel()} transparent onChange={e => p.setToAddFeatureLevel(e)} class={`${styles.transparent}`}>
      <For each={p.getSubclassLevels()}>{level => <Option value={level}>{level}</Option>}</For>
    </Select>
    <Show when={p.toAddFeatureLevel() > 0}>
      <Button onClick={() => { 
        p.setEditIndex(-1); 
        setFeatureName("");
        setFeatureDescription("");
        setShowFeatureModal(true); 
      }}>Add Feature</Button>
    </Show>
    <div style={{ 
      display: 'flex',
      'flex-direction': 'row',
      'flex-wrap': 'wrap',
    }}>
      <For each={p.getLevelUpFeatures(p.toAddFeatureLevel())}>
        {(feature) => {
          const getIndex = () => {
            const list = (p.form.get('features') as FeatureDetailLevel[]) || [];
            if (feature.id) return list.findIndex(f => f.id === feature.id);
            // Fallback for legacy items without id: match on name + level
            return list.findIndex(f => f.name === feature.name && f.info?.level === feature.info?.level);
          };
          return (
            <Chip
              value={feature.name || "(Unnamed Feature)"}
              onClick={() => {
                const idx = getIndex();
                if (idx < 0) return;
                p.setEditIndex(idx);
                setFeatureName(feature.name || "");
                setFeatureDescription((feature as any).description || (feature as any).desc || (feature as any).value || "");
                setShowFeatureModal(true);
              }}
              remove={() => {
                const list = (p.form.get('features') as FeatureDetailLevel[]) || [];
                const idx = getIndex();
                if (idx < 0) return;
                const next = list.filter((_, i) => i !== idx);
                p.form.set('features', next as any);
                if (p.getEditIndex() === idx) {
                  p.setEditIndex(-1);
                } else if (p.getEditIndex() > idx) {
                  // Shift edit index down to track same logical item
                  p.setEditIndex(p.getEditIndex() - 1);
                }
              }}
            />
          );
        }}
      </For>
    </div>
    <Modal title={`Feature ${p.getEditIndex() >= 0 ? 'Edit' : 'Add'}`} show={[showFeatureModal, setShowFeatureModal]}>
      <div style={{ display: 'flex', 'flex-direction': 'column', 'gap': '0.85rem', 'min-width': 'min(520px, 90vw)' }}>
        <div>
          <div style={{ 'margin-bottom': '0.25rem', 'font-size': '0.85rem', color: 'var(--text-subtle)' }}>{p.getEditIndex() >= 0 ? 'Update the fields below then save your changes.' : 'Provide a clear name & description for the new feature.'}</div>
          <div style={{ display: 'flex', 'flex-direction': 'column', 'gap': '0.75rem' }}>
            <label style={{ display: 'flex', 'flex-direction': 'column', 'gap': '0.25rem' }}>
              <span style={{ 'font-weight': 600 }}>Feature Name</span>
              <Input
                value={featureName()}
                onInput={e => setFeatureName(e.currentTarget.value)}
                placeholder="e.g. Arcane Echoes"
                transparent
              />
            </label>
            <label style={{ display: 'flex', 'flex-direction': 'column', 'gap': '0.25rem' }}>
              <span style={{ 'font-weight': 600 }}>Description</span>
              <TextArea
                text={featureDescription}
                setText={setFeatureDescription}
                placeholder="Detail what this feature grants, its mechanics, limits, and any scaling."
                transparent
              />
            </label>
          </div>
        </div>
        <div style={{ display: 'flex', 'justify-content': 'space-between', 'align-items': 'center', 'margin-top': '0.25rem' }}>
          <span style={{ 'font-size': '0.7rem', color: 'var(--text-subtle)' }}>{featureDescription().length} chars</span>
          <div style={{ display: 'flex', 'gap': '0.5rem' }}>
            <Button onClick={() => { p.setEditIndex(-1); setShowFeatureModal(false); }}>Cancel</Button>
            <Button disabled={!featureName().trim()} onClick={saveFeature}>{p.getEditIndex() >= 0 ? 'Save Changes' : 'Add Feature'}</Button>
          </div>
        </div>
      </div>
    </Modal>
  </div>
);
}
