import { createSignal, createEffect, For, Show } from "solid-js";
import { Select, Option, Button, FormGroup, Modal, Input, TextArea, Chip } from "coles-solid-library";
import { FeatureDetail } from "../../../../../models/data";

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
    <Select value={p.toAddFeatureLevel()} transparent onChange={e => p.setToAddFeatureLevel(e)}>
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
      <div>
        <strong>Name</strong>
        <Input value={featureName()} onInput={e => setFeatureName(e.currentTarget.value)} placeholder="Feature name" />
      </div>
      <div style={{ 'margin-top': '0.75rem' }}>
        <strong>Description</strong>
        <TextArea 
          text={featureDescription} 
          setText={setFeatureDescription} 
          placeholder="Feature description" />
      </div>
      <div style={{ display: 'flex', 'justify-content': 'flex-end', 'gap': '0.5rem', 'margin-top': '0.75rem' }}>
        <Button onClick={() => { p.setEditIndex(-1); setShowFeatureModal(false); }}>Cancel</Button>
        <Button disabled={!featureName().trim()} onClick={saveFeature}>{p.getEditIndex() >= 0 ? 'Save Changes' : 'Add Feature'}</Button>
      </div>
    </Modal>
  </div>
);
}
