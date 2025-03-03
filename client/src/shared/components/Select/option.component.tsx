import { useContext, onMount, onCleanup, JSX } from "solid-js";
import { SelectContext } from "./select.component";  // context created in Select component
import './selectStyles.scss';
interface OptionProps<T> {
  value: T;
  children?: JSX.Element;       // display content for the option
  class?: string;              // optional additional class for styling this option
}

export function Option<T>(props: OptionProps<T>) {
  // Access the Select parent context
  const select = useContext(SelectContext);
  if (!select) {
    throw new Error("<Option> must be used within a <Select>");
  }

  // Register this option in the parent (for label mapping, etc.)
  onMount(() => select.registerOption?.(props.value, props.children));
  onCleanup(() => select.unregisterOption?.(props.value));

  const handleClick = (e: MouseEvent) => {
    e.stopPropagation();  // prevent click from bubbling to the Select trigger
    select.selectValue(props.value);
  };

  return (
    <div 
      class={`solid-select__option ${props.class || ""}`} 
      classList={{ "selected": select.isSelected(props.value) }} 
      onClick={handleClick}
    >
      {/* Checkmark indicator */}
      <span class="checkmark">{select.isSelected(props.value) ? "✓" : ""}</span>
      <span class="option-label">{props.children ?? ""}</span>
    </div>
  );
}
