import { Component, For, Show, createSignal } from 'solid-js';
import { FormField, Input, Select, Option, Button, Chip, TextArea } from 'coles-solid-library';
import { RaceLikeFormApi, RaceLikeFormShape } from '../../shared/raceLikeForm.shared';

const SIZES = ['Tiny','Small','Medium','Large','Huge','Gargantuan'];

interface Props { api: RaceLikeFormApi }

const IdentitySection: Component<Props> = (p) => {
  const { form } = p.api;
  const [pendingSize, setPendingSize] = createSignal('');
  const [customSize, setCustomSize] = createSignal('');

  // TextArea uses a text/setText accessor pair; point it straight at the form.
  const textPair = (key: keyof RaceLikeFormShape) => ({
    text: () => form.getR(key) as string,
    setText: ((v: string | ((prev: string) => string)) =>
      form.set(key, (typeof v === 'function' ? v(form.getR(key) as string) : v) as never)) as any,
  });

  const addSizes = (sizes: string[]) => {
    const next = [...(form.getR('sizes') as string[])];
    for (const s of sizes) {
      const t = s.trim();
      if (t && !next.includes(t)) next.push(t);
    }
    form.set('sizes', next);
  };
  const removeSize = (size: string) =>
    form.set('sizes', (form.getR('sizes') as string[]).filter(s => s !== size));

  return (
    <div>
      <h3 class="visuallyHidden">Identity</h3>
      {/* Dense single-line row: Name | Speed | Size Select | Custom Size | Add */}
      <div class="inlineRow inlineDense">
        <FormField name="Name" class="grow">
          <Input
            transparent
            value={form.getR('name')}
            onInput={e => form.set('name', e.currentTarget.value)}
          />
        </FormField>
        <FormField name="Speed">
          <Input
            type="number"
            transparent
            style={{ width: '80px' }}
            value={form.getR('speed')}
            onInput={e => form.set('speed', parseInt(e.currentTarget.value || '0'))}
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
            addSizes(customRaw);
          } else if (pendingSize()) {
            addSizes([pendingSize()]);
          }
          setPendingSize('');
          setCustomSize('');
        }} disabled={!pendingSize() && !customSize().trim()}>Add</Button>
      </div>
      <div class="chipsRowSingle" aria-label="Sizes">
        <Show when={(form.getR('sizes') as string[]).length} fallback={<Chip value="None" />}> <For each={form.getR('sizes') as string[]}>{s => <Chip value={s} remove={() => removeSize(s)} />}</For></Show>
      </div>
      <div style={{ 'margin-top': '.75rem', display:'flex', 'flex-direction':'column', gap:'.6rem', 'max-width':'760px' }}>
        <FormField name="Age Description">
          <TextArea transparent rows={2} {...textPair('descAge')} placeholder="Describe typical age / lifespan" />
        </FormField>
        <FormField name="Alignment Description">
          <TextArea transparent rows={2} {...textPair('descAlignment')} placeholder="Describe common alignment tendencies" />
        </FormField>
        <FormField name="Size Description">
          <TextArea transparent rows={2} {...textPair('descSize')} placeholder="Narrative size description" />
        </FormField>
        <FormField name="Language Description">
          <TextArea transparent rows={2} {...textPair('langDesc')} placeholder="Explain racial languages / dialects" />
        </FormField>
        <FormField name="Abilities Description">
          <TextArea transparent rows={2} {...textPair('descAbilities')} placeholder="Explain typical ability bonuses or lack thereof" />
        </FormField>
      </div>
    </div>
  );
};

export default IdentitySection;
