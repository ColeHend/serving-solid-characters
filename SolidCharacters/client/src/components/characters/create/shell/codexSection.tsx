import { Component, JSX, Show, createSignal } from "solid-js";
import styles from "./codexSection.module.scss";

interface CodexSectionProps {
  /** Roman numeral shown before the title ("I", "IX", ...). */
  index: string;
  title: string;
  /** Live selection summary rendered beside the title in gold. */
  summary?: JSX.Element;
  /** Explanatory line rendered at the top of the body. */
  subtitle?: JSX.Element;
  /** DOM id so other sections (the Review checklist) can scroll here. */
  id?: string;
  startOpen?: boolean;
  children: JSX.Element;
}

/**
 * Collapsible codex card: numeral · small-caps title · live summary · chevron.
 * Open/close uses the same measured-height animation as FlatCard.
 */
export const CodexSection: Component<CodexSectionProps> = (props) => {
  const [open, setOpen] = createSignal(props.startOpen !== false);
  const [contentRef, setContentRef] = createSignal<HTMLDivElement>();

  const openAnimated = () => {
    setOpen(true);
    const el = contentRef();
    if (!el) return;
    el.style.removeProperty("transition");
    el.style.height = "0px";
    void el.offsetHeight;
    el.style.transition = "height 300ms ease, opacity 200ms ease";
    el.style.height = `${el.scrollHeight}px`;
    el.style.opacity = "1";
    const onEnd = (e: TransitionEvent) => {
      if (e.propertyName !== "height") return;
      el.style.height = "auto";
      el.removeEventListener("transitionend", onEnd);
    };
    el.addEventListener("transitionend", onEnd);
  };

  const closeAnimated = () => {
    const el = contentRef();
    if (!el) {
      setOpen(false);
      return;
    }
    el.style.height = `${el.scrollHeight}px`;
    void el.offsetHeight;
    el.style.transition = "height 300ms ease, opacity 200ms ease";
    el.style.height = "0px";
    el.style.opacity = "0";
    const onEnd = (e: TransitionEvent) => {
      if (e.propertyName !== "height") return;
      el.removeEventListener("transitionend", onEnd);
      setOpen(false);
      el.style.removeProperty("height");
      el.style.removeProperty("transition");
      el.style.removeProperty("opacity");
    };
    el.addEventListener("transitionend", onEnd);
  };

  const toggle = () => (open() ? closeAnimated() : openAnimated());

  return (
    <section class={styles.section} id={props.id}>
      <header
        class={styles.header}
        onClick={toggle}
        tabIndex={0}
        role="button"
        aria-expanded={open()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            toggle();
          }
        }}
      >
        <span class={styles.numeral}>{props.index}</span>
        <h3 class={styles.title}>{props.title}</h3>
        <Show when={props.summary}>
          <span class={styles.summary}>{props.summary}</span>
        </Show>
        <span class={styles.chevron} classList={{ [styles.chevronClosed]: !open() }}>
          ▲
        </span>
      </header>
      <Show when={open()}>
        <div class={styles.content} ref={setContentRef}>
          <Show when={props.subtitle}>
            <p class={styles.subtitle}>{props.subtitle}</p>
          </Show>
          {props.children}
        </div>
      </Show>
    </section>
  );
};
