import { Component, For, Show, createSignal } from 'solid-js';
import { Button, Chip, Modal, Input, FormField } from 'coles-solid-library';
import styles from '../backgrounds.module.scss';

interface Props {
  amount: number;
  setAmount: (n: number) => void;
  options: string[];
  addLanguage: (l: string) => void;
  removeLanguage: (l: string) => void;
}

const LanguagesModal: Component<Props> = (p) => {
  const [show, setShow] = createSignal(false);
  const [newLang, setNewLang] = createSignal('');
  const add = () => { if (!newLang().trim()) return; p.addLanguage(newLang().trim()); setNewLang(''); };
  return <>
    <Button onClick={() => setShow(true)}>Edit Languages</Button>
    <Modal title="Edit Languages" show={[show, setShow]}>
      <FormField name="Amount">
        <Input type="number" min={0} transparent value={p.amount} onChange={e => p.setAmount(parseInt(e.currentTarget.value || '0'))} />
      </FormField>
      <FormField name="Add Language">
        <Input class={styles.tightSelect} transparent value={newLang()} onInput={e => setNewLang(e.currentTarget.value)} />
        <Button onClick={add}>Add</Button>
      </FormField>
      <div class={styles.chipsRow}><For each={p.options}>{l => <Chip value={l} remove={() => p.removeLanguage(l)} />}</For><Show when={!p.options.length}><Chip value="None" /></Show></div>
      <div class={styles.chipsRow}><Button onClick={()=>setShow(false)}>Done</Button></div>
    </Modal>
  </>;
};
export default LanguagesModal;

const getLanguages = () => {
  return [
    'Abyssal',
    'Aquan',
    'Auran',
    'Celestial',
    'Draconic',
    'Dwarvish',
    'Elvish',
    'Giant',
    'Gnomish',
    'Goblin',
    'Halfling',
    'Infernal',
    'Orc',
    'Sylvan',
    'Undercommon'
  ]
}