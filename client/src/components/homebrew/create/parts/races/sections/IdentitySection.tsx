import { Component, For, Show, createSignal, createEffect } from 'solid-js';
import { FormField, Input, Select, Option, Button, Chip, TextArea } from 'coles-solid-library';
import { racesStore } from '../racesStore';

const SIZES = ['Tiny','Small','Medium','Large','Huge','Gargantuan'];

interface Props { errors: string[]; }

const IdentitySection: Component<Props> = (props) => {
  const store = racesStore;
  const race = () => store.activeRace();
  const isNew = () => store.state.selection.activeName === '__new__';
  const [pendingSize, setPendingSize] = createSignal('');
  const [customSize, setCustomSize] = createSignal('');
  // local description editors (keep decoupled so existing draft object rebuilds don't reset cursor mid-typing)
  const [ageDesc, setAgeDesc] = createSignal('');
  const [alignDesc, setAlignDesc] = createSignal('');
  const [sizeDesc, setSizeDesc] = createSignal('');
  const [langDesc, setLangDesc] = createSignal('');
  const [abilitiesDesc, setAbilitiesDesc] = createSignal('');

  // sync when race changes (selection swap or when entering new mode)
  createEffect(() => {
    const r = race();
    setAgeDesc(r?.text.age || '');
    setAlignDesc(r?.text.alignment || '');
    setSizeDesc(r?.text.sizeDesc || '');
    setLangDesc(r?.languages.desc || '');
  setAbilitiesDesc(r?.text.abilitiesDesc || '');
  });

  // helper to update draft text block
  function commitText(part: 'age'|'alignment'|'sizeDesc'|'abilitiesDesc', val: string) {
    if (!isNew()) return;
    const current = race()?.text || { age:'', alignment:'', sizeDesc:'', abilitiesDesc:'' };
    store.updateBlankDraft('text', { ...current, [part]: val } as any);
  }
  function commitLangDesc(val: string) { if (isNew()) store.setLanguageDesc(val); }

  // proxy setters matching Setter<string>
  const ageSetter = (v: string | ((prev: string) => string)) => { const next = typeof v === 'function' ? (v as any)(ageDesc()) : v; setAgeDesc(next); commitText('age', next); return next; };
  const alignSetter = (v: string | ((prev: string) => string)) => { const next = typeof v === 'function' ? (v as any)(alignDesc()) : v; setAlignDesc(next); commitText('alignment', next); return next; };
  const sizeSetter = (v: string | ((prev: string) => string)) => { const next = typeof v === 'function' ? (v as any)(sizeDesc()) : v; setSizeDesc(next); commitText('sizeDesc', next); return next; };
  const langSetter = (v: string | ((prev: string) => string)) => { const next = typeof v === 'function' ? (v as any)(langDesc()) : v; setLangDesc(next); commitLangDesc(next); return next; };
  const abilitiesSetter = (v: string | ((prev: string) => string)) => { const next = typeof v === 'function' ? (v as any)(abilitiesDesc()) : v; setAbilitiesDesc(next); commitText('abilitiesDesc', next); return next; };
  return (
    <div>
      <h3 class="visuallyHidden">Identity</h3>
      {/* Dense single-line row: Name | Speed | Size Select | Custom Size | Add */}
  <div class="inlineRow inlineDense">
        <FormField name="Name" class="grow">
          <Input
            transparent
            value={race()?.name || ''}
            onInput={e => {
              const v = e.currentTarget.value;
              if (isNew()) store.updateBlankDraft('name', v); else store.renameActiveRace(v);
            }}
          />
        </FormField>
        <FormField name="Speed">
          <Input
            type="number"
            transparent
            style={{ width: '80px' }}
            value={race()?.speed ?? 30}
            onInput={e => {
              const val = parseInt(e.currentTarget.value||'0');
              if (isNew()) store.updateBlankDraft('speed', val); else store.updateExistingField('speed', val as any);
            }}
            min={0}
          />
        </FormField>
        <FormField name="Size">
          <Select transparent value={pendingSize()} onChange={v => setPendingSize(v)}>
            <Option value="">-- size --</Option>
            <For each={SIZES}>{s => <Option value={s}>{s}</Option>}</For>
          </Select>
        </FormField>
        <FormField name="Custom Size">
          <Input transparent style={{ width: '120px' }} placeholder="Custom" value={customSize()} onInput={e => setCustomSize(e.currentTarget.value)} />
        </FormField>
        <Button onClick={() => {
          const customRaw = customSize().split(/[,;]+/).map(s=>s.trim()).filter(Boolean);
          if (customRaw.length) {
            store.addSizes(customRaw);
          } else if (pendingSize()) {
            store.addSize(pendingSize());
          }
          setPendingSize('');
          setCustomSize('');
        }} disabled={!pendingSize() && !customSize().trim()}>Add</Button>
      </div>
      <div class="chipsRowSingle" aria-label="Sizes">
        <Show when={race()?.sizes?.length} fallback={<Chip value="None" />}> <For each={race()?.sizes || []}>{s => <Chip value={s} remove={() => store.removeSize(s)} />}</For></Show>
      </div>
      {/* Descriptions (editable only when new) */}
      <div style={{ 'margin-top': '.75rem', display:'flex', 'flex-direction':'column', gap:'.6rem', 'max-width':'760px' }}>
        <FormField name="Age Description">
          <TextArea transparent rows={2} text={ageDesc} setText={ageSetter as any} placeholder="Describe typical age / lifespan" />
        </FormField>
        <FormField name="Alignment Description">
          <TextArea transparent rows={2} text={alignDesc} setText={alignSetter as any} placeholder="Describe common alignment tendencies" />
        </FormField>
        <FormField name="Size Description">
          <TextArea transparent rows={2} text={sizeDesc} setText={sizeSetter as any} placeholder="Narrative size description" />
        </FormField>
        <FormField name="Language Description">
          <TextArea transparent rows={2} text={langDesc} setText={langSetter as any} placeholder="Explain racial languages / dialects" />
        </FormField>
        <FormField name="Abilities Description">
          <TextArea transparent rows={2} text={abilitiesDesc} setText={abilitiesSetter as any} placeholder="Explain typical ability bonuses or lack thereof" />
        </FormField>
      </div>
    </div>
  );
};

export default IdentitySection;
