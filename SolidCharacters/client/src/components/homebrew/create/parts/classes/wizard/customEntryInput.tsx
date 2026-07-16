import { Component, Show, createSignal } from 'solid-js';
import { Input } from 'coles-solid-library';
import styles from './stepEquipment.module.scss';

interface CustomEntryInputProps {
  /** Receives the trimmed text; the parent appends it as a custom chip. */
  onCommit: (text: string) => void;
  /** Hint shown in the expanded input; defaults to the equipment example. */
  placeholder?: string;
}

// Collapsed "+ text" affordance that expands into a small inline input for free-form
// option entries ("any martial weapon", "155 GP"). Enter commits, Escape cancels, and
// blurring with text also commits (via the library Input's blur-fired onChange) so a
// click elsewhere never discards what was typed.
export const CustomEntryInput: Component<CustomEntryInputProps> = (props) => {
  const [open, setOpen] = createSignal(false);
  const [text, setText] = createSignal('');

  // Reads the signal (not the event) and clears it, so the Enter and blur paths can
  // both call this without double-committing.
  const commit = () => {
    const value = text().trim();
    if (value) props.onCommit(value);
    setText('');
    setOpen(false);
  };

  return (
    <Show
      when={open()}
      fallback={
        <button
          type="button"
          class={styles.addCustomBtn}
          aria-label="Add custom text entry"
          onClick={(e) => {
            e.stopPropagation();
            setOpen(true);
          }}
        >
          + text
        </button>
      }
    >
      <span class={styles.customInput} onClick={(e) => e.stopPropagation()}>
        <Input
          value={text()}
          placeholder={props.placeholder ?? 'e.g. any martial weapon'}
          ref={(el: HTMLInputElement) => queueMicrotask(() => el.focus())}
          onInput={(e: InputEvent & { currentTarget: HTMLInputElement }) => setText(e.currentTarget.value)}
          onKeyDown={(e: KeyboardEvent) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              commit();
            } else if (e.key === 'Escape') {
              setText('');
              setOpen(false);
            }
          }}
          onChange={commit}
        />
      </span>
    </Show>
  );
};
