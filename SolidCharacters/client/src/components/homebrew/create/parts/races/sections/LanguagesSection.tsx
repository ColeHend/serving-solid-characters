import { Component, For, Show, createSignal } from 'solid-js';
import { Button, Chip, FormField, Input } from 'coles-solid-library';
import { racesStore } from '../racesStore';

const LanguagesSection: Component = () => {
  const store = racesStore;
  const draft = () => store.activeRace();
  const isNew = () => store.state.selection.activeName === '__new__';
  const [lang, setLang] = createSignal('');
  const [choiceAmount, setChoiceAmount] = createSignal(draft()?.languages.amount || 0);
  const [choiceOpt, setChoiceOpt] = createSignal('');
  const addFixed = () => { if (lang().trim()) { store.addLanguage(lang().trim()); setLang(''); } };
  const addChoice = () => {
    if (!choiceOpt().trim()) return;
    const opts = Array.from(new Set([...(draft()?.languages.options || []), choiceOpt().trim()]));
    store.setLanguageChoice(choiceAmount(), opts);
    setChoiceOpt('');
  };
  const removeFixed = (l: string) => store.removeLanguage(l);
  const removeChoice = (l: string) => store.setLanguageChoice(choiceAmount(), (draft()?.languages.options || []).filter(o => o !== l));
  const updateAmount = (n: number) => { setChoiceAmount(n); store.setLanguageChoice(n, draft()?.languages.options || []); };
  return (
    <div>
      <h3 class="visuallyHidden">Languages</h3>
      {/* Dense row: Fixed | Add | Choice Amount | Choice Option | Add Option */}
  <div class="inlineRow inlineDense">
        <FormField name="Fixed Lang">
          <Input transparent value={lang()} onInput={e => setLang(e.currentTarget.value)} />
        </FormField>
        <Button onClick={addFixed} disabled={!isNew() || !lang().trim()}>Add</Button>
        <FormField name="Choice Amt">
          <Input type="number" min={0} transparent style={{ width: '70px' }} value={choiceAmount()} onInput={e => updateAmount(parseInt(e.currentTarget.value||'0'))} />
        </FormField>
        <FormField name="Choice Opt">
          <Input transparent style={{ width: '140px' }} value={choiceOpt()} onInput={e => setChoiceOpt(e.currentTarget.value)} />
        </FormField>
        <Button onClick={addChoice} disabled={!isNew() || !choiceOpt().trim()}>Add Option</Button>
      </div>
      <div style={{ 'margin-top':'.4rem' }}>
        <strong style={{ 'font-size': '.7rem', opacity:.7 }}>Fixed:</strong>
        <div class="chipsRowSingle" aria-label="Fixed Languages">
          <Show when={draft()?.languages.fixed.length} fallback={<Chip value="None" />}> <For each={draft()?.languages.fixed || []}>{l => <Chip value={l} remove={() => isNew() && removeFixed(l)} />}</For></Show>
        </div>
      </div>
      <div style={{ 'margin-top':'.4rem' }}>
        <strong style={{ 'font-size': '.7rem', opacity:.7 }}>Choice Options (allow {choiceAmount()}):</strong>
        <div class="chipsRowSingle" aria-label="Language Choice Options">
          <Show when={(draft()?.languages.options || []).length} fallback={<Chip value="None" />}> <For each={draft()?.languages.options || []}>{l => <Chip value={l} remove={() => isNew() && removeChoice(l)} />}</For></Show>
        </div>
      </div>
    </div>
  );
};
export default LanguagesSection;
