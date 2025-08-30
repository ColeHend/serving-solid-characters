import { For, Show } from "solid-js";
import { Select, Option, Button, FormGroup } from "coles-solid-library";
import { Feature } from "../../../../../models/old/core.model";

interface FeaturesSectionProps<T extends { parent_class: string; features: Feature<string,string>[] }> {
  form: FormGroup<T>;
  getSubclassLevels: () => string[];
  toAddFeatureLevel: () => number;
  setToAddFeatureLevel: (v: number) => void;
  getLevelUpFeatures: (level: number) => Feature<string, string>[];
  setEditIndex: (v: number) => void;
  setShowFeatureModal: (fn: (p: boolean) => boolean) => void;
}

export const FeaturesSection = <T extends { parent_class: string; features: Feature<string,string>[] }>(p: FeaturesSectionProps<T>) => (
  <Show when={((p.form.get('parent_class') as any) || '').trim().length > 0}>
    <div>
      <h2>Level up features</h2>
      <Select value={p.toAddFeatureLevel()} transparent onChange={e => p.setToAddFeatureLevel(e)}>
        <For each={p.getSubclassLevels()}>{level => <Option value={level}>{level}</Option>}</For>
      </Select>
      <Show when={p.toAddFeatureLevel() > 0}>
        <Button onClick={() => p.setShowFeatureModal(o => !o)}>Add Feature (modal TBD)</Button>
      </Show>
      <For each={p.getLevelUpFeatures(p.toAddFeatureLevel())}>
        {feature => (
          <Button
            onClick={() => {
              const list = (p.form.get('features') as Feature<string,string>[]) || [];
              p.setEditIndex(list.indexOf(feature));
              p.setShowFeatureModal(() => true);
            }}
          >
            {feature.name}
          </Button>
        )}
      </For>
    </div>
  </Show>
);
