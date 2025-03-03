import { createSignal, createEffect, createContext, JSX, onCleanup, onMount, Show, createMemo } from "solid-js";
import './selectStyles.scss';
import { isNullish } from "../../customHooks";
import { Portal } from "solid-js/web";

// Define a context to share state with Option children
interface SelectContextValue<T> {
  isSelected: (val: T) => boolean;
  selectValue: (val: T) => void;
  registerOption?: (val: T, label: JSX.Element) => void;
  unregisterOption?: (val: T) => void;
  selectRef?: (val: HTMLDivElement | undefined) => HTMLDivElement | undefined;
}
export const SelectContext = createContext<SelectContextValue<any>>();

// Props for single-select vs multi-select
interface SelectProps<T = string, K = boolean> {
  multiple?: K;
  value: T;
  transparent?: boolean;
  id?: string;
  defaultValue?: T;
  onChange: (value: T) => void;
  placeholder?: string;
  tooltip?: string;
  renderValue?: (selected: T) => JSX.Element;
  class?: string;            // additional class for the select container
  dropdownClass?: string;    // class for the dropdown menu
  children: JSX.Element;
  style?: "primary" | "accent" | "tertiary";
}
export function Select<T, K extends boolean = false>(props: SelectProps<(K extends true ? T[]: T), K>) {
  // Determine if multiple selection
  const isMultiple = (Object.keys(props).includes("multiple") || props.multiple === true ? !!props.multiple : false) as K;

  // Internal state for selected value(s). Use provided value or defaultValue or an initial default.
  const currStyle = props.style ?? "accent";
  const defaultSelected = isMultiple as K ? (props.value ?? props.defaultValue ?? []) : (props.value ?? props.defaultValue ?? undefined);
  const [selected, setSelected] = createSignal<T | T[] | undefined>(defaultSelected);
  const [selectRef, setSelectRef] = createSignal<HTMLDivElement>();
  const [dropdownRef, setDropdownRef] = createSignal<HTMLDivElement>();

  // Update internal state if `value` prop changes (controlled mode)
  createEffect(() => {
    if (!isNullish(props.value)) {
      setSelected(() => props.value as T | T[]);
    }
  });

  // Signal for dropdown open/closed
  const [open, setOpen] = createSignal(false);

  // Map of option value to label (JSX) for displaying selected labels
  const optionsMap = new Map<T, JSX.Element>();
  const registerOption = (val: T, label: JSX.Element) => {
    optionsMap.set(val, label);
  };
  const unregisterOption = (val: T) => {
    optionsMap.delete(val);
  };

  // Helper to check if a value is selected (for Option highlighting)
  const isSelected = (val: T): boolean => {
    const current = selected();
    return isMultiple
      ? Array.isArray(current) && current.includes(val) 
      : current === val;
  };

  // Function to handle selecting/toggling an option
  const selectValue = (val: T) => {
    if (isMultiple) {
      // For multi-select, toggle the value in the array
      const current = (selected() ?? []) as T[];  // current selection array
      let newSelected: T[];
      console.log('current', current, val);
      
      if (current.includes(val)) {
        newSelected = current.filter(item => item !== val);
      } else {
        newSelected = [...current, val];
      }
      console.log('newSelected', newSelected);
      
      setSelected(newSelected);
      props.onChange?.(newSelected as any);               // emit onChange with new array
      // Do not close dropdown in multi-select (allow multiple selections)
    } else {
      // For single select, set the new value
      setSelected(() => val);
      props.onChange?.(val as any);                 // emit onChange with new value);
      setOpen(false);                              // close dropdown on single selection
    }
  };

  // Toggle dropdown open state
  const toggleOpen = () => {
    setOpen(!open());
  };

  // Close dropdown when clicking outside of the component
  onMount(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (open() && dropdownRef() && !dropdownRef()!.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    onCleanup(() => document.removeEventListener("mousedown", handleOutsideClick));
  });

  // Compute the content to display in the closed select (trigger area)
  const displayValue = createMemo<JSX.Element>(() => {
    const current = selected();
    if (isMultiple) {
      const selectedArray = Array.isArray(current) ? current : [];
      if (selectedArray.length === 0) {
        // Nothing selected, show placeholder
        return <span class="solid-select__placeholder">{props.placeholder || "Select..."}</span>;
      }
      if (props.renderValue) {
        // Use custom render function for multiple selection
        return props.renderValue(selectedArray as any);
      } else {
        // Default: join the labels of selected options by comma
        const labels = selectedArray.map(val => optionsMap.get(val) || String(val));
        return <span>{labels.join(", ")}</span>;
      }
    } else {
      // Single selection
      const singleVal = current as any;
      if (singleVal === undefined || singleVal === null) {
        return <span class="solid-select__placeholder">{props.placeholder || "Select..."}</span>;
      }
      if (props.renderValue) {
        return props.renderValue(singleVal);
      } else {
        // Default: use the label content from the Option (or value as string if not found)
        const label = optionsMap.get(singleVal) || String(singleVal);
        return <span>{label}</span>;
      }
    }
  });

  const selectLocation = () => {
    if (selectRef()) {
      const rect = selectRef()!.getBoundingClientRect();
      return { x: rect.left, y: rect.bottom };
    }
    return { x: 0, y: 0};
  };

  const selectWidth = () => {
    if (selectRef()) {
      return selectRef()!.getBoundingClientRect().width;
    }
    return 0;
  }

  createEffect(() => {
    console.log('selected', selected());
    
  })

  // Update width of select to match option text width
  createEffect(() => {
    if (selectRef() && dropdownRef()) {
      const dropdownWidth = dropdownRef()!.getBoundingClientRect().width;
      const selectWidth = selectRef()!.getBoundingClientRect().width;
      if (dropdownWidth > selectWidth) {
        setSelectRef((old)=>{
          if (!old) return;
          old.style.width = `${dropdownWidth}px`;
          return old;
        });
      }
    }
  })

  const isTransparent = Object.keys(props).includes("transparent") || props.transparent === true;
  const styleClass = !isTransparent ? "solid-select__" + currStyle : '';
  const styleClassDropdown = "solid-select__" + currStyle + "_dropdown";
  const styleClassTransparent = isTransparent ? "solid-select__transparent" : "";

  return (
    <div
      id={props.id} 
      ref={setSelectRef} 
      class={`solid-select ${styleClass} ${styleClassTransparent}`} 
      tabIndex={0}
      title={props.tooltip}
      onFocus={() => { /* (Optional) handle focus styling if needed */ }}
      onKeyDown={e => {
        // (Optional) keyboard support for navigation can be added here
        if (e.key === "Escape") setOpen(false);
      }}
    >
      {/* Trigger / selected value display */}
      <div class={`solid-select__control ${props.class || ""}`} onClick={toggleOpen}>
        <span class="solid-select__value">
          {displayValue()}
        </span>
        <Show when={open()}>
          <span class="solid-select__arrow">▲</span>
        </Show>
        <Show when={!open()}>
          <span class="solid-select__arrow">▼</span>
        </Show>
      </div>

      {/* Dropdown menu */}
      <SelectContext.Provider value={{ isSelected, selectValue, registerOption, unregisterOption, selectRef }}>
        {/* <div 
          class={`solid-select__dropdown ${props.dropdownClass || ""}`} 
          style={{ display: open() ? "block" : "none" }}
        >
          {props.children}
        </div> */}
        <Show when={open()}>
          <Portal>
            <div 
              class={`solid-select__dropdown ${styleClassDropdown} ${props.dropdownClass || ""}`}
              ref={setDropdownRef} 
              style={{ 
                top: `${selectLocation().y}px`, 
                left: `${selectLocation().x}px`,
                width: `${selectWidth()}px` 
              }}
            >
              {props.children}
            </div>
          </Portal>
        </Show>
      </SelectContext.Provider>
    </div>
  );
}
