import { Component, JSX, Show } from 'solid-js';
import styles from './items.module.scss';

export interface SectionProps {
  id: string;
  title: string;
  icon?: JSX.Element;
  collapsed: boolean | undefined;
  onToggle: () => void;
  accentData?: Record<string, string | number | undefined>;
  children: JSX.Element;
}

// Generic wrapper for consistent collapsible section styling.
export const Section: Component<SectionProps> = (p) => (
  <div
    class={styles.flatSection}
    data-section={p.id}
    data-collapsed={p.collapsed ? 'true' : undefined}
    {...p.accentData}
  >
    <div class={styles.sectionHeader}>
      <div class={styles.titleWithIcon}>
        <Show when={p.icon}>{p.icon}</Show>
        <h4>{p.title}</h4>
      </div>
      <button type="button" class={styles.collapseBtn} onClick={p.onToggle}>
        {p.collapsed ? 'Expand' : 'Collapse'}
      </button>
    </div>
    <div class={styles.sectionContent}>{p.children}</div>
  </div>
);

export default Section;
