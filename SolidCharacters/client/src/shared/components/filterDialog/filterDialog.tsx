import { Accessor, For, Setter, Show, createEffect, createSignal } from "solid-js";
import { Modal, Select, Option, RadioGroup, Radio } from "coles-solid-library";
import styles from "./filterDialog.module.scss";
import { DndDialogHeader } from "../dndDialogHeader/dndDialogHeader";
import { DndDialogButton } from "../dndDialogButton/dndDialogButton";
import { FleuronDivider } from "../fleuronDivider/fleuronDivider";
import { LegacyMode, TableFilter } from "../../customHooks";

interface FilterDialogProps<T> {
  show: [Accessor<boolean>, Setter<boolean>];
  filter: TableFilter<T>;
  /** Shown as the dialog title, e.g. "Spells". */
  title?: string;
}

export function FilterDialog<T>(props: FilterDialogProps<T>) {
  const [viewRef, setViewRef] = createSignal<HTMLElement | null>(null);

  // The library Modal is a fixed-height dark surface; percentage heights don't
  // resolve through its body wrapper, so a short parchment view leaves a dark
  // gap. Make the wrapper a flex column (the view fills via flex: 1) and paint
  // the dialog parchment as a fallback.
  createEffect(() => {
    const ref = viewRef();
    if (!ref) return;
    const modalBody = ref.parentElement;
    
    const dialog = modalBody?.parentElement;
    if (dialog) {
      dialog.style.paddingBottom = "0";
    }
  });

  return (
    <Modal
      title={props.title ?? "Filters"}
      show={props.show}
      noHeader
      width="min(480px, 95vw)"
    >
      <div class={`${styles.view}`} ref={setViewRef}>
        <DndDialogHeader onClose={() => props.show[1](false)}>
          <div class={`${styles.dndStyledHeader}`}>
            <span>filter &amp; sort</span>
            <h1>{props.title ?? "Filters"}</h1>
          </div>
        </DndDialogHeader>

        <Show when={props.filter.sort} keyed>
          {(sort) => (
            <>
              <h4 class={`${styles.sectionLabel}`}>Sort</h4>
              <div class={`${styles.section} ${styles.sortRow}`}>
                <Select
                  value={sort.currentSort().sortKey}
                  onChange={(key: string) =>
                    sort.setSort({ sortKey: key, isAsc: sort.currentSort().isAsc })
                  }
                >
                  <For each={sort.options}>
                    {(o) => <Option value={o.key}>{o.label}</Option>}
                  </For>
                </Select>
                <RadioGroup
                  name="filterSortDirection"
                  value={sort.currentSort().isAsc ? "asc" : "desc"}
                  onChange={(v) =>
                    sort.setSort({ sortKey: sort.currentSort().sortKey, isAsc: v === "asc" })
                  }
                >
                  <Radio value="asc" label="Ascending ▲" />
                  <Radio value="desc" label="Descending ▼" />
                </RadioGroup>
              </div>
              <FleuronDivider />
            </>
          )}
        </Show>

        <For each={props.filter.fields}>
          {(field) => (
            <div class={`${styles.section}`}>
              <h4 class={`${styles.sectionLabel}`}>{field.label}</h4>
              <Select<string, true>
                multiple
                value={props.filter.selections()[field.key] ?? []}
                onChange={(values) => props.filter.setFieldValues(field.key, values)}
                placeholder={`Any ${field.label.toLowerCase()}`}
              >
                <For each={props.filter.optionsFor(field.key)}>
                  {(opt) => <Option value={opt.value}>{opt.label}</Option>}
                </For>
              </Select>
            </div>
          )}
        </For>

        <Show when={props.filter.hasLegacy}>
          <div class={`${styles.section}`}>
            <h4 class={`${styles.sectionLabel}`}>Legacy</h4>
            <RadioGroup
              name="filterLegacyMode"
              value={props.filter.legacyMode()}
              onChange={(v) => props.filter.setLegacyMode(v as LegacyMode)}
            >
              <Radio value="all" label="All" />
              <Radio value="legacy" label="Legacy only" />
              <Radio value="nonLegacy" label="Non-legacy" />
            </RadioGroup>
          </div>
        </Show>

        <div class={`${styles.footer}`}>
          <DndDialogButton onClick={() => props.filter.clearAll()}>
            Clear all
          </DndDialogButton>
        </div>
      </div>
    </Modal>
  );
}
