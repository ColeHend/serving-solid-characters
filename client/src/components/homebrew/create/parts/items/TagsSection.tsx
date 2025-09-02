import { Component, For } from 'solid-js';
import { Chip, Select, Option } from 'coles-solid-library';
import Section from './Section';
import { itemsStore } from './itemsStore';

interface Props { collapsed?: boolean; toggle(): void; }

const builtInTags = ['Versatile','Ammunition','Loading','Light','Two-Handed','Finesse','Thrown','Monk','Heavy','Reach','Special','Consumable'];

export const TagsSection: Component<Props> = (p) => {
  const store = itemsStore;
  function addTag(tag: string) { if (!store.state.form) return; store.mutate(d => { if (!d.tags.includes(tag)) d.tags = [...d.tags, tag]; }); }
  function removeTag(tag: string) { store.mutate(d => { d.tags = d.tags.filter(t => t !== tag); }); }
  return (
    <Section id="tags" title="Tags" collapsed={p.collapsed} onToggle={p.toggle} icon={<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 7l9-5 9 5v10l-9 5-9-5V7z"/><path d="M3 7l9 5 9-5"/><path d="M12 12v10"/></svg>}>
      <div style={{ display:'flex', gap:'0.5rem', 'flex-wrap':'wrap' }}>
        <For each={store.state.form!.tags}>{tag => <Chip value={tag} remove={() => removeTag(tag)} />}</For>
        <Select transparent value="" onChange={val => { if (val) addTag(val); }}>
          <Option value="">+ Add Tag</Option>
          <For each={builtInTags}>{t => <Option value={t}>{t}</Option>}</For>
        </Select>
      </div>
    </Section>
  );
};

export default TagsSection;
