import { For, Show } from "solid-js";
import { Chip } from "coles-solid-library";
import { TableFilter } from "../../customHooks";

interface FilterChipsProps<T> {
  filter: TableFilter<T>;
  class?: string;
}

/** Removable chips for every active filter/sort selection; renders nothing when inactive. */
export function FilterChips<T>(props: FilterChipsProps<T>) {
  return (
    <Show when={props.filter.chips().length > 0}>
      <div class={props.class}>
        <For each={props.filter.chips()}>
          {(chip) => <Chip value={chip.label} remove={() => props.filter.removeChip(chip)} />}
        </For>
      </div>
    </Show>
  );
}
