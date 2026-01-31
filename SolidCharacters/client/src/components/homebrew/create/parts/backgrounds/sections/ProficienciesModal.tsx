import { Component, For, Show, createSignal } from 'solid-js';
import { Button, Chip, Modal, Select, Option, FormField } from 'coles-solid-library';
import styles from '../backgrounds.module.scss';
import { ARMOR, WEAPONS, SKILLS, TOOLS } from '../constants';

interface Profs { armor: string[]; weapons: string[]; skills: string[]; tools: string[] }
interface Props {
  profs: Profs;
  push: (cat: keyof Profs, val: string) => void;
  remove: (cat: keyof Profs, val: string) => void;
}

const ProficienciesModal: Component<Props> = (p) => {
  const [show, setShow] = createSignal(false);
  return <>
    <Button onClick={() => setShow(true)}>Edit Proficiencies</Button>
    <Modal title="Edit Proficiencies" show={[show, setShow]}>
      <FormField name="Add Armor">
        <Select class={styles.tightSelect} transparent onChange={v => p.push('armor', v)} value="">
          <Option value="">--armor--</Option>
          <For each={ARMOR}>{a => <Option value={a}>{a}</Option>}</For>
        </Select>
      </FormField>
      <div class={styles.chipsRow}><For each={p.profs.armor}>{a => <Chip value={a} remove={() => p.remove('armor', a)} />}</For><Show when={!p.profs.armor.length}><Chip value="None" /></Show></div>
      <FormField name="Add Weapon">
        <Select class={styles.tightSelect} transparent onChange={v => p.push('weapons', v)} value="">
          <Option value="">--weapon--</Option>
          <Option value="Martial">Martial</Option>
          <Option value="Martial Melee">Martial Melee</Option>
          <Option value="Martial Ranged">Martial Ranged</Option>
          <For each={WEAPONS}>{w => <Option value={w}>{w}</Option>}</For>
        </Select>
      </FormField>
      <div class={styles.chipsRow}><For each={p.profs.weapons}>{w => <Chip value={w} remove={() => p.remove('weapons', w)} />}</For><Show when={!p.profs.weapons.length}><Chip value="None" /></Show></div>
      <FormField name="Add Skill">
        <Select class={styles.tightSelect} transparent onChange={v => p.push('skills', v)} value="">
          <Option value="">--skill--</Option>
          <For each={SKILLS}>{s => <Option value={s}>{s}</Option>}</For>
        </Select>
      </FormField>
      <div class={styles.chipsRow}><For each={p.profs.skills}>{s => <Chip value={s} remove={() => p.remove('skills', s)} />}</For><Show when={!p.profs.skills.length}><Chip value="None" /></Show></div>
      <FormField name="Add Tool">
        <Select class={styles.tightSelect} transparent onChange={v => p.push('tools', v)} value="">
          <Option value="">--tool--</Option>
          <For each={TOOLS}>{t => <Option value={t}>{t}</Option>}</For>
        </Select>
      </FormField>
      <div class={styles.chipsRow}><For each={p.profs.tools}>{t => <Chip value={t} remove={() => p.remove('tools', t)} />}</For><Show when={!p.profs.tools.length}><Chip value="None" /></Show></div>
      <div class={styles.chipsRow}><Button onClick={()=>setShow(false)}>Done</Button></div>
    </Modal>
  </>;
};
export default ProficienciesModal;