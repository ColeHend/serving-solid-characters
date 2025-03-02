import { Accessor, Component, For, Setter, createSignal } from "solid-js";

interface MultiSelectProps {
  options: Accessor<string[]>;
  selectedOptions: Setter<string[]>;
  runOnChange?: ()=> any;
}

const MultiSelect: Component<MultiSelectProps> = (props) => {
 
  const handleSelectChange = (event: Event) => {
    const selectedValues = Array.from(
      (event.target as HTMLSelectElement).selectedOptions
    ).map((option) => option.value);
    props.selectedOptions((old)=>[...old, ...selectedValues]);
    if (props.runOnChange) props.runOnChange();
  };

  return (
    <select multiple onChange={handleSelectChange}>
      <For each={props.options()}>
        {(option) => (
          <option value={option}>
            {option}
          </option>
        )}
      </For>
    </select>
  );
};

export default MultiSelect;
