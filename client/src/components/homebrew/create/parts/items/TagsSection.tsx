import { Component, For } from "solid-js";
import { Chip, Select, Option } from "coles-solid-library";
import { itemsStore } from "./itemsStore";
import { FlatCard } from "../../../../../shared/components/flatCard/flatCard";

interface Props {
  collapsed?: boolean;
  toggle(): void;
}

const builtInTags = [
  "Versatile",
  "Ammunition",
  "Loading",
  "Light",
  "Two-Handed",
  "Finesse",
  "Thrown",
  "Monk",
  "Heavy",
  "Reach",
  "Special",
  "Consumable",
];

export const TagsSection: Component<Props> = (p) => {
  const store = itemsStore;
  function addTag(tag: string) {
    if (!store.state.form) return;
    store.mutate((d) => {
      if (!d.tags.includes(tag)) d.tags = [...d.tags, tag];
    });
  }
  function removeTag(tag: string) {
    store.mutate((d) => {
      d.tags = d.tags.filter((t) => t !== tag);
    });
  }
  return (
    <FlatCard
     icon="deployed_code"
     headerName="Tags"
    >
      <div style={{ display: "flex", gap: "0.5rem", "flex-wrap": "wrap" }}>
        <For each={store.state.form!.tags}>
          {(tag) => <Chip value={tag} remove={() => removeTag(tag)} />}
        </For>
        <Select
          transparent
          value=""
          onChange={(val) => {
            if (val) addTag(val);
          }}
        >
          <Option value="">+ Add Tag</Option>
          <For each={builtInTags}>{(t) => <Option value={t}>{t}</Option>}</For>
        </Select>
      </div>
    </FlatCard>
  );
};

export default TagsSection;
