import { For } from "solid-js";
import { Select, Option, FormGroup } from "coles-solid-library";
import Styles from "./classSelection.module.scss";

interface ClassSelectionProps<T extends { parent_class: string }> {
  form: FormGroup<T>;
  allClassNames: () => string[];
  getSubclassLevels: () => string[];
  setToAddFeatureLevel: (v: number) => void;
  updateParamsIfReady: () => void;
}

export const ClassSelection = <T extends { parent_class: string }>(p: ClassSelectionProps<T>) => (
  <div class={Styles.lineUp}>
    <h2>Choose a class</h2>
    <Select
      transparent
      value={(p.form.get('parent_class') as any) || ''}
      onChange={(val) => {
        p.form.set('parent_class', val as any);
        if (p.getSubclassLevels().length > 0) p.setToAddFeatureLevel(+p.getSubclassLevels()[0]);
        p.updateParamsIfReady();
      }}
      class={`${Styles.transparent}`}
    >
      <For each={p.allClassNames()}>{c => <Option value={c}>{c}</Option>}</For>
    </Select>
  </div>
);
