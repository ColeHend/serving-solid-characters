import { Component, For, Show, createSignal } from 'solid-js';
import { Chip, Button, FormField, Input, TextArea, Modal } from 'coles-solid-library';
import { Feature, FeatureTypes } from '../../../../../models/old/core.model';
import { itemsStore } from './itemsStore';
import Section from './Section';
import styles from './items.module.scss';

interface Props { collapsed?: boolean; toggle(): void; }

export const FeaturesSection: Component<Props> = (p) => {
  const store = itemsStore;
  const [showFeatureModal, setShowFeatureModal] = createSignal(false);
  const [featureName, setFeatureName] = createSignal('');
  const [featureValue, setFeatureValue] = createSignal('');

  const featureErrors = () => {
    const errs:string[] = [];
    if (!featureName().trim()) errs.push('Name required');
    if (store.state.form?.features.some(f => f.name.toLowerCase() === featureName().trim().toLowerCase())) errs.push('Name must be unique');
    return errs;
  };
  function commitFeature() {
    if (featureErrors().length) return;
    const feat: Feature<string,string> = { name: featureName().trim(), value: featureValue(), info: { className:'', subclassName:'', level:0, type:FeatureTypes.Item, other:'item' }, metadata: {} };
    store.mutate(d => { d.features = [...d.features, feat]; });
    setShowFeatureModal(false);
  }
  function removeFeature(name: string) { store.mutate(d => { d.features = d.features.filter(f => f.name !== name); }); }

  return (
    <>
      <Section id="features" title="Features" collapsed={p.collapsed} onToggle={p.toggle} icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 2l2.9 6.26L22 9.27l-5 4.87L18.2 22 12 18.56 5.8 22 7 14.14l-5-4.87 7.1-1.01z"/></svg>}>
        <div style={{ display:'flex', gap:'.5rem', 'align-items':'center' }}>
          <Button onClick={() => { setFeatureName(''); setFeatureValue(''); setShowFeatureModal(true); }}>+ Feature</Button>
        </div>
        <Show when={store.state.form!.features.length} fallback={<div style={{ 'font-size':'0.8rem', opacity:0.7 }}>No features</div>}>
          <For each={store.state.form!.features}>{f => <Chip value={f.name} remove={() => removeFeature(f.name)} />}</For>
        </Show>
      </Section>
      <Modal title="Add Feature" show={[showFeatureModal, setShowFeatureModal]} width="520px">
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
            <Button transparent onClick={()=>setShowFeatureModal(false)}>Cancel</Button>
            <Button disabled={!!featureErrors().length} onClick={commitFeature}>Add Feature</Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default FeaturesSection;
