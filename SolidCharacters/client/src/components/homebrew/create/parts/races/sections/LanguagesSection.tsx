import { Component, For, Show, createSignal } from 'solid-js';
import { Button, Chip, FormField, Input } from 'coles-solid-library';
import { RaceLikeFormApi } from '../../shared/raceLikeForm.shared';

interface Props { api: RaceLikeFormApi }

const LanguagesSection: Component<Props> = (p) => {
  const { form } = p.api;
  const [lang, setLang] = createSignal('');
  const [choiceOpt, setChoiceOpt] = createSignal('');
  const fixed = () => form.getR('langFixed') as string[];
  const options = () => form.getR('langOptions') as string[];
  const amount = () => form.getR('langAmount') as number;
  const addFixed = () => {
    const v = lang().trim();
    if (!v) return;
    form.set('langFixed', Array.from(new Set([...fixed(), v])));
    setLang('');
  };
  const addChoice = () => {
    const v = choiceOpt().trim();
    if (!v) return;
    form.set('langOptions', Array.from(new Set([...options(), v])));
    setChoiceOpt('');
  };
  const removeFixed = (l: string) => form.set('langFixed', fixed().filter(x => x !== l));
  const removeChoice = (l: string) => form.set('langOptions', options().filter(o => o !== l));
  const updateAmount = (n: number) => form.set('langAmount', n);
  return (
    <div>
      <h3 class="visuallyHidden">Languages</h3>
      {/* Dense row: Fixed | Add | Choice Amount | Choice Option | Add Option */}
      <div class="inlineRow inlineDense">
        <FormField name="Fixed Lang">
          <Input transparent value={lang()} onInput={e => setLang(e.currentTarget.value)} />
        </FormField>
        <Button onClick={addFixed} disabled={!lang().trim()}>Add</Button>
        <FormField name="Choice Amt">
          <Input type="number" min={0} transparent style={{ width: '70px' }} value={amount()} onInput={e => updateAmount(parseInt(e.currentTarget.value||'0'))} />
        </FormField>
        <FormField name="Choice Opt">
          <Input transparent style={{ width: '140px' }} value={choiceOpt()} onInput={e => setChoiceOpt(e.currentTarget.value)} />
        </FormField>
        <Button onClick={addChoice} disabled={!choiceOpt().trim()}>Add Option</Button>
      </div>
      <div style={{ 'margin-top':'.4rem' }}>
        <strong style={{ 'font-size': '.7rem', opacity:.7 }}>Fixed:</strong>
        <div class="chipsRowSingle" aria-label="Fixed Languages">
          <Show when={fixed().length} fallback={<Chip value="None" />}> <For each={fixed()}>{l => <Chip value={l} remove={() => removeFixed(l)} />}</For></Show>
        </div>
      </div>
      <div style={{ 'margin-top':'.4rem' }}>
        <strong style={{ 'font-size': '.7rem', opacity:.7 }}>Choice Options (allow {amount()}):</strong>
        <div class="chipsRowSingle" aria-label="Language Choice Options">
          <Show when={options().length} fallback={<Chip value="None" />}> <For each={options()}>{l => <Chip value={l} remove={() => removeChoice(l)} />}</For></Show>
        </div>
      </div>
    </div>
  );
};
export default LanguagesSection;
