import { Component, For, Show, createSignal } from 'solid-js';
import { Chip, Button, FormField, Input, TextArea, Modal } from 'coles-solid-library';
import { Feature, FeatureTypes } from '../../../../../models/old/core.model';
import { itemsStore } from './itemsStore';
import styles from './items.module.scss';
import { FlatCard } from '../../../../../shared/components/flatCard/flatCard';

interface Props { collapsed?: boolean; toggle(): void; }

export const FeaturesSection: Component<Props> = (p) => {
  const store = itemsStore;
  const [showFeatureModal, setShowFeatureModal] = createSignal(false);
  const [featureName, setFeatureName] = createSignal('');
  const [featureValue, setFeatureValue] = createSignal('');
  const [editIndex, setEditIndex] = createSignal<number>(-1); // -1 => adding

  const featureErrors = () => {
    const errs:string[] = [];
    const name = featureName().trim();
    if (!name) errs.push('Name required');
    const idx = editIndex();
    if (store.state.form?.features.some((f,i) => i !== idx && f.name.toLowerCase() === name.toLowerCase())) errs.push('Name must be unique');
    return errs;
  };
  function commitFeature() {
    if (featureErrors().length) return;
    const name = featureName().trim();
    const feat: Feature<string,string> = { name, value: featureValue(), info: { className:'', subclassName:'', level:0, type:FeatureTypes.Item, other:'item' }, metadata: {} };
    const idx = editIndex();
    store.mutate(d => {
      if (idx >= 0 && idx < d.features.length) {
        const copy = [...d.features];
        copy[idx] = feat;
        d.features = copy;
      } else {
        d.features = [...d.features, feat];
      }
    });
    setEditIndex(-1);
    setShowFeatureModal(false);
  }
  function removeFeature(name: string) { store.mutate(d => { d.features = d.features.filter(f => f.name !== name); }); if (editIndex() >=0) setEditIndex(-1); }
  function startAdd() { setFeatureName(''); setFeatureValue(''); setEditIndex(-1); setShowFeatureModal(true); }
  function startEdit(i:number) {
    const f = store.state.form?.features[i];
    if (!f) return;
    setFeatureName(f.name);
    // features previously stored as value (legacy) or description fields
    setFeatureValue((f as any).value || (f as any).description || '');
    setEditIndex(i);
    setShowFeatureModal(true);
  }

  return (
    <>
      <FlatCard icon='star' headerName='Features' transparent>
        <div style={{ display:'flex', gap:'.5rem', 'align-items':'center' }}>
          <Button onClick={startAdd}>+ Feature</Button>
          <Show when={editIndex()>=0}><span style={{ 'font-size':'.7rem', opacity:0.65 }}>Editing: {featureName()}</span></Show>
        </div>
        <div class={styles.chipsRow}>
          <Show when={store.state.form!.features.length} fallback={<div style={{ 'font-size':'0.8rem', opacity:0.7 }}>No features</div>}>
            <For each={store.state.form!.features}>{(f,i) => (
              <Chip value={f.name}
                onClick={() => startEdit(i())}
                remove={() => removeFeature(f.name)} />
            )}</For>
          </Show>
        </div>
      </FlatCard>
      <Modal title={editIndex()>=0? 'Edit Feature' : 'Add Feature'} show={[showFeatureModal, setShowFeatureModal]} width="520px">
        <div style={{ padding: '0.75rem 1rem 1rem', display:'flex', 'flex-direction':'column', gap:'0.85rem' }}>
          <FormField name="Name" required>
            <Input transparent value={featureName()} onInput={e=>setFeatureName(e.currentTarget.value)} placeholder="Feature name" />
          </FormField>
          <FormField name="Description">
            <TextArea text={featureValue} setText={setFeatureValue} rows={5} transparent />
          </FormField>
          <Show when={featureErrors().length}>
            <div class={styles.validationBox}>
              <For each={featureErrors()}>{e => <div>{e}</div>}</For>
            </div>
          </Show>
          <div style={{ display:'flex', gap:'0.5rem', 'justify-content':'flex-end' }}>
            <Button transparent onClick={()=>{ setShowFeatureModal(false); setEditIndex(-1); }}>Cancel</Button>
            <Button disabled={!!featureErrors().length} onClick={commitFeature}>{editIndex()>=0? 'Save Changes':'Add Feature'}</Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default FeaturesSection;
